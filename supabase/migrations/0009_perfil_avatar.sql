-- ============================================================
--  Plataforma Nutri — Migração 0009
--  Foto de perfil da nutri (tela Configurações → Perfil).
--  Guardada como data URL comprimida (JPEG ~320px) em coluna texto.
--  RLS de profiles (select/update own) já cobre o acesso.
-- ============================================================

alter table public.profiles add column if not exists avatar_url text;
