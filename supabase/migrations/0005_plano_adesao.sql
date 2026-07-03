-- ============================================================
--  Plataforma Nutri — Migração 0005
--  Adesão ao plano: marcação dos itens FEITA PELO PACIENTE,
--  sincronizada no banco (antes era localStorage).
--  Tabela dedicada p/ o paciente escrever SÓ a adesão, sem poder
--  tocar em campos clínicos da ficha (RLS é por linha, não por coluna).
-- ============================================================
create table if not exists public.plano_adesao (
  paciente_id uuid primary key references public.pacientes(id) on delete cascade,
  marcas      jsonb not null default '{}'::jsonb,   -- { "ri:ii": true, ... }
  updated_at  timestamptz not null default now()
);

alter table public.plano_adesao enable row level security;

-- Paciente dono da ficha: lê e escreve a própria adesão.
drop policy if exists "adesao_paciente_all" on public.plano_adesao;
create policy "adesao_paciente_all" on public.plano_adesao
  for all
  using (exists (select 1 from public.pacientes p where p.id = paciente_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.pacientes p where p.id = paciente_id and p.user_id = auth.uid()));

-- Nutri dona do paciente: SOMENTE leitura (vê a adesão real, não edita).
drop policy if exists "adesao_nutri_select" on public.plano_adesao;
create policy "adesao_nutri_select" on public.plano_adesao
  for select
  using (exists (select 1 from public.pacientes p where p.id = paciente_id and p.nutricionista_id = auth.uid()));
