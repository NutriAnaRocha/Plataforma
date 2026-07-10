-- ============================================================
--  Plataforma Nutri — Migração 0013
--  Central de Automações de WhatsApp (configuração por nutri).
--  Guarda: link do Google Reviews, status/última conexão e os
--  modelos de mensagem (texto editável + ativo/inativo) de cada
--  automação, além de mensagens personalizadas criadas pela nutri.
--  Tudo num jsonb em profiles — os DEFAULTS são semeados pela UI
--  quando o campo está vazio (textos ficam versionados no JS).
--  RLS de profiles (select/update own) já cobre o acesso.
-- ============================================================

alter table public.profiles
  add column if not exists whatsapp_config jsonb not null default '{}'::jsonb;
