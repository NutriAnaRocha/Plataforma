-- ============================================================
--  Plataforma Nutri — Migração 0075
--  RotuLens: a chave do socorro passa a ser o RECIBO, não o e-mail
--
--  O QUE O PAGAMENTO REAL MOSTROU (20/08/2026, R$ 1,00 de teste)
--    O POST da InfinitePay não traz e-mail, nome nem telefone. Veio só
--    items, amount, order_nsu, paid_amount, receipt_url, installments,
--    invoice_slug, capture_method e transaction_nsu. Ou seja: a chave
--    escolhida na 0073 (o e-mail do checkout) simplesmente não existe
--    nos dados de uma compra nova — a tela "já paguei e não recebi meu
--    código" só achava os códigos que a Ana lançou à mão.
--
--  POR QUE O RECIBO É UMA CHAVE MELHOR, E NÃO SÓ A QUE SOBROU
--    receipt_url = https://recibo.infinitepay.io/<transaction_nsu>. É o
--    comprovante que a compradora tem no e-mail, no print ou no
--    histórico do cartão — ela consegue repetir. E, ao contrário do
--    e-mail, não se adivinha: pedir o recibo é pedir PROVA DE POSSE do
--    comprovante. O oráculo que a 0073 aceitava como risco calculado
--    ("quem souber o e-mail de uma assinante pede o código dela")
--    deixa de existir.
--
--  O E-MAIL CONTINUA VALENDO — mas como segunda porta
--    As compras que a Ana lançou à mão têm e-mail e não têm recibo. Se
--    o socorro só aceitasse recibo, a recuperação delas quebraria hoje.
--    Um campo só, que reconhece o que foi colado.
--
--  PROCURA NAS QUATRO TABELAS, NÃO SÓ EM mercado_pagamentos
--    mercado_pagamentos só existe desde a 0073. Quem comprou antes tem
--    o nsu em mercado_assinaturas / mercado_assinatura_pagamentos /
--    mercado_creditos e nenhuma linha de pagamento. Procurando nas
--    quatro, o recibo vira a chave de TODA compra já feita, inclusive
--    as de antes de o webhook existir.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Guardar o recibo em coluna própria
--
--    Ele já chega no payload, mas dentro do jsonb: consulta de suporte
--    ("qual o recibo dessa venda") não deveria depender de saber o
--    caminho da chave. E é o dado que a compradora vai colar.
-- ------------------------------------------------------------
alter table public.mercado_pagamentos
  add column if not exists receipt_url text;

-- ------------------------------------------------------------
-- 2) O registro da tentativa passa a guardar o que foi tentado
--
--    A coluna 'email' fica: as tentativas antigas continuam legíveis, e
--    é reescrevendo histórico de segurança que se perde a trilha.
--    'chave' é o texto realmente colado (recibo ou e-mail), truncado —
--    é o que a Ana vai olhar se houver um ataque.
-- ------------------------------------------------------------
alter table public.mercado_recuperacoes
  add column if not exists chave text;

-- ------------------------------------------------------------
-- 3) mercado_socorro_codigo — devolve o código pela chave colada
--
--    Nome novo em vez de create-or-replace porque o parâmetro deixou de
--    ser p_email: o Postgres não deixa renomear parâmetro de função
--    existente, e a edge function chama por nome.
--
--    A trava continua aqui dentro, junto com o registro da tentativa.
--    Se a contagem fosse uma segunda chamada da edge function, uma
--    rajada simultânea passaria inteira antes de a primeira linha
--    existir.
-- ------------------------------------------------------------
create or replace function public.mercado_socorro_codigo(
  p_chave       text,
  p_dispositivo text,
  p_limite_dia  int default 5
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_txt   text := btrim(coalesce(p_chave, ''));
  v_disp  text := coalesce(p_dispositivo, '');
  v_email text := null;
  v_nsu   text := null;
  v_tent  int;
  v_cod   text;
  v_ass   record;
begin
  if length(v_disp) < 8 then
    return jsonb_build_object('ok', false, 'motivo', 'parametro');
  end if;

  -- ---- Que tipo de chave é essa? ----
  if v_txt ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    v_email := lower(v_txt);
  else
    -- O recibo colado inteiro, com http, com espaço no fim, com o
    -- "?utm" que o app de e-mail grudou: o que interessa é o nsu.
    v_nsu := lower(substring(
      v_txt from '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'
    ));
    if v_nsu is null then
      -- Não era um uuid: pode ser um formato de nsu que ainda não vimos.
      -- Fica o último pedaço do caminho, sem query string nem âncora.
      v_nsu := lower(btrim(regexp_replace(
        split_part(split_part(v_txt, '?', 1), '#', 1), '^.*/', ''
      )));
    end if;
    if v_nsu is null or v_nsu !~ '^[a-z0-9._-]{8,64}$' then
      return jsonb_build_object('ok', false, 'motivo', 'chave_invalida');
    end if;
  end if;

  -- ---- O freio, antes de qualquer resposta ----
  select count(*) into v_tent
    from public.mercado_recuperacoes
   where dispositivo = v_disp
     and criado_em >= now() - interval '24 hours';

  if v_tent >= greatest(p_limite_dia, 1) then
    return jsonb_build_object('ok', false, 'motivo', 'muitas_tentativas');
  end if;

  -- ---- A procura ----
  if v_email is not null then
    -- Só onde existe e-mail: as compras que a Ana lançou à mão.
    select codigo into v_cod
      from public.mercado_pagamentos
     where lower(email) = v_email
       and codigo is not null
     order by criado_em desc
     limit 1;
  else
    -- O nsu do recibo pode estar em qualquer uma das quatro trilhas,
    -- dependendo de quando a compra foi feita e de quem entregou o
    -- código (webhook, redirect, ou renovação de assinatura antiga).
    select t.codigo into v_cod from (
      select codigo, criado_em
        from public.mercado_pagamentos
       where codigo is not null
         and (lower(transaction_nsu) = v_nsu
              or lower(coalesce(receipt_url, '')) like '%' || v_nsu)
      union all
      select codigo, criado_em
        from public.mercado_assinaturas
       where lower(transaction_nsu) = v_nsu
      union all
      select codigo, criado_em
        from public.mercado_assinatura_pagamentos
       where lower(transaction_nsu) = v_nsu
      union all
      select codigo, criado_em
        from public.mercado_creditos
       where lower(transaction_nsu) = v_nsu
    ) t
     order by t.criado_em desc
     limit 1;
  end if;

  insert into public.mercado_recuperacoes (dispositivo, email, chave, achou)
  values (v_disp, v_email, left(coalesce(v_email, v_nsu), 120), v_cod is not null);

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

  -- Pacote de leituras: o código existe em mercado_creditos.
  return jsonb_build_object('ok', true, 'codigo', v_cod, 'tipo', 'creditos');
end;
$$;

-- ------------------------------------------------------------
-- 4) Fechaduras
--
--    Exposta ao anon, esta função seria o oráculo que ela existe para
--    evitar — dá para chamar RPC direto com a chave pública. Quem
--    chama é a edge function, com service_role.
-- ------------------------------------------------------------
revoke all on function public.mercado_socorro_codigo(text, text, int)
  from public, anon, authenticated;
grant execute on function public.mercado_socorro_codigo(text, text, int) to service_role;

-- A versão por e-mail sai de cena: a edge function passa a chamar a
-- nova, e deixar as duas seria manter viva a porta que a 0073 abriu.
drop function if exists public.mercado_recuperar_codigo(text, text, int);

notify pgrst, 'reload schema';
