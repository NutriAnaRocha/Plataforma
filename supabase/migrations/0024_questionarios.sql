-- ============================================================
--  Plataforma Nutri — Migração 0024
--  Questionários pré-prontos + anamneses de retorno na ficha.
--  - questionarios (jsonb, array): instâncias preenchidas de modelos
--    (pré-consulta, recordatório 24h, hábitos, saúde intestinal,
--    saúde da mulher, anamnese de retorno). Cada item guarda
--    { id, tipo, modeloId, titulo, data, respostas[], status }.
--  Segue o mesmo padrão de pacientes.exames (jsonb na própria ficha).
--  RLS de pacientes (own) já cobre o acesso.
-- ============================================================

alter table public.pacientes add column if not exists questionarios jsonb not null default '[]'::jsonb;

-- Recarrega o cache de schema do PostgREST (senão a coluna nova dá
-- "schema cache" na API até o reload).
notify pgrst, 'reload schema';
