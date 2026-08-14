-- ============================================================
--  Plataforma Nutri — Migração 0054
--  RECEITAS e ASSINATURA do app "No mercado com a Nutri Ana"
--
--  O QUE MUDA NO PRODUTO
--    Até aqui o app lia rótulo: dizia o que NÃO levar. Faltava a outra
--    metade da frase — o que fazer com o que se leva. As receitas são
--    isso, e são também o que faz alguém abrir o app fora do mercado.
--
--  TRÊS DECISÕES QUE EXPLICAM O ARQUIVO
--
--  1) A RECEITA COMPLETA NÃO TEM POLICY DE LEITURA.
--     mercado_produtos (0051) é catálogo público e qualquer um lê. Aqui
--     é o contrário: o acervo é o produto pago. Sem policy, a chave
--     pública não enxerga nada, e quem serve é a edge function
--     'mercado-receitas' com service_role — que confere o acesso ANTES
--     de mandar o modo de preparo. Se a trava morasse no JavaScript da
--     tela, bastaria abrir o inspetor para levar o acervo inteiro.
--
--  2) OS NÚMEROS SÃO CALCULADOS, NÃO ESTIMADOS.
--     kcal e proteína de cada receita saem da soma dos ingredientes pela
--     TACO (0052), dividida pelas porções — cada ingrediente guarda o
--     taco_id que o originou. Isso é assinado por nutricionista
--     registrada: "cerca de 300 kcal" chutado por um modelo de linguagem
--     não se sustenta perante o CRN, e a conta precisa ser refazível.
--
--  3) O TRÊS DE GRAÇA É CONTADO NO SERVIDOR, POR DISPOSITIVO.
--     Mesmo dispositivo do freio de leitura (0051): não identifica
--     pessoa e some se ela limpar o navegador. É deliberado — quem
--     apaga o app inteiro para ganhar mais três receitas não ia assinar
--     mesmo, e o custo desse abuso é zero (texto pronto no banco, sem
--     chamada de IA). O que não podia era o contador viver no
--     localStorage, onde ele é editável.
--
--  Res. CFN 856/2026: receita culinária é orientação geral, não é plano
--  alimentar nem prescrição dietética individualizada. Nenhuma receita
--  promete emagrecimento, cura ou trata doença, e a tela repete isso.
-- ============================================================

-- ------------------------------------------------------------
-- 1) mercado_receitas — o acervo
-- ------------------------------------------------------------
create table if not exists public.mercado_receitas (
  slug        text primary key,          -- 'omelete-de-forno-de-espinafre'
  titulo      text not null,
  chamada     text,                      -- a linha que vende a receita no cartão

  -- Como a pessoa procura: 'lowcarb','cetogenica','detox','vegetariana',
  -- 'vegana','sobremesa','salada','suco','principal','fruta','economica'.
  -- Array porque uma salada vegana também é lowcarb e também é econômica —
  -- obrigar uma categoria só faria o filtro mentir.
  categorias  text[] not null default '{}',

  -- Minutos de mão na massa, arredondado para a faixa que a tela oferece:
  -- 5, 10, 30, 60 ou 120. Não é o tempo do relógio (geladeira, forno frio):
  -- é o que a pessoa precisa ter de tempo livre, que é o que ela filtra.
  tempo_min   int not null,
  rende       int not null,              -- porções
  porcao_g    numeric,                   -- peso de uma porção, quando faz sentido

  -- POR PORÇÃO, calculados pela TACO. Ver mercado/calcular_receitas.py.
  kcal        numeric,
  ptn         numeric,
  cho         numeric,
  lip         numeric,
  fibra       numeric,

  -- [{item, medida, gramas, taco_id}] — 'medida' é como se compra e se
  -- mede na cozinha ("2 ovos", "1 xícara"); 'gramas' é o que entra na
  -- conta; 'taco_id' é a linha da TACO que deu o número.
  ingredientes jsonb not null default '[]'::jsonb,
  preparo      text[] not null default '{}',
  dica         text,                     -- o toque da nutri, opcional

  ordem       int not null default 100,  -- vitrine: menor primeiro
  publicada   boolean not null default true,
  criado_em   timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint mercado_receitas_tempo_ok check (tempo_min in (5, 10, 30, 60, 120)),
  constraint mercado_receitas_rende_ok check (rende >= 1)
);

create index if not exists mercado_receitas_cat_idx
  on public.mercado_receitas using gin (categorias);

create index if not exists mercado_receitas_tempo_idx
  on public.mercado_receitas (tempo_min, ordem);

-- Busca por nome e chamada ("bolo", "frango", "sem forno").
create index if not exists mercado_receitas_busca_idx
  on public.mercado_receitas using gin (
    to_tsvector('portuguese', coalesce(titulo,'') || ' ' || coalesce(chamada,''))
  );

alter table public.mercado_receitas enable row level security;
-- Sem policy: ver a decisão (1) no topo. Só service_role lê.

-- ------------------------------------------------------------
-- 2) mercado_assinaturas — quem pagou
--
--    Mesma identidade por CÓDIGO dos créditos (0053), e pelo mesmo
--    motivo: quem está no corredor do mercado não cria login, mas
--    'dispositivo' do localStorage não pode guardar uma COMPRA.
--    A diferença é que aqui não se gasta: vence.
-- ------------------------------------------------------------
create table if not exists public.mercado_assinaturas (
  codigo          text primary key,
  transaction_nsu text unique not null,
  order_nsu       text,
  valor_centavos  int,

  plano           text not null,          -- 'mensal' | 'anual'
  criado_em       timestamptz not null default now(),
  expira_em       timestamptz not null,
  ultimo_uso      timestamptz,
  renovacoes      int not null default 0,

  constraint mercado_assinaturas_plano_ok check (plano in ('mensal', 'anual'))
);

create index if not exists mercado_assinaturas_expira_idx
  on public.mercado_assinaturas (expira_em desc);

alter table public.mercado_assinaturas enable row level security;
-- Sem policy, como mercado_creditos: é dinheiro. Se o cliente pudesse
-- dar update aqui, ele daria a si mesmo uma assinatura vitalícia.

-- ------------------------------------------------------------
-- 3) mercado_receitas_vistas — as três de graça
--
--    PK composta (dispositivo, slug): reabrir uma receita que ela já
--    destravou não gasta outra. Só receita NOVA conta — senão a pessoa
--    perderia o acesso ao que já leu só por ter voltado nela.
-- ------------------------------------------------------------
create table if not exists public.mercado_receitas_vistas (
  dispositivo text not null,
  slug        text not null references public.mercado_receitas(slug) on delete cascade,
  criado_em   timestamptz not null default now(),
  primary key (dispositivo, slug)
);

alter table public.mercado_receitas_vistas enable row level security;
-- Sem policy: é o contador do limite grátis. Cliente que pudesse
-- apagar linha aqui teria receita infinita.

-- ------------------------------------------------------------
-- 4) Acesso: uma pergunta só, duas respostas possíveis
--
--    O app tem UM campo de código, e a pessoa não deveria precisar
--    saber se o que ela comprou foi "pacote" ou "assinatura". Esta
--    função responde pelos dois — a assinatura ganha da sobra de
--    créditos quando o mesmo código existir nas duas tabelas (não
--    existe hoje, mas amanhã existe).
-- ------------------------------------------------------------
create or replace function public.mercado_acesso(p_codigo text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  a record;
  c record;
begin
  select * into a from public.mercado_assinaturas where codigo = p_codigo;
  if found then
    return jsonb_build_object(
      'ok',        true,
      'tipo',      'assinatura',
      'plano',     a.plano,
      'ativa',     a.expira_em > now(),
      'expira_em', a.expira_em,
      'dias',      greatest(0, ceil(extract(epoch from (a.expira_em - now())) / 86400))::int
    );
  end if;

  select * into c from public.mercado_creditos where codigo = p_codigo;
  if found then
    return jsonb_build_object(
      'ok',     true,
      'tipo',   'creditos',
      'ativa',  c.creditos_usados < c.creditos_total,
      'restam', c.creditos_total - c.creditos_usados,
      'total',  c.creditos_total
    );
  end if;

  return jsonb_build_object('ok', false, 'motivo', 'inexistente');
end;
$$;

-- Marca uso e devolve se a assinatura vale AGORA. Separada de
-- mercado_acesso porque esta escreve (ultimo_uso) — a outra é stable e
-- pode ser chamada em toda pintura de tela sem sujar o banco.
create or replace function public.mercado_assinatura_valida(p_codigo text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_ok boolean;
begin
  update public.mercado_assinaturas
     set ultimo_uso = now()
   where codigo = p_codigo
     and expira_em > now()
  returning true into v_ok;
  return coalesce(v_ok, false);
end;
$$;

-- ------------------------------------------------------------
-- 5) Renovar sem trocar de código
--
--    Quem já é assinante e paga de novo continua com O MESMO código —
--    ela já guardou aquele. Somar sobre o vencimento (e não sobre hoje)
--    é o que impede que renovar cedo queime os dias que ela pagou.
-- ------------------------------------------------------------
create or replace function public.mercado_assinatura_renovar(
  p_codigo text,
  p_meses  int,
  p_nsu    text,
  p_order  text,
  p_valor  int,
  p_plano  text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare a record;
begin
  update public.mercado_assinaturas
     set expira_em  = greatest(expira_em, now()) + make_interval(months => p_meses),
         renovacoes = renovacoes + 1,
         plano      = p_plano,
         valor_centavos = p_valor,
         order_nsu  = coalesce(p_order, order_nsu)
   where codigo = p_codigo
  returning * into a;

  if not found then
    return jsonb_build_object('ok', false, 'motivo', 'inexistente');
  end if;

  -- Trilha do pagamento que renovou. A primeira compra guarda o nsu na
  -- coluna UNIQUE; as renovações ficam aqui, senão o UNIQUE recusaria.
  insert into public.mercado_assinatura_pagamentos
    (codigo, transaction_nsu, order_nsu, valor_centavos, plano)
  values (p_codigo, p_nsu, p_order, p_valor, p_plano)
  on conflict (transaction_nsu) do nothing;

  return jsonb_build_object(
    'ok', true, 'codigo', a.codigo, 'plano', a.plano,
    'expira_em', a.expira_em,
    'dias', greatest(0, ceil(extract(epoch from (a.expira_em - now())) / 86400))::int
  );
end;
$$;

-- Histórico de pagamentos da assinatura. Existe por causa da renovação:
-- o código é o mesmo, então o transaction_nsu do segundo pagamento não
-- cabe na linha da assinatura. É também o que torna a renovação
-- idempotente — recarregar a página de obrigado não soma outro mês.
create table if not exists public.mercado_assinatura_pagamentos (
  transaction_nsu text primary key,
  codigo          text not null references public.mercado_assinaturas(codigo) on delete cascade,
  order_nsu       text,
  valor_centavos  int,
  plano           text,
  criado_em       timestamptz not null default now()
);

alter table public.mercado_assinatura_pagamentos enable row level security;

-- ------------------------------------------------------------
-- 6) Fechaduras
-- ------------------------------------------------------------
revoke all on function public.mercado_acesso(text)              from public, anon, authenticated;
revoke all on function public.mercado_assinatura_valida(text)    from public, anon, authenticated;
revoke all on function public.mercado_assinatura_renovar(text, int, text, text, int, text)
  from public, anon, authenticated;

notify pgrst, 'reload schema';
