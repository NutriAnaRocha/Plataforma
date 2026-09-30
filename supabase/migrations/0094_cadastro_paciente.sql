-- ============================================================
--  Plataforma Nutri — Migração 0094
--  CADASTRO PÚBLICO DO PACIENTE (15/09/2026).
--
--  A tela inicial passou a ter duas portas — paciente e nutricionista —,
--  cada uma com login e cadastro. O paciente se cadastra sozinho pela
--  edge function criar-conta-paciente: nome, e-mail, telefone, CPF, foto
--  opcional e o objetivo com a nutrição.
--
--  O que já existia e é reaproveitado:
--    - profiles.telefone e profiles.avatar_url (0009, data URL comprimida);
--    - paciente_preferencias.objetivo (0088).
--  O que falta é só o CPF.
-- ============================================================

alter table public.profiles add column if not exists cpf text;

-- Um CPF, uma conta. Só dígitos (a function normaliza antes de gravar).
create unique index if not exists profiles_cpf_uidx
  on public.profiles (cpf) where cpf is not null;

alter table public.profiles drop constraint if exists profiles_cpf_chk;
alter table public.profiles add constraint profiles_cpf_chk
  check (cpf is null or cpf ~ '^[0-9]{11}$');

notify pgrst, 'reload schema';
