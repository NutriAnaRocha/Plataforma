-- ============================================================
--  Plataforma Nutri — Migração 0086
--  PERFIL PÚBLICO da nutricionista (a vitrine do diretório).
--
--  Contexto: até aqui a plataforma só entregava valor a quem JÁ tinha
--  paciente — toda conta nasce por convite e nada é visível de fora.
--  Esta migração cria a camada de vitrine: a nutri monta um perfil, a Ana
--  aprova, e ele passa a aparecer na busca pública do site.
--
--  Três famílias de coluna, com destinos diferentes:
--    - CARD     (slug, apresentacao, preço, modalidade...) → a lista da busca.
--    - PERFIL   (formação, pós-graduação, tempo de atuação) → só na página
--      da nutri, onde o paciente quer saber quem vai atendê-lo.
--    - ANÁLISE  (motivo_entrada, analise_observacao) → só a própria nutri e
--      a Ana leem. NUNCA entram na lista branca servida ao público.
--
--  Por que a vitrine sai por edge function e não por policy de RLS:
--  RLS filtra LINHA, não COLUNA. Uma policy "perfil publicado é legível por
--  todos" exporia telefone, is_admin, assinatura_status e carimbo_url de
--  quem publicasse. A function com service_role devolve só as colunas do card.
--
--  perfil_status e plano_tier são somente-leitura para a própria nutri
--  (trigger abaixo) — senão bastaria um update no console pra se auto-aprovar
--  e se promover ao topo da busca. Mesmo desenho do billing na 0038.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Colunas de vitrine e de análise em profiles.
--    A nutri já É uma linha de profiles — não existe tabela separada.
--    instagram/site (0007) e avatar_url (0009) já existem: entram como
--    obrigatórios da publicação, não como colunas novas.
-- ------------------------------------------------------------
alter table public.profiles
  -- vitrine
  add column if not exists slug                text,
  add column if not exists perfil_status       text not null default 'rascunho',
  add column if not exists perfil_recusa_motivo text,
  add column if not exists apresentacao        text,
  add column if not exists atende_online       boolean not null default true,
  add column if not exists atende_presencial   boolean not null default false,
  add column if not exists estado              text,
  add column if not exists preco_consulta_cents integer,
  add column if not exists aceita_novos        boolean not null default true,
  add column if not exists publicado_em        timestamptz,
  add column if not exists plano_tier          text not null default 'gratis',
  -- perfil (aparecem na página da nutri, não no card da lista)
  add column if not exists formacao            text,
  add column if not exists ano_formatura       integer,
  add column if not exists pos_graduacao       text[] not null default '{}',
  add column if not exists atuacao_desde       integer,
  -- análise (privadas)
  add column if not exists motivo_entrada      text,
  add column if not exists analise_observacao  text;

alter table public.profiles drop constraint if exists profiles_perfil_status_chk;
alter table public.profiles add constraint profiles_perfil_status_chk
  check (perfil_status in ('rascunho','em_analise','aprovado','recusado'));

alter table public.profiles drop constraint if exists profiles_plano_tier_chk;
alter table public.profiles add constraint profiles_plano_tier_chk
  check (plano_tier in ('gratis','essencial','indicada'));

-- A apresentação é o que conecta com o paciente. Curta demais não diz nada,
-- longa demais quebra o card. A trava vale pro banco inteiro, não só pra tela.
alter table public.profiles drop constraint if exists profiles_apresentacao_chk;
alter table public.profiles add constraint profiles_apresentacao_chk
  check (apresentacao is null or char_length(apresentacao) between 40 and 220);

-- Slug único e case-insensitive (a URL /nutri/<slug> é o endereço dela).
create unique index if not exists profiles_slug_uidx
  on public.profiles (lower(slug)) where slug is not null;

-- Filtro por especialidade na busca: array overlap (&&) usa GIN.
create index if not exists profiles_area_gin
  on public.profiles using gin (area_atuacao);

-- Ordenação da vitrine: tier + aceita_novos, só entre perfis aprovados.
create index if not exists profiles_vitrine_idx
  on public.profiles (plano_tier, aceita_novos) where perfil_status = 'aprovado';

-- ------------------------------------------------------------
-- 2) sou_admin(): quem é admin, sem recursão de RLS.
--    Uma policy DE profiles não pode consultar profiles no próprio USING
--    (o Postgres estoura "infinite recursion detected in policy"). Esta
--    função SECURITY DEFINER lê ignorando RLS e quebra o ciclo.
-- ------------------------------------------------------------
create or replace function public.sou_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

-- A Ana precisa ler o perfil das outras nutris pra analisar a fila.
-- Sem isto a tela de aprovação abriria vazia (profiles só tinha select_own).
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin" on public.profiles
  for select using (public.sou_admin());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update using (public.sou_admin()) with check (public.sou_admin());

-- ------------------------------------------------------------
-- 3) Curadoria é somente-leitura para a própria nutri.
--    Espelha guard_billing_cols (0038), com flag própria: o webhook de
--    pagamento levanta app.allow_billing e NÃO pode, com isso, aprovar
--    um perfil de tabela.
-- ------------------------------------------------------------
create or replace function public.guard_curadoria_cols()
returns trigger language plpgsql as $$
begin
  if (new.perfil_status is distinct from old.perfil_status
   or new.plano_tier    is distinct from old.plano_tier
   or new.analise_observacao is distinct from old.analise_observacao)
   and coalesce(current_setting('app.allow_curadoria', true), 'off') <> 'on' then
    raise exception 'perfil_status/plano_tier só mudam por curadoria ou pagamento';
  end if;
  return new;
end; $$;

drop trigger if exists trg_guard_curadoria on public.profiles;
create trigger trg_guard_curadoria
  before update on public.profiles
  for each row execute function public.guard_curadoria_cols();

-- ------------------------------------------------------------
-- 4) Tabela de domínio das especialidades.
--    area_atuacao (0011) continua guardando os NOMES, como a tela Perfil
--    Profissional já grava — esta tabela normaliza o vocabulário para os
--    checkboxes e para os filtros da busca, sem migrar dado existente.
--    Leitura aberta: é vocabulário de vitrine, não tem nada sensível.
-- ------------------------------------------------------------
create table if not exists public.especialidades (
  slug  text primary key,
  nome  text not null unique,
  ordem integer not null default 100,
  ativa boolean not null default true
);

alter table public.especialidades enable row level security;

drop policy if exists "especialidades_leitura_publica" on public.especialidades;
create policy "especialidades_leitura_publica" on public.especialidades
  for select to anon, authenticated using (true);

drop policy if exists "especialidades_admin_all" on public.especialidades;
create policy "especialidades_admin_all" on public.especialidades
  for all using (public.sou_admin()) with check (public.sou_admin());

-- As 5 primeiras são exatamente as que perfil-profissional.js já oferece —
-- os perfis existentes continuam batendo. O resto abre o leque do diretório.
insert into public.especialidades (slug, nome, ordem) values
  ('nutricao-clinica',  'Nutrição clínica',           10),
  ('saude-da-mulher',   'Saúde da mulher',            20),
  ('emagrecimento',     'Emagrecimento',              30),
  ('esportiva',         'Nutrição esportiva',         40),
  ('fitoterapia',       'Fitoterapia',                50),
  ('fertilidade',       'Fertilidade',                60),
  ('gestacao',          'Gestação e amamentação',     70),
  ('infantil',          'Nutrição infantil',          80),
  ('intestino',         'Saúde intestinal',           90),
  ('comportamento',     'Comportamento alimentar',   100),
  ('vegetarianismo',    'Vegetarianismo e veganismo',110),
  ('oncologia',         'Oncologia',                 120)
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- 5) slugify(): "Ana Luísa Rocha" → "ana-luisa-rocha".
--    unaccent é extensão que pode não estar instalada no projeto; translate
--    resolve os acentos do português sem depender disso.
-- ------------------------------------------------------------
create or replace function public.slugify(p_txt text)
returns text
language sql
immutable
as $$
  select nullif(
    trim(both '-' from
      regexp_replace(
        lower(translate(coalesce(p_txt, ''),
          'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
          'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN')),
        '[^a-z0-9]+', '-', 'g')
    ), '');
$$;

-- ------------------------------------------------------------
-- 6) publicar_perfil(): a nutri envia o perfil para análise.
--    Valida aqui, no banco, os requisitos do card — a tela também valida,
--    mas quem garante é este ponto.
-- ------------------------------------------------------------
create or replace function public.publicar_perfil()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.profiles%rowtype;
  v_slug text;
begin
  select * into r from public.profiles where id = auth.uid();
  if r.id is null then raise exception 'perfil não encontrado'; end if;

  if coalesce(r.tipo, 'nutri') <> 'nutri' then
    raise exception 'só o perfil de nutricionista vai para o diretório';
  end if;
  if r.avatar_url is null or length(r.avatar_url) < 32 then
    raise exception 'falta a sua foto';
  end if;
  if r.apresentacao is null or char_length(r.apresentacao) < 40 then
    raise exception 'escreva a sua apresentação (pelo menos 40 caracteres)';
  end if;
  if coalesce(nullif(trim(r.crn), ''), '') = '' then
    raise exception 'falta o seu CRN';
  end if;
  if coalesce(array_length(r.area_atuacao, 1), 0) = 0 then
    raise exception 'escolha pelo menos uma especialidade';
  end if;
  if coalesce(nullif(trim(r.cidade), ''), '') = ''
     or coalesce(nullif(trim(r.estado), ''), '') = '' then
    raise exception 'informe a cidade e o estado';
  end if;
  if not (r.atende_online or r.atende_presencial) then
    raise exception 'informe se atende online, presencial ou os dois';
  end if;
  -- É o Instagram (ou o site) que dá à Ana o que analisar antes de aprovar.
  if coalesce(nullif(trim(r.instagram), ''), '') = ''
     and coalesce(nullif(trim(r.site), ''), '') = '' then
    raise exception 'informe o seu Instagram ou o seu site';
  end if;

  -- Slug: respeita o escolhido; se não houver, deriva do nome e desempata.
  v_slug := public.slugify(coalesce(r.slug, r.nome));
  if v_slug is null then raise exception 'não consegui gerar o seu endereço; escolha um'; end if;
  if exists (select 1 from public.profiles p
              where lower(p.slug) = v_slug and p.id <> r.id) then
    if r.slug is not null then
      raise exception 'o endereço "%" já está em uso', v_slug;
    end if;
    v_slug := v_slug || '-' || substr(replace(r.id::text, '-', ''), 1, 4);
  end if;

  perform set_config('app.allow_curadoria', 'on', true);
  update public.profiles
     set slug = v_slug,
         perfil_status = 'em_analise',
         perfil_recusa_motivo = null
   where id = r.id;

  return v_slug;
end; $$;

-- ------------------------------------------------------------
-- 7) Curadoria da Ana: aprovar / recusar.
-- ------------------------------------------------------------
create or replace function public.aprovar_perfil(p_id uuid, p_observacao text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.sou_admin() then raise exception 'só a administração aprova perfis'; end if;
  perform set_config('app.allow_curadoria', 'on', true);
  update public.profiles
     set perfil_status = 'aprovado',
         perfil_recusa_motivo = null,
         publicado_em = coalesce(publicado_em, now()),
         analise_observacao = coalesce(p_observacao, analise_observacao)
   where id = p_id;
end; $$;

create or replace function public.recusar_perfil(p_id uuid, p_motivo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.sou_admin() then raise exception 'só a administração recusa perfis'; end if;
  if coalesce(nullif(trim(p_motivo), ''), '') = '' then
    raise exception 'escreva o motivo — ele volta para a nutri corrigir';
  end if;
  perform set_config('app.allow_curadoria', 'on', true);
  update public.profiles
     set perfil_status = 'recusado',
         perfil_recusa_motivo = p_motivo,
         publicado_em = null
   where id = p_id;
end; $$;

notify pgrst, 'reload schema';
