-- 0095 — mais detalhe na página pública da nutri (17/09/2026).
-- A página /nutri/<slug> mostrava pouco para a paciente decidir. Três campos
-- livres, todos opcionais, lidos pela edge function diretorio-buscar (PERFIL).
alter table public.profiles
  add column if not exists publico_atendido text,
  add column if not exists como_funciona    text,
  add column if not exists bairro           text;

alter table public.profiles drop constraint if exists profiles_publico_atendido_len;
alter table public.profiles add constraint profiles_publico_atendido_len check (char_length(publico_atendido) <= 400);
alter table public.profiles drop constraint if exists profiles_como_funciona_len;
alter table public.profiles add constraint profiles_como_funciona_len check (char_length(como_funciona) <= 800);
alter table public.profiles drop constraint if exists profiles_bairro_len;
alter table public.profiles add constraint profiles_bairro_len check (char_length(bairro) <= 80);

notify pgrst, 'reload schema';
