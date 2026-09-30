-- ============================================================
--  Plataforma Nutri — Migração 0091
--  NOVA TABELA DE PREÇOS (14/09/2026) e o CADASTRO PÚBLICO DA NUTRI.
--
--  1) Os níveis deixam de ser "posição na vitrine" e passam a ser PRODUTO:
--       gratis     → trial de 14 dias (o app inteiro + a vitrine, como isca)
--       plataforma → R$ 69,90/mês · só o app, sem vitrine
--       vitrine    → R$ 79,90/mês · app + perfil publicado em Encontre sua nutri
--       completo   → R$ 99,90/mês · vitrine + automação de WhatsApp
--     'essencial' e 'indicada' (0090) viram 'plataforma' e 'vitrine'.
--
--     Consequência deliberada: quem assina só 'plataforma' NÃO aparece na
--     vitrine — ela não comprou divulgação. Quem está em trial APARECE: é o
--     que prova o valor antes da cobrança, e é o que mantém o diretório com
--     gente dentro enquanto a base é pequena.
--
--  2) Cadastro público: a nutri passa a se inscrever sozinha em /seja-indicada.
--     A conta nasce em trial e o perfil em 'em_analise' — nada vai ao ar antes
--     de a Ana conferir o CRN (CFN 856: não se anuncia quem não tem registro
--     ativo). nutri_cadastros guarda a inscrição e a fila de análise.
-- ============================================================

-- ---------- 1) Os novos níveis ----------
-- O trigger da 0086 barra update direto em plano_tier; a conversão levanta
-- app.allow_curadoria, como a 0090 faz no backfill dela.
alter table public.profiles drop constraint if exists profiles_plano_tier_chk;

do $$
begin
  perform set_config('app.allow_curadoria', 'on', true);
  update public.profiles set plano_tier = 'plataforma' where plano_tier = 'essencial';
  update public.profiles set plano_tier = 'vitrine'    where plano_tier = 'indicada';
end $$;

alter table public.profiles add constraint profiles_plano_tier_chk
  check (plano_tier in ('gratis','plataforma','vitrine','completo'));

-- Ciclo de cobrança contratado — só informativo aqui; quem cobra é o provedor.
alter table public.profiles
  add column if not exists plano_ciclo text not null default 'mensal';
alter table public.profiles drop constraint if exists profiles_plano_ciclo_chk;
alter table public.profiles add constraint profiles_plano_ciclo_chk
  check (plano_ciclo in ('mensal','trimestral','semestral','anual'));

-- ---------- 2) As RPCs de billing falam os nomes novos ----------
drop function if exists public.ativar_assinatura(text, int, text, text, text);

create or replace function public.ativar_assinatura(
  p_email    text,
  p_meses    int  default 1,
  p_provider text default null,
  p_ref      text default null,
  p_tier     text default 'plataforma',  -- 'plataforma' | 'vitrine' | 'completo'
  p_ciclo    text default null           -- 'mensal' | 'trimestral' | 'semestral' | 'anual'
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id    uuid;
  v_base  timestamptz;
  v_ciclo text;
begin
  -- Nomes antigos continuam aceitos: o webhook da InfinitePay e os links de
  -- pagamento já emitidos ainda mandam 'essencial'/'indicada'.
  if p_tier = 'essencial' then p_tier := 'plataforma'; end if;
  if p_tier = 'indicada'  then p_tier := 'vitrine';    end if;
  if p_tier not in ('plataforma','vitrine','completo') then p_tier := 'plataforma'; end if;

  v_ciclo := coalesce(p_ciclo, case p_meses when 3 then 'trimestral'
                                            when 6 then 'semestral'
                                            when 12 then 'anual'
                                            else 'mensal' end);
  if v_ciclo not in ('mensal','trimestral','semestral','anual') then v_ciclo := 'mensal'; end if;

  perform set_config('app.allow_billing',  'on', true);
  perform set_config('app.allow_curadoria','on', true);

  select id, assinatura_expira_em into v_id, v_base
    from public.profiles where lower(email) = lower(p_email) limit 1;
  if v_id is null then
    return; -- sem conta ainda; o webhook cria a conta antes de chamar.
  end if;
  if v_base is null or v_base < now() then v_base := now(); end if;

  update public.profiles
     set assinatura_status = 'ativa',
         assinatura_expira_em = v_base + (p_meses || ' months')::interval,
         assinatura_provider = coalesce(p_provider, assinatura_provider),
         assinatura_ref = coalesce(p_ref, assinatura_ref),
         plano_tier = p_tier,
         plano_ciclo = v_ciclo
   where id = v_id;
end; $$;

create or replace function public.definir_tier(p_email text, p_tier text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.sou_admin() then raise exception 'só a administração muda o plano'; end if;
  if p_tier = 'essencial' then p_tier := 'plataforma'; end if;
  if p_tier = 'indicada'  then p_tier := 'vitrine';    end if;
  if p_tier not in ('gratis','plataforma','vitrine','completo') then
    raise exception 'plano inválido: %', p_tier;
  end if;
  perform set_config('app.allow_curadoria', 'on', true);
  update public.profiles set plano_tier = p_tier where lower(email) = lower(p_email);
end; $$;

-- ---------- 3) A fila do cadastro público ----------
create table if not exists public.nutri_cadastros (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete set null,
  nome           text not null,
  email          text not null,
  telefone       text,
  crn            text not null,
  estado         text,
  cidade         text,
  -- respostas do quiz de inscrição, como vieram da tela
  atende_online     boolean not null default true,
  atende_presencial boolean not null default false,
  especialidades text[] not null default '{}',
  atuacao_desde  integer,
  motivo_entrada text,
  -- o que ela escolheu comprar no fim do quiz
  plano_tier     text not null default 'vitrine',
  plano_ciclo    text not null default 'mensal',
  -- curadoria
  status         text not null default 'pendente',
  analise_obs    text,
  analisado_por  uuid references auth.users(id) on delete set null,
  analisado_em   timestamptz,
  email_enviado  boolean not null default false,
  criado_em      timestamptz not null default now()
);

alter table public.nutri_cadastros drop constraint if exists nutri_cadastros_status_chk;
alter table public.nutri_cadastros add constraint nutri_cadastros_status_chk
  check (status in ('pendente','aprovado','recusado'));

create index if not exists nutri_cadastros_status_idx
  on public.nutri_cadastros (status, criado_em desc);
create unique index if not exists nutri_cadastros_email_uidx
  on public.nutri_cadastros (lower(email));

alter table public.nutri_cadastros enable row level security;

-- A inscrição entra pela edge function com service_role (que ignora RLS).
-- Pela API pública ninguém lê nem escreve: a fila tem telefone e e-mail de
-- terceiros. Só a administração enxerga.
drop policy if exists nutri_cadastros_admin on public.nutri_cadastros;
create policy nutri_cadastros_admin on public.nutri_cadastros
  for all using (public.sou_admin()) with check (public.sou_admin());

-- A própria nutri pode ver a inscrição dela (o app mostra "em análise").
drop policy if exists nutri_cadastros_dona on public.nutri_cadastros;
create policy nutri_cadastros_dona on public.nutri_cadastros
  for select using (user_id = auth.uid());

notify pgrst, 'reload schema';
