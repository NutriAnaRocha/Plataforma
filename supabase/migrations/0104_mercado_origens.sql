-- ============================================================
--  0104 - De qual anúncio a pessoa veio (RotuLens)
--
--  Antes de gastar com tráfego pago, o painel precisa responder
--  "qual anúncio trouxe gente que leu e gente que pagou". O GA4 não
--  responde: só carrega depois do "Aceitar" e não sabe o que é
--  leitura nem assinatura. Aqui a origem fica no NOSSO banco, ligada
--  ao mesmo identificador de aparelho que o app já usa.
--
--  Regra: vale o PRIMEIRO clique com utm (first-touch). A linha é
--  gravada na visita, então conta também quem clicou e não leu. O
--  que entra na conta do anúncio é só o que aconteceu DEPOIS do
--  clique: quem já usava o app e um dia tocou num anúncio não
--  empresta o histórico antigo para ele.
--
--  Limites conhecidos (estão escritos também na tela do painel):
--   - o navegador de dentro do Instagram e o app instalado guardam
--     dados separados; quem clica no anúncio e depois instala vira
--     outro aparelho, sem origem;
--   - a assinatura é ligada ao aparelho por
--     mercado_codigo_dispositivos, que só nasce na primeira leitura
--     feita com o código pago.
-- ============================================================

create table if not exists public.mercado_origens (
  dispositivo   text primary key check (length(dispositivo) between 8 and 64),
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  utm_content   text,
  criado_em     timestamptz not null default now()
);

comment on table public.mercado_origens is
  'Primeira origem com utm de cada aparelho do RotuLens. Alimenta o bloco "De onde vieram" do painel.';

create index if not exists mercado_origens_criado on public.mercado_origens (criado_em);

alter table public.mercado_origens enable row level security;
-- Sem policy: ninguém lê nem escreve direto. A escrita passa pela função
-- abaixo e a leitura pela mercado_painel_anuncios (service_role).
revoke all on public.mercado_origens from anon;
revoke all on public.mercado_origens from authenticated;

-- ------------------------------------------------------------
--  Gravação, chamada pelo app (anon).
--
--  Tudo que chega aqui foi escrito pelo cliente, então a função só
--  aceita o que tem cara de utm (letra, número, _ . -) e descarta o
--  resto em silêncio. Nunca sobrescreve: a primeira origem fica.
--  O teto diário existe para um script não encher a tabela; 2000
--  aparelhos novos num dia está muito acima de qualquer campanha dela.
-- ------------------------------------------------------------
create or replace function public.mercado_registrar_origem(
  p_dispositivo text,
  p_source      text default null,
  p_medium      text default null,
  p_campaign    text default null,
  p_content     text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_s text := lower(btrim(coalesce(p_source, '')));
  v_m text := lower(btrim(coalesce(p_medium, '')));
  v_c text := lower(btrim(coalesce(p_campaign, '')));
  v_a text := lower(btrim(coalesce(p_content, '')));
begin
  if p_dispositivo is null or p_dispositivo !~ '^[A-Za-z0-9-]{8,64}$' then return; end if;

  if v_s !~ '^[a-z0-9_.-]{1,60}$' then v_s := null; end if;
  if v_m !~ '^[a-z0-9_.-]{1,60}$' then v_m := null; end if;
  if v_c !~ '^[a-z0-9_.-]{1,60}$' then v_c := null; end if;
  if v_a !~ '^[a-z0-9_.-]{1,60}$' then v_a := null; end if;
  if v_s is null and v_c is null and v_a is null then return; end if;

  if (select count(*) from mercado_origens
      where criado_em > now() - interval '1 day') >= 2000 then
    return;
  end if;

  insert into mercado_origens (dispositivo, utm_source, utm_medium, utm_campaign, utm_content)
  values (p_dispositivo, v_s, v_m, v_c, v_a)
  on conflict (dispositivo) do nothing;
end;
$$;

comment on function public.mercado_registrar_origem(text, text, text, text, text) is
  'Grava a primeira origem (utm) de um aparelho do RotuLens. Chamada pelo app; valida tudo e nunca sobrescreve.';

revoke all on function public.mercado_registrar_origem(text, text, text, text, text) from public;
grant execute on function public.mercado_registrar_origem(text, text, text, text, text)
  to anon, authenticated, service_role;

-- ------------------------------------------------------------
--  Leitura, para o painel. Uma linha por anúncio (source +
--  campaign + content), já sem os aparelhos, códigos e e-mails da
--  lista mercado_internos — mesma regra da mercado_painel.
-- ------------------------------------------------------------
create or replace function public.mercado_painel_anuncios(p_dias int default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_desde timestamptz := now() - make_interval(days => greatest(coalesce(p_dias, 30), 1));
  v_disp  text[];
  v_cod   text[];
  v_mail  text[];
  v_out   jsonb;
begin
  select coalesce(array_agg(lower(valor)) filter (where tipo = 'email'), '{}'),
         coalesce(array_agg(valor)        filter (where tipo = 'codigo'), '{}'),
         coalesce(array_agg(valor)        filter (where tipo = 'dispositivo'), '{}')
    into v_mail, v_cod, v_disp
  from mercado_internos;

  v_cod := v_cod || coalesce((
    select array_agg(distinct codigo) from mercado_pagamentos
    where codigo is not null and lower(coalesce(email, '')) = any(v_mail)
  ), '{}');

  v_disp := v_disp || coalesce((
    select array_agg(distinct dispositivo) from mercado_codigo_dispositivos
    where codigo = any(v_cod)
  ), '{}');

  with o as (
    select * from mercado_origens
    where criado_em >= v_desde and not (dispositivo = any(v_disp))
  ),
  l as (
    select a.dispositivo, count(*) n
    from mercado_analises a
    join o on o.dispositivo = a.dispositivo
    where a.criado_em >= o.criado_em
    group by 1
  ),
  -- Um código pago conta para UM aparelho só: o primeiro que o usou.
  dono as (
    select distinct on (codigo) codigo, dispositivo
    from mercado_codigo_dispositivos
    order by codigo, primeiro_uso
  ),
  p as (
    select o.dispositivo, count(distinct pg.codigo) codigos,
           count(*) pagamentos, coalesce(sum(pg.valor_centavos), 0) centavos
    from o
    join dono on dono.dispositivo = o.dispositivo
    join mercado_pagamentos pg on pg.codigo = dono.codigo
    where pg.status = 'entregue'
      and pg.criado_em >= o.criado_em
      and not (pg.codigo = any(v_cod))
      and not (lower(coalesce(pg.email, '')) = any(v_mail))
    group by 1
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'source', t.utm_source, 'medium', t.utm_medium,
           'campaign', t.utm_campaign, 'content', t.utm_content,
           'visitas', t.visitas, 'leram', t.leram, 'leituras', t.leituras,
           'assinaturas', t.assinaturas, 'pagamentos', t.pagamentos,
           'centavos', t.centavos, 'primeira', t.primeira, 'ultima', t.ultima
         ) order by t.visitas desc, t.utm_content), '[]'::jsonb)
    into v_out
  from (
    select o.utm_source, o.utm_medium, o.utm_campaign, o.utm_content,
           count(*) visitas,
           count(l.dispositivo) leram,
           coalesce(sum(l.n), 0) leituras,
           coalesce(sum(p.codigos), 0) assinaturas,
           coalesce(sum(p.pagamentos), 0) pagamentos,
           coalesce(sum(p.centavos), 0) centavos,
           min(o.criado_em) primeira, max(o.criado_em) ultima
    from o
    left join l on l.dispositivo = o.dispositivo
    left join p on p.dispositivo = o.dispositivo
    group by 1, 2, 3, 4
  ) t;

  return v_out;
end;
$$;

comment on function public.mercado_painel_anuncios(int) is
  'Visitas, leituras e assinaturas do RotuLens por anúncio (utm), sem os internos. Só o service_role executa.';

revoke all on function public.mercado_painel_anuncios(int) from public;
revoke all on function public.mercado_painel_anuncios(int) from anon;
revoke all on function public.mercado_painel_anuncios(int) from authenticated;
grant execute on function public.mercado_painel_anuncios(int) to service_role;

notify pgrst, 'reload schema';
