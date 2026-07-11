-- ============================================================
--  Plataforma Nutri — Migração 0015
--  Cadastro enxuto do paciente (CPF, foto) + Antropometria.
--  - cpf / foto_url: dados do novo formulário simplificado.
--  - antropometria (jsonb): última avaliação (peso, altura, altura do
--    joelho, sexo, circunferências, 7 dobras, bioimpedância + derivados).
--  RLS de pacientes (own) já cobre o acesso.
-- ============================================================

alter table public.pacientes add column if not exists cpf           text;
alter table public.pacientes add column if not exists foto_url      text;
alter table public.pacientes add column if not exists antropometria jsonb not null default '{}'::jsonb;
