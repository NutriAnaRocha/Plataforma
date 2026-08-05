-- ============================================================
-- 0053 — Créditos avulsos do app "No mercado com a Nutri Ana"
--
-- O QUE ISSO RESOLVE
--   O app é gratuito com limite diário (3 leituras sem conta, 15 para
--   paciente da Ana). Quem quer ler mais compra um pacote de leituras
--   pelo InfinitePay. Não é assinatura: é crédito que acaba e não vence.
--
-- POR QUE CÓDIGO, E NÃO CADASTRO
--   Quem está no corredor do mercado não cria login — essa decisão é a
--   base do app desde a 0051. Mas o 'dispositivo' do localStorage não
--   serve para guardar uma COMPRA: some quando a pessoa limpa o
--   navegador ou troca de celular, e aí ela pagou e perdeu. O código é
--   a identidade mínima que sobrevive a isso: ela guarda, digita em
--   qualquer aparelho, e os créditos voltam.
--
-- IDEMPOTÊNCIA
--   transaction_nsu é UNIQUE. Se a pessoa recarregar a página de
--   obrigado dez vezes, o resgate acontece uma vez só — as outras nove
--   reencontram o mesmo código em vez de criar dez pacotes de brinde.
-- ============================================================

create table if not exists public.mercado_creditos (
  codigo           text primary key,          -- 'R7QK-3M9F' — o que a pessoa guarda
  transaction_nsu  text unique not null,      -- pagamento que gerou (InfinitePay)
  order_nsu        text,
  valor_centavos   int,

  creditos_total   int  not null,
  creditos_usados  int  not null default 0,

  criado_em        timestamptz not null default now(),
  ultimo_uso       timestamptz,

  constraint mercado_creditos_usados_ok
    check (creditos_usados >= 0 and creditos_usados <= creditos_total)
);

alter table public.mercado_creditos enable row level security;

-- Sem policy nenhuma = ninguém lê nem escreve com a chave pública.
-- Só as edge functions (service_role) tocam nisto. É dinheiro: se o
-- cliente pudesse dar update aqui, daria a si mesmo créditos infinitos.
-- Mesmo padrão de 'compras' e 'google_oauth_state'.

-- Auditoria: qual pacote pagou por esta leitura. Fica NULO nas leituras
-- gratuitas, que continuam sendo a maioria.
alter table public.mercado_analises
  add column if not exists codigo_credito text;

create index if not exists mercado_analises_codigo_dia
  on public.mercado_analises (codigo_credito, criado_em desc)
  where codigo_credito is not null;

-- ------------------------------------------------------------
-- Consumir 1 crédito — ATÔMICO
--
--   O update com 'creditos_usados < creditos_total' na cláusula WHERE
--   é o que impede a corrida: duas leituras disparadas no mesmo
--   instante com o último crédito não passam as duas, porque a segunda
--   não encontra linha para atualizar. Fazer 'select saldo' e depois
--   'update' seria a versão com bug.
-- ------------------------------------------------------------
create or replace function public.mercado_consumir_credito(p_codigo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_restam int;
  v_existe boolean;
begin
  update public.mercado_creditos
     set creditos_usados = creditos_usados + 1,
         ultimo_uso      = now()
   where codigo = p_codigo
     and creditos_usados < creditos_total
  returning creditos_total - creditos_usados into v_restam;

  if found then
    return jsonb_build_object('ok', true, 'restam', v_restam);
  end if;

  -- Não consumiu: ou o código não existe, ou acabou. A pessoa merece
  -- saber qual dos dois — "código errado" e "seus créditos acabaram"
  -- pedem reações bem diferentes dela.
  select true into v_existe from public.mercado_creditos where codigo = p_codigo;
  return jsonb_build_object('ok', false, 'motivo',
    case when v_existe then 'esgotado' else 'inexistente' end);
end;
$$;

create or replace function public.mercado_saldo(p_codigo text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when c.codigo is null
    then jsonb_build_object('ok', false, 'motivo', 'inexistente')
    else jsonb_build_object(
      'ok', true,
      'restam', c.creditos_total - c.creditos_usados,
      'total',  c.creditos_total,
      'desde',  c.criado_em)
  end
  from (select null::text as codigo) vazio
  left join public.mercado_creditos c on c.codigo = p_codigo;
$$;

-- Ninguém chama isto com a chave pública. Só service_role, pela edge
-- function, que é quem confere o pagamento antes.
revoke all on function public.mercado_consumir_credito(text) from public, anon, authenticated;
revoke all on function public.mercado_saldo(text)            from public, anon, authenticated;

notify pgrst, 'reload schema';
