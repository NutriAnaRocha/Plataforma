-- ============================================================
--  Plataforma Nutri — Migração 0002
--  Pacientes (multi-tenant por nutricionista_id = auth.uid())
-- ============================================================

create table if not exists public.pacientes (
  id              uuid primary key default gen_random_uuid(),
  nutricionista_id uuid not null default auth.uid() references auth.users(id) on delete cascade,

  -- Identificação / resumo (colunas escalares p/ lista, busca e filtro)
  nome            text not null,
  ini             text,
  idade           int,
  sexo            text,                       -- 'F' | 'M'
  objetivo        text,
  status          text not null default 'ativo',   -- 'ativo' | 'atencao' | 'inativo'
  adesao          int  not null default 0,

  -- Antropometria
  peso_atual      numeric,
  peso_inicial    numeric,
  meta            numeric,
  altura          numeric,
  imc             numeric,

  -- Agenda (texto livre por enquanto; vira relação na Fatia da Agenda)
  ult_consulta    text,
  prox_consulta   text,

  -- Texto clínico
  restricoes      text,
  anamnese        text,
  observacoes     text,

  -- Estruturas ricas (jsonb enquanto não normalizamos)
  contato         jsonb  not null default '{}'::jsonb,   -- { tel, email, cidade }
  tags            text[] not null default '{}',
  evolucao        jsonb  not null default '{"labels":[],"peso":[]}'::jsonb,
  consultas       jsonb  not null default '[]'::jsonb,
  prescricoes     jsonb  not null default '[]'::jsonb,
  exames          jsonb  not null default '[]'::jsonb,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists pacientes_nutri_idx on public.pacientes (nutricionista_id);

alter table public.pacientes enable row level security;

-- RLS: cada nutricionista só enxerga/gerencia os próprios pacientes.
drop policy if exists "pacientes_select_own" on public.pacientes;
create policy "pacientes_select_own" on public.pacientes
  for select using (auth.uid() = nutricionista_id);

drop policy if exists "pacientes_insert_own" on public.pacientes;
create policy "pacientes_insert_own" on public.pacientes
  for insert with check (auth.uid() = nutricionista_id);

drop policy if exists "pacientes_update_own" on public.pacientes;
create policy "pacientes_update_own" on public.pacientes
  for update using (auth.uid() = nutricionista_id) with check (auth.uid() = nutricionista_id);

drop policy if exists "pacientes_delete_own" on public.pacientes;
create policy "pacientes_delete_own" on public.pacientes
  for delete using (auth.uid() = nutricionista_id);

-- updated_at automático (reaproveita touch_updated_at() da migração 0001)
drop trigger if exists trg_pacientes_touch on public.pacientes;
create trigger trg_pacientes_touch
  before update on public.pacientes
  for each row execute function public.touch_updated_at();
