-- ============================================================
--  Plataforma Nutri — Migração 0008
--  Agenda REAL: consultas com data/hora (substitui o mock semanal).
--  Multi-tenant por nutricionista_id = auth.uid(); o paciente vê as
--  próprias consultas no portal (via pacientes.user_id).
-- ============================================================

create table if not exists public.consultas (
  id               uuid primary key default gen_random_uuid(),
  nutricionista_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  paciente_id      uuid references public.pacientes(id) on delete set null,
  paciente_nome    text not null,                 -- denormalizado p/ exibir mesmo sem ficha vinculada
  data             date not null,
  inicio           time not null,
  fim              time not null,
  tipo             text,
  modo             text not null default 'Presencial',
  status           text not null default 'proxima',
  observacoes      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.consultas drop constraint if exists consultas_modo_chk;
alter table public.consultas add constraint consultas_modo_chk check (modo in ('Presencial','Online'));
alter table public.consultas drop constraint if exists consultas_status_chk;
alter table public.consultas add constraint consultas_status_chk
  check (status in ('proxima','emandamento','concluida','cancelada'));

create index if not exists consultas_nutri_data_idx on public.consultas (nutricionista_id, data);
create index if not exists consultas_paciente_idx  on public.consultas (paciente_id);

alter table public.consultas enable row level security;

-- Nutri: acesso total às próprias consultas.
drop policy if exists "consultas_nutri_all" on public.consultas;
create policy "consultas_nutri_all" on public.consultas
  for all using (auth.uid() = nutricionista_id) with check (auth.uid() = nutricionista_id);

-- Paciente: só LÊ as consultas da própria ficha (portal).
drop policy if exists "consultas_paciente_select" on public.consultas;
create policy "consultas_paciente_select" on public.consultas
  for select using (
    exists (select 1 from public.pacientes p where p.id = paciente_id and p.user_id = auth.uid())
  );

-- updated_at automático (reaproveita touch_updated_at() da migração 0001)
drop trigger if exists trg_consultas_touch on public.consultas;
create trigger trg_consultas_touch
  before update on public.consultas
  for each row execute function public.touch_updated_at();
