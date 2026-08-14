-- ============================================================
--  Plataforma Nutri — Migração 0058
--  RECEITAS LIBERADAS AO PACIENTE.
--
--  A nutri escolhe, receita a receita, o que aparece no portal daquela
--  paciente (liga/desliga). O paciente vê só o que foi liberado para ele
--  e os ingredientes entram na lista de compras do plano.
--
--  Também acrescenta proteína por porção à receita — a Ana pede isso
--  junto com kcal para montar o plano.
-- ============================================================

alter table public.ic_receitas
  add column if not exists proteina_g numeric(5,1);

comment on column public.ic_receitas.proteina_g is 'Proteína estimada por porção, em gramas.';

-- ---------- Quem vê o quê ----------
create table if not exists public.paciente_receitas (
  paciente_id      uuid not null references public.pacientes(id) on delete cascade,
  receita_id       uuid not null references public.ic_receitas(id) on delete cascade,
  nutricionista_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at       timestamptz not null default now(),
  primary key (paciente_id, receita_id)
);

create index if not exists paciente_receitas_pac_idx on public.paciente_receitas (paciente_id);

alter table public.paciente_receitas enable row level security;

-- A nutri manda nas receitas dos pacientes da carteira dela.
drop policy if exists "paciente_receitas_nutri" on public.paciente_receitas;
create policy "paciente_receitas_nutri" on public.paciente_receitas
  for all using (
    exists (select 1 from public.pacientes p
             where p.id = paciente_id and p.nutricionista_id = auth.uid())
  )
  with check (
    exists (select 1 from public.pacientes p
             where p.id = paciente_id and p.nutricionista_id = auth.uid())
  );

-- O paciente só lê a própria lista.
drop policy if exists "paciente_receitas_paciente_select" on public.paciente_receitas;
create policy "paciente_receitas_paciente_select" on public.paciente_receitas
  for select using (
    exists (select 1 from public.pacientes p
             where p.id = paciente_id and p.user_id = auth.uid())
  );

/* O paciente precisa LER o conteúdo da receita liberada. A policy de select
   de ic_receitas (0027) só cobre base + as da própria nutri; uma receita
   privada da nutri liberada ao paciente ficaria invisível para ele. */
drop policy if exists "ic_receitas_select_paciente" on public.ic_receitas;
create policy "ic_receitas_select_paciente" on public.ic_receitas
  for select using (
    exists (
      select 1
        from public.paciente_receitas pr
        join public.pacientes p on p.id = pr.paciente_id
       where pr.receita_id = ic_receitas.id
         and p.user_id = auth.uid()
    )
  );

notify pgrst, 'reload schema';
