-- ============================================================
--  Plataforma Nutri — Migração 0073
--  RotuLens: o pagamento deixa de depender do navegador voltar
--
--  O BURACO QUE ISTO FECHA
--    Até aqui o código de acesso só nascia se a compradora voltasse do
--    checkout para o app (redirect_url). Quem paga pelo navegador do
--    Instagram volta PARA AQUELE navegador — e o app instalado na tela
--    inicial, que é onde ela vai usar, fica sem código nenhum. Foi o que
--    aconteceu com a própria Ana. Com o webhook, quem entrega é o
--    servidor da InfinitePay falando com o nosso: o navegador vira um
--    atalho, não a condição da entrega.
--
--  DUAS TABELAS, DOIS PAPÉIS
--    mercado_pagamentos  = o que a InfinitePay disse que aconteceu
--                          (payload cru, e-mail do comprador, status).
--    mercado_recuperacoes = quem pediu o código de volta, para o
--                          formulário de socorro não virar um oráculo.
--
--  POR QUE O E-MAIL É A CHAVE DE RECUPERAÇÃO
--    A compradora não tem login (é o ponto do produto: ela está no
--    corredor do mercado). O único dado que ela deu e consegue repetir
--    é o e-mail do checkout — a InfinitePay já coleta, então não se
--    pede nada de novo. O risco é conhecido e limitado: quem souber o
--    e-mail de uma assinante pode pedir o código dela, mas esbarra no
--    teto de 3 aparelhos por código (0066) e nas tentativas contadas
--    aqui. Recuperar acesso de quem pagou vale mais que esse risco.
-- ============================================================

-- ------------------------------------------------------------
-- 1) mercado_pagamentos — a trilha do dinheiro
--
--    PK no transaction_nsu: a InfinitePay reenvia o webhook quando não
--    recebe 200, e o mesmo pagamento não pode virar duas assinaturas.
--    'payload' guarda o POST cru porque os nomes reais dos campos deles
--    só se confirmam com pagamento de verdade — quando algo não for
--    extraído direito, a resposta está gravada aqui.
-- ------------------------------------------------------------
create table if not exists public.mercado_pagamentos (
  transaction_nsu text primary key,
  order_nsu       text,          -- 'rotulens-mensal' | 'rotulens-anual' | 'rotulens-pacote50'
  invoice_slug    text,          -- necessário para o payment_check
  produto         text,          -- 'assinatura' | 'creditos' | null (não reconhecido)

  email           text,
  nome            text,
  telefone        text,
  valor_centavos  int,

  -- O código criado/renovado por este pagamento. É ele que a
  -- recuperação por e-mail devolve; null enquanto não houver entrega.
  codigo          text,

  -- 'recebido' | 'confirmado' | 'entregue' | 'sem_slug' | 'nao_confirmado' | 'erro'
  status          text not null default 'recebido',
  detalhe         text,

  payload         jsonb not null default '{}'::jsonb,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

-- A pergunta da recuperação é sempre "qual o código mais recente deste
-- e-mail". lower() no índice porque ninguém digita o e-mail duas vezes
-- com a mesma caixa.
create index if not exists mercado_pagamentos_email_idx
  on public.mercado_pagamentos (lower(email), criado_em desc);

create index if not exists mercado_pagamentos_codigo_idx
  on public.mercado_pagamentos (codigo);

alter table public.mercado_pagamentos enable row level security;
-- Sem policy: é dinheiro e é dado pessoal do comprador (e-mail, telefone).
-- Só service_role, pelas edge functions.
revoke all on public.mercado_pagamentos from anon, authenticated;

-- ------------------------------------------------------------
-- 2) mercado_recuperacoes — o freio do formulário de socorro
--
--    Sem isto, um script pediria o código de mil e-mails por minuto até
--    achar um que existe. Guarda o e-mail tentado para a Ana conseguir
--    ver um ataque acontecendo; não guarda o código devolvido.
-- ------------------------------------------------------------
create table if not exists public.mercado_recuperacoes (
  id          bigserial primary key,
  dispositivo text not null,
  email       text,
  achou       boolean not null default false,
  criado_em   timestamptz not null default now()
);

create index if not exists mercado_recuperacoes_disp_idx
  on public.mercado_recuperacoes (dispositivo, criado_em desc);

alter table public.mercado_recuperacoes enable row level security;
revoke all on public.mercado_recuperacoes from anon, authenticated;

-- ------------------------------------------------------------
-- 3) Recuperar o código pelo e-mail da compra
--
--    Conta a tentativa ANTES de responder, e no mesmo lugar — se o
--    registro fosse uma segunda chamada da edge function, uma rajada
--    passaria inteira pela contagem antes de qualquer linha existir.
--
--    Só devolve código de assinatura VIGENTE (ou vencida há pouco): um
--    código de assinatura que venceu no ano passado não é acesso, é só
--    dado de outra pessoa vazando.
-- ------------------------------------------------------------
create or replace function public.mercado_recuperar_codigo(
  p_email       text,
  p_dispositivo text,
  p_limite_dia  int default 5
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_disp  text := coalesce(p_dispositivo, '');
  v_tent  int;
  v_cod   text;
  v_ass   record;
begin
  if v_email = '' or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    return jsonb_build_object('ok', false, 'motivo', 'email_invalido');
  end if;
  if length(v_disp) < 8 then
    return jsonb_build_object('ok', false, 'motivo', 'parametro');
  end if;

  select count(*) into v_tent
    from public.mercado_recuperacoes
   where dispositivo = v_disp
     and criado_em >= now() - interval '24 hours';

  if v_tent >= greatest(p_limite_dia, 1) then
    return jsonb_build_object('ok', false, 'motivo', 'muitas_tentativas');
  end if;

  -- O código mais recente que ESTE e-mail pagou. Pagamento sem código
  -- (não confirmado, ou confirmado sem entrega) não conta.
  select codigo into v_cod
    from public.mercado_pagamentos
   where lower(email) = v_email
     and codigo is not null
   order by criado_em desc
   limit 1;

  insert into public.mercado_recuperacoes (dispositivo, email, achou)
  values (v_disp, v_email, v_cod is not null);

  if v_cod is null then
    return jsonb_build_object('ok', false, 'motivo', 'nao_encontrado');
  end if;

  select * into v_ass from public.mercado_assinaturas where codigo = v_cod;
  if found then
    return jsonb_build_object(
      'ok',        true,
      'codigo',    v_cod,
      'tipo',      'assinatura',
      'plano',     v_ass.plano,
      'ativa',     v_ass.expira_em > now(),
      'expira_em', v_ass.expira_em
    );
  end if;

  -- Pacote de leituras antigo: o código existe em mercado_creditos.
  return jsonb_build_object('ok', true, 'codigo', v_cod, 'tipo', 'creditos');
end;
$$;

-- ------------------------------------------------------------
-- 4) Fechaduras
--
--    Exposta ao anon, a função acima seria exatamente o oráculo que ela
--    existe para evitar: dá para chamar RPC direto com a chave pública.
--    Quem chama é a edge function, com service_role.
-- ------------------------------------------------------------
revoke all on function public.mercado_recuperar_codigo(text, text, int)
  from public, anon, authenticated;
grant execute on function public.mercado_recuperar_codigo(text, text, int) to service_role;

notify pgrst, 'reload schema';
