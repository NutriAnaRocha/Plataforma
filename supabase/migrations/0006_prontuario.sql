-- ============================================================
--  Plataforma Nutri — Migração 0006
--  Prontuário completo por paciente.
--  Guarda TODA a estrutura rica do prontuário (identidade estendida
--  + as 15 seções clínicas) num único jsonb na própria ficha.
--  NULL = paciente ainda sem prontuário preenchido → a tela mostra
--  estados vazios por módulo (nunca dados de outro paciente).
--  RLS já isola por nutricionista_id = auth.uid() (herdado de 0002).
-- ============================================================
alter table public.pacientes add column if not exists prontuario jsonb;
