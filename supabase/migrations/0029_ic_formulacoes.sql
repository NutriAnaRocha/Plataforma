-- ============================================================
--  Plataforma Nutri — Migração 0029
--  INTELIGÊNCIA CLÍNICA — Banco de Formulações.
--
--  Fitoterapia, suplementação, magistral e ortomolecular. Cada item tem
--  um TÍTULO (objetivo/condição) e uma ou mais FORMULAÇÕES separadas
--  (`formulas`), cada uma com seus componentes, dose e posologia.
--
--  Mesmo modelo das outras telas da IC: base curada (nutricionista_id null)
--  + as da Ana; editar uma base duplica antes (copy-on-write).
--
--  Conteúdo AUTORAL, com referência citável e limite de escopo explícito.
--  As doses são FAIXAS de apoio à decisão — a conduta é individualizada e
--  dentro do escopo do CFN. A pós da NutMed é mapa, não fonte de texto.
-- ============================================================

create table if not exists public.ic_formulacoes (
  id            uuid primary key default gen_random_uuid(),
  nutricionista_id uuid references auth.users(id) on delete cascade,
  origem_id     uuid references public.ic_formulacoes(id) on delete set null,

  -- ---------- Identificação ----------
  nome          text not null,                  -- título/objetivo
  slug          text not null,
  sinonimos     text[] not null default '{}',
  categoria     text not null default 'suplementacao'
                check (categoria in ('fitoterapia', 'suplementacao', 'magistral', 'ortomolecular')),
  eixo          text,
  grupo         text,

  -- ---------- Conteúdo ----------
  indicacao     text,        -- para quê
  -- Cada item (uma formulação):
  --   { "titulo":"Opção 1", "componentes":[{"ativo":"…","dose":"…","obs":"…"}],
  --     "posologia":"…", "duracao":"…", "via":"oral" }
  formulas      jsonb not null default '[]'::jsonb,
  observacoes   text,        -- notas de uso
  interacoes    text,        -- interações / cautelas
  quando_encaminhar text,    -- limite de escopo (obrigatório na prática)
  atencao       text,
  -- Cada item: { "fonte":"…","ano":2023,"detalhe":"…","link":"…" }
  referencias   jsonb not null default '[]'::jsonb,
  notas_pessoais text,

  ativo         boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists ic_formulacoes_slug_base_uidx
  on public.ic_formulacoes (slug) where nutricionista_id is null;
create unique index if not exists ic_formulacoes_slug_nutri_uidx
  on public.ic_formulacoes (nutricionista_id, slug) where nutricionista_id is not null;

create index if not exists ic_formulacoes_nutri_idx on public.ic_formulacoes (nutricionista_id);
create index if not exists ic_formulacoes_cat_idx   on public.ic_formulacoes (categoria);
create index if not exists ic_formulacoes_sinonimos_idx on public.ic_formulacoes using gin (sinonimos);

alter table public.ic_formulacoes enable row level security;

drop policy if exists "ic_formulacoes_select" on public.ic_formulacoes;
create policy "ic_formulacoes_select" on public.ic_formulacoes
  for select using (nutricionista_id is null or auth.uid() = nutricionista_id);

drop policy if exists "ic_formulacoes_insert_own" on public.ic_formulacoes;
create policy "ic_formulacoes_insert_own" on public.ic_formulacoes
  for insert with check (auth.uid() = nutricionista_id);

drop policy if exists "ic_formulacoes_update_own" on public.ic_formulacoes;
create policy "ic_formulacoes_update_own" on public.ic_formulacoes
  for update using (auth.uid() = nutricionista_id)
  with check (auth.uid() = nutricionista_id);

drop policy if exists "ic_formulacoes_delete_own" on public.ic_formulacoes;
create policy "ic_formulacoes_delete_own" on public.ic_formulacoes
  for delete using (auth.uid() = nutricionista_id);

drop trigger if exists ic_formulacoes_touch on public.ic_formulacoes;
create trigger ic_formulacoes_touch before update on public.ic_formulacoes
  for each row execute function public.ic_touch_updated_at();

-- Ocultar uma formulação base da minha lista.
create table if not exists public.ic_formulacoes_ocultas (
  nutricionista_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  formulacao_id    uuid not null references public.ic_formulacoes(id) on delete cascade,
  primary key (nutricionista_id, formulacao_id)
);

alter table public.ic_formulacoes_ocultas enable row level security;

drop policy if exists "ic_form_ocultas_all_own" on public.ic_formulacoes_ocultas;
create policy "ic_form_ocultas_all_own" on public.ic_formulacoes_ocultas
  for all using (auth.uid() = nutricionista_id)
  with check (auth.uid() = nutricionista_id);

-- Copy-on-write.
create or replace function public.ic_formulacao_duplicar(p_id uuid)
returns uuid
language plpgsql
security invoker
as $$
declare v_novo uuid; v_slug text;
begin
  select slug into v_slug from public.ic_formulacoes where id = p_id;
  if v_slug is null then
    raise exception 'Formulação % não encontrada ou sem acesso', p_id;
  end if;

  insert into public.ic_formulacoes (
    nutricionista_id, origem_id, nome, slug, sinonimos, categoria, eixo, grupo,
    indicacao, formulas, observacoes, interacoes, quando_encaminhar, atencao, referencias
  )
  select
    auth.uid(), id, nome, slug, sinonimos, categoria, eixo, grupo,
    indicacao, formulas, observacoes, interacoes, quando_encaminhar, atencao, referencias
  from public.ic_formulacoes where id = p_id
  returning id into v_novo;

  insert into public.ic_formulacoes_ocultas (nutricionista_id, formulacao_id)
  values (auth.uid(), p_id) on conflict do nothing;

  return v_novo;
end $$;

-- Minha lista: base (menos as ocultas) + as minhas.
create or replace view public.ic_formulacoes_minhas as
select f.*, (f.nutricionista_id is not null) as editavel
from public.ic_formulacoes f
where f.ativo
  and not exists (
    select 1 from public.ic_formulacoes_ocultas x
    where x.formulacao_id = f.id and x.nutricionista_id = auth.uid()
  );

notify pgrst, 'reload schema';
