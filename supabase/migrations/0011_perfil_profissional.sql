-- ============================================================
--  Plataforma Nutri — Migração 0011
--  Perfil Profissional: identidade visual da nutricionista aplicada
--  automaticamente a todos os documentos gerados (prescrição, plano,
--  orientações, metas, relatórios, anamnese, resumo).
--  Imagens guardadas como data URL comprimida em colunas texto
--  (mesmo padrão do avatar_url — sem storage/backend).
--  RLS de profiles (select/update own) já cobre o acesso.
-- ============================================================

-- Identidade visual (uploads leves em data URL)
alter table public.profiles add column if not exists logo_url        text;
alter table public.profiles add column if not exists carimbo_url     text;
alter table public.profiles add column if not exists assinatura_url  text;

-- Dados profissionais
alter table public.profiles add column if not exists area_atuacao        text[] not null default '{}';
alter table public.profiles add column if not exists area_atuacao_outro  text;
alter table public.profiles add column if not exists contato_profissional text;

-- Paleta da marca aplicada aos documentos. Default = identidade Ana Luísa Rocha.
alter table public.profiles add column if not exists brand_colors jsonb not null default
  '{"primaria":"#7B284C","secundaria":"#F4DCE5","destaque":"#9C3D63","fundo":"#FFFFFF"}'::jsonb;
