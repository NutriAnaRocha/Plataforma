-- ============================================================
--  Plataforma Nutri — Migração 0003
--  Portal do paciente: papel (role), vínculo ficha↔login,
--  plano alimentar estruturado e chat (mensagens).
-- ============================================================

-- 1) Papel do usuário (nutri | paciente). Contas existentes = nutri.
alter table public.profiles add column if not exists tipo text not null default 'nutri';
alter table public.profiles drop constraint if exists profiles_tipo_chk;
alter table public.profiles add constraint profiles_tipo_chk check (tipo in ('nutri','paciente'));

-- handle_new_user passa a respeitar o tipo vindo do metadata (default 'nutri').
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nome, tipo)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', ''),
    coalesce(new.raw_user_meta_data->>'tipo', 'nutri')
  )
  on conflict (id) do nothing;
  return new;
end; $$;

-- 2) Vínculo ficha do paciente ↔ conta de login (nullable; 1 login por ficha).
alter table public.pacientes add column if not exists user_id uuid references auth.users(id) on delete set null;
create unique index if not exists pacientes_user_uidx on public.pacientes(user_id) where user_id is not null;

-- 3) Plano alimentar estruturado (refeições) exibido no portal do paciente.
alter table public.pacientes add column if not exists plano jsonb not null
  default '{"titulo":null,"refeicoes":[]}'::jsonb;

-- Paciente enxerga a PRÓPRIA ficha (além da política do nutri, que continua valendo).
drop policy if exists "pacientes_select_as_patient" on public.pacientes;
create policy "pacientes_select_as_patient" on public.pacientes
  for select using (auth.uid() = user_id);

-- 4) Chat paciente ↔ nutricionista.
create table if not exists public.mensagens (
  id           uuid primary key default gen_random_uuid(),
  paciente_id  uuid not null references public.pacientes(id) on delete cascade,
  autor        text not null check (autor in ('nutri','paciente')),
  corpo        text not null,
  created_at   timestamptz not null default now()
);
create index if not exists mensagens_paciente_idx on public.mensagens (paciente_id, created_at);

alter table public.mensagens enable row level security;

-- Nutri dono do paciente vê e escreve na conversa.
drop policy if exists "mensagens_nutri_all" on public.mensagens;
create policy "mensagens_nutri_all" on public.mensagens
  for all
  using (exists (select 1 from public.pacientes p where p.id = paciente_id and p.nutricionista_id = auth.uid()))
  with check (exists (select 1 from public.pacientes p where p.id = paciente_id and p.nutricionista_id = auth.uid()));

-- Paciente dono da ficha vê e escreve na própria conversa.
drop policy if exists "mensagens_paciente_all" on public.mensagens;
create policy "mensagens_paciente_all" on public.mensagens
  for all
  using (exists (select 1 from public.pacientes p where p.id = paciente_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.pacientes p where p.id = paciente_id and p.user_id = auth.uid()));
