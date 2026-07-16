-- ============================================================
--  Plataforma Nutri — Migração 0017
--  CORRIGE a 0016. O catálogo já tinha os e-books pagos cadastrados
--  (slugs 'leitura-de-rotulos' e 'guia-completo-tentante', com os
--  arquivos correspondentes já no bucket privado). A 0016 inseriu, por
--  engano, duas entradas duplicadas ('guia-rotulos', 'guia-tentante')
--  apontando para arquivos que NÃO existem no bucket, e sobrescreveu
--  metadados de 'guia-canetas'. Aqui desfazemos os dois estragos.
--
--  Os slugs canônicos (os que o webhook deve usar) são:
--    Rótulos  -> leitura-de-rotulos     (arquivo leitura-de-rotulos.html)
--    Tentante -> guia-completo-tentante (arquivo guia-completo-tentante.html)
--    Canetas  -> guia-canetas           (arquivo guia-canetas.html)
-- ============================================================

-- 1) Remove as duplicatas criadas pela 0016. São seguras de apagar: foram
--    criadas há minutos, apontam para arquivos inexistentes no bucket e
--    ninguém tem acesso concedido a esses slugs.
delete from public.ebook_acessos where ebook_slug in ('guia-rotulos', 'guia-tentante');
delete from public.ebooks        where slug       in ('guia-rotulos', 'guia-tentante');

-- 2) Restaura os metadados de 'guia-canetas' para a convenção do catálogo
--    (a 0016 trocou ordem 1->3, a categoria e pôs uma prévia fora do padrão).
update public.ebooks
   set ordem      = 1,
       categoria  = 'Emagrecimento & Canetas',
       previa_url = null
 where slug = 'guia-canetas';
