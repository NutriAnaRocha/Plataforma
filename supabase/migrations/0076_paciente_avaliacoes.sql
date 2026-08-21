-- ============================================================
--  Plataforma Nutri — Migração 0076
--  HISTÓRICO DE AVALIAÇÕES ANTROPOMÉTRICAS.
--
--  Até aqui a ficha guardava só a avaliação ATUAL, em
--  pacientes.antropometria (jsonb, migração 0015): cada "Salvar
--  avaliação" sobrescrevia a anterior e a linha do tempo do paciente
--  se perdia. Esta tabela empilha uma linha por avaliação.
--
--  pacientes.antropometria CONTINUA sendo a avaliação corrente — é o
--  que o plano alimentar, os cálculos energéticos e o Raio X leem.
--  Aqui fica a série histórica: o snapshot inteiro em `dados` (mesmo
--  formato do jsonb da ficha) + as medidas de acompanhamento em
--  colunas próprias, para o gráfico de evolução não ter que abrir o
--  jsonb linha a linha.
--
--  Quem vê o quê:
--    • a NUTRI dona do paciente gerencia tudo;
--    • o PACIENTE dono da ficha LÊ a própria série (o portal mostra a
--      evolução dele) — leitura apenas, nunca escrita: quem responde
--      pelo dado antropométrico é a nutricionista (Art. 35 da
--      Res. CFN 856/2026). O que o paciente informa sozinho continua
--      indo para antropometria.autorreferida (migração 0045).
-- ============================================================

create table if not exists public.paciente_avaliacoes (
  id               uuid primary key default gen_random_uuid(),
  paciente_id      uuid not null references public.pacientes(id) on delete cascade,
  nutricionista_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data             date not null default current_date,   -- data da AVALIAÇÃO (a nutri pode retroagir)
  peso             numeric(6,2),
  altura           numeric(4,2),
  imc              numeric(5,2),
  gordura_pct      numeric(5,2),   -- % gordura (dobras; se não houver, o Raio X)
  massa_gorda      numeric(6,2),
  massa_magra      numeric(6,2),
  cintura          numeric(6,2),
  quadril          numeric(6,2),
  abdomen          numeric(6,2),
  soma_dobras      numeric(6,2),
  observacao       text,
  dados            jsonb not null default '{}'::jsonb,   -- snapshot completo da antropometria
  created_at       timestamptz not null default now()
);

-- Uma avaliação por paciente por dia: salvar duas vezes no mesmo
-- atendimento corrige a linha, não cria um ponto duplicado no gráfico.
create unique index if not exists paciente_avaliacoes_dia_uidx
  on public.paciente_avaliacoes (paciente_id, data);

create index if not exists paciente_avaliacoes_pac_idx
  on public.paciente_avaliacoes (paciente_id, data desc);

alter table public.paciente_avaliacoes enable row level security;

-- A nutri dona do paciente faz tudo.
drop policy if exists "paciente_avaliacoes_nutri_all" on public.paciente_avaliacoes;
create policy "paciente_avaliacoes_nutri_all" on public.paciente_avaliacoes
  for all to authenticated
  using (exists (
    select 1 from public.pacientes p
    where p.id = paciente_avaliacoes.paciente_id and p.nutricionista_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.pacientes p
    where p.id = paciente_avaliacoes.paciente_id and p.nutricionista_id = auth.uid()
  ));

-- O paciente dono da ficha lê a própria evolução.
drop policy if exists "paciente_avaliacoes_paciente_read" on public.paciente_avaliacoes;
create policy "paciente_avaliacoes_paciente_read" on public.paciente_avaliacoes
  for select to authenticated
  using (exists (
    select 1 from public.pacientes p
    where p.id = paciente_avaliacoes.paciente_id and p.user_id = auth.uid()
  ));

notify pgrst, 'reload schema';
