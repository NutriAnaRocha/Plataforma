-- ============================================================
--  Plataforma Nutri — Migração 0040
--  FINANCEIRO real: lançamentos (recebimentos/pendências) por nutri.
--  Substitui o mock da tela Financeiro por dados de verdade. Isolado por
--  nutricionista_id = auth.uid() (RLS). Opcionalmente vinculado a um paciente.
-- ============================================================
create table if not exists public.lancamentos (
  id              uuid primary key default gen_random_uuid(),
  nutricionista_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  paciente_id     uuid references public.pacientes(id) on delete set null,
  paciente_nome   text,
  descricao       text,
  valor_cents     int  not null default 0,
  metodo          text,                          -- 'Pix' | 'Dinheiro' | 'Cartão' | 'Transferência' | ...
  status          text not null default 'pago',  -- 'pago' | 'pendente' | 'atrasado'
  data            date not null default current_date,
  created_at      timestamptz not null default now()
);

alter table public.lancamentos drop constraint if exists lancamentos_status_chk;
alter table public.lancamentos add constraint lancamentos_status_chk
  check (status in ('pago','pendente','atrasado'));

create index if not exists lancamentos_nutri_idx on public.lancamentos (nutricionista_id, data desc);

alter table public.lancamentos enable row level security;

-- RLS: a nutri gerencia apenas os próprios lançamentos.
drop policy if exists "lancamentos_own_all" on public.lancamentos;
create policy "lancamentos_own_all" on public.lancamentos
  for all
  using (nutricionista_id = auth.uid())
  with check (nutricionista_id = auth.uid());

notify pgrst, 'reload schema';
