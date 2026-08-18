-- ============================================================
--  Plataforma Nutri — Migração 0069
--  MEU CICLO — humor deixa de ser um só.
--
--  A coluna `humor` (text, um valor) obrigava a paciente a escolher
--  entre "irritada" e "ansiosa" num dia em que ela estava as duas
--  coisas. Humor de TPM não é categoria única — é combinação. Vira
--  `humores` (jsonb array), como já eram os sintomas.
--
--  A coluna antiga CONTINUA existindo e sendo gravada com o primeiro
--  humor do dia: relatório, export e qualquer leitura antiga seguem
--  funcionando sem reescrita. O check dela cai porque a lista de
--  humores cresceu (sensível, calma) e vai crescer de novo — quem
--  valida o vocabulário é a tela, não o banco.
-- ============================================================

alter table public.ciclo_registros
  add column if not exists humores jsonb not null default '[]'::jsonb;

-- Backfill: quem já registrou um humor vira um array de um item.
update public.ciclo_registros
   set humores = jsonb_build_array(humor)
 where humor is not null
   and (humores is null or jsonb_array_length(humores) = 0);

alter table public.ciclo_registros
  drop constraint if exists ciclo_registros_humor_check;

notify pgrst, 'reload schema';
