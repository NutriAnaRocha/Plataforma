-- ============================================================
--  Plataforma Nutri — Migração 0088
--  QUIZ DO PACIENTE (o que ele respondeu antes de escolher).
--
--  Guardar as respostas em tabela própria, e não só dentro da solicitação,
--  serve a três coisas:
--    - re-sugerir nutris depois, sem pedir tudo de novo;
--    - abrir o portal já sabendo o objetivo de quem chegou;
--    - medir o que o público procura (e qual especialidade falta no diretório).
-- ============================================================

create table if not exists public.paciente_preferencias (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  objetivo    text,                                  -- emagrecer, engravidar, sintoma...
  temas       text[] not null default '{}',          -- casa com profiles.area_atuacao
  modalidade  text,                                  -- online | presencial | tanto_faz
  cidade      text,
  estado      text,
  faixa_preco text,                                  -- ate_150 | 150_250 | 250_400 | acima_400
  respostas   jsonb  not null default '{}'::jsonb,   -- o quiz cru, para evoluir sem migration
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.paciente_preferencias drop constraint if exists paciente_pref_modalidade_chk;
alter table public.paciente_preferencias add constraint paciente_pref_modalidade_chk
  check (modalidade is null or modalidade in ('online','presencial','tanto_faz'));

alter table public.paciente_preferencias enable row level security;

drop policy if exists "paciente_pref_own" on public.paciente_preferencias;
create policy "paciente_pref_own" on public.paciente_preferencias
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- A nutri NÃO lê esta tabela: o que ela precisa ver do quiz vem congelado em
-- solicitacoes_atendimento.respostas, do pedido que foi feito a ela.
-- Admin lê para medir o funil.
drop policy if exists "paciente_pref_admin" on public.paciente_preferencias;
create policy "paciente_pref_admin" on public.paciente_preferencias
  for select using (public.sou_admin());

notify pgrst, 'reload schema';
