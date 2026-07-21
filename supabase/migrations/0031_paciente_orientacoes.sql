-- ============================================================
--  Plataforma Nutri — Migração 0031
--  Orientações entregues ao paciente (por prontuário).
--
--  Mesmo padrão dos outros dados por-paciente guardados como coluna JSON
--  em public.pacientes (questionarios, portal_features, prontuario): uma
--  coluna `orientacoes` (array). Cada item é uma orientação anexada ao
--  paciente, com data — o histórico é o próprio array ordenado por data.
--
--  Cada item:
--    { "id":"…", "titulo":"…", "origem_slug":"ansiedade"|null,
--      "categoria":"condicao"|"tecnica"|"custom",
--      "resumo":"…", "blocos":[{ "titulo":"…","itens":["…"] }],
--      "dica":"…", "data":"2026-07-20", "enviado":false }
--
--  RLS já existente na tabela pacientes (nutricionista_id = auth.uid())
--  garante o isolamento — nada a mudar de política.
-- ============================================================

alter table public.pacientes
  add column if not exists orientacoes jsonb not null default '[]'::jsonb;

notify pgrst, 'reload schema';
