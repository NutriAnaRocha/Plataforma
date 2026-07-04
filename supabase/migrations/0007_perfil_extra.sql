-- ============================================================
--  Plataforma Nutri — Migração 0007
--  Campos extras do perfil da nutri (tela Configurações → Perfil/Conta).
--  Todos opcionais; RLS de profiles (select/update own) já cobre o acesso.
-- ============================================================

alter table public.profiles add column if not exists crn        text;
alter table public.profiles add column if not exists cidade     text;
alter table public.profiles add column if not exists telefone   text;
alter table public.profiles add column if not exists instagram  text;
alter table public.profiles add column if not exists site       text;
alter table public.profiles add column if not exists bio         text;

-- Preferências de notificação (chave -> ligado?). Default = as 6 chaves da UI.
alter table public.profiles add column if not exists notif_prefs jsonb not null default
  '{"email_consultas":true,"push_agenda":true,"resumo_ia":true,"comunidade":false,"financeiro":true,"marketing":false}'::jsonb;
