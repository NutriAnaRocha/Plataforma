-- ============================================================
-- 0056 — Assinatura opcional no rodapé dos documentos.
-- A imagem da assinatura continua guardada no perfil; este flag
-- decide se ela é impressa nos documentos. Desligado = o documento
-- sai com a linha em branco para assinar à mão.
-- ============================================================

alter table public.profiles
  add column if not exists usar_assinatura boolean not null default true;

comment on column public.profiles.usar_assinatura is
  'Se false, os documentos gerados saem sem a imagem da assinatura (linha em branco).';

notify pgrst, 'reload schema';
