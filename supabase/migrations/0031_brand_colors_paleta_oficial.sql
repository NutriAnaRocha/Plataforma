-- 0031 — Paleta oficial da marca em brand_colors
--
-- A 0011 gravou como default a paleta antiga da plataforma (#7B284C / #F4DCE5 / #9C3D63),
-- que diverge do manual de marca. O manual (Prancheta 23) define:
--   Pantone 235 C          -> #840B55  (cor principal)
--   Pantone Magenta 0521 C -> #F1B2DC  (cor principal auxiliar)
--   Cool Gray 10 C         -> #63666A  (cor secundaria / texto)
-- O tom de destaque (#A82670) e derivado do 235 C, porque a interface precisa de um
-- degrau que o manual nao define.
--
-- Migration 0011 NAO foi editada de proposito: ja rodou em producao.
--
-- IMPORTANTE: o update abaixo so toca linhas que ainda estao com o default antigo
-- INTACTO. Se a nutricionista personalizou as cores no Perfil Profissional, a escolha
-- dela e preservada.

alter table public.profiles
  alter column brand_colors set default
  '{"primaria":"#840B55","secundaria":"#F1B2DC","destaque":"#A82670","fundo":"#FFFFFF"}'::jsonb;

update public.profiles
   set brand_colors = '{"primaria":"#840B55","secundaria":"#F1B2DC","destaque":"#A82670","fundo":"#FFFFFF"}'::jsonb
 where brand_colors = '{"primaria":"#7B284C","secundaria":"#F4DCE5","destaque":"#9C3D63","fundo":"#FFFFFF"}'::jsonb;

notify pgrst, 'reload schema';
