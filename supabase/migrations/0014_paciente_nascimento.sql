-- ============================================================
--  Plataforma Nutri — Migração 0014
--  Data de nascimento do paciente (para idade automática e a
--  automação de WhatsApp "Mensagem de Aniversário").
--  RLS de pacientes (own) já cobre o acesso.
-- ============================================================

alter table public.pacientes
  add column if not exists data_nascimento date;
