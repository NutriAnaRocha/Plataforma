-- ============================================================
--  Plataforma Nutri — Migração 0010
--  Biblioteca de e-books estilo Kiwify: catálogo público + acesso
--  restrito por usuário. O ARQUIVO do e-book fica num bucket PRIVADO
--  (não é servido pelo site público); o RLS do Storage só entrega
--  para quem tem acesso válido — gate server-side, não burlável.
-- ============================================================

-- 1) CATÁLOGO — metadados públicos (título, capa, preço). Leitura livre;
--    é o que a vitrine/biblioteca mostra. NÃO contém o conteúdo do e-book.
create table if not exists public.ebooks (
  slug         text primary key,                 -- 'guia-canetas'
  titulo       text not null,
  subtitulo    text,
  capa_url     text,                             -- url pública da capa (marketing)
  arquivo      text not null,                    -- nome do objeto no bucket privado 'ebooks'
  preco_cents  integer not null default 0,       -- preço em centavos (0 = grátis/N/A)
  gratuito     boolean not null default false,   -- true = qualquer usuário logado lê (isca)
  ativo        boolean not null default true,
  ordem        integer not null default 0,
  criado_em    timestamptz not null default now()
);

alter table public.ebooks enable row level security;

-- Catálogo é público (só metadados de marketing).
drop policy if exists "ebooks_catalogo_publico" on public.ebooks;
create policy "ebooks_catalogo_publico" on public.ebooks
  for select using (ativo);

-- 2) ACESSOS — quem pode ler o quê. tipo = comprador | assinante | gratuito.
--    ebook_slug = '*' significa acesso a TODOS (plano mensal / assinante).
--    expira_em NULL = vitalício (comprador). Data = assinatura com validade.
create table if not exists public.ebook_acessos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  ebook_slug  text not null,                     -- slug do catálogo, ou '*' para tudo
  tipo        text not null default 'comprador'
                check (tipo in ('comprador','assinante','gratuito')),
  origem      text,                              -- 'manual', 'kiwify', 'cortesia'...
  expira_em   timestamptz,                       -- NULL = não expira
  criado_em   timestamptz not null default now(),
  unique (user_id, ebook_slug)
);
create index if not exists ebook_acessos_user_idx on public.ebook_acessos (user_id);

alter table public.ebook_acessos enable row level security;

-- O usuário só enxerga os PRÓPRIOS acessos. Inserção/remoção é feita pelo
-- admin (dashboard / Management API / service_role) — sem policy de insert
-- pública, ninguém libera acesso a si mesmo.
drop policy if exists "ebook_acessos_self_read" on public.ebook_acessos;
create policy "ebook_acessos_self_read" on public.ebook_acessos
  for select using (user_id = auth.uid());

-- 3) Função auxiliar: este usuário pode ler o arquivo X?
--    (grátis no catálogo) OU (acesso válido ao slug) OU (assinante '*').
create or replace function public.pode_ler_ebook(p_arquivo text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    -- e-book gratuito: qualquer usuário logado lê
    select 1 from public.ebooks eb
    where eb.arquivo = p_arquivo and eb.gratuito and eb.ativo
  ) or exists (
    -- acesso explícito ao slug do arquivo, ou acesso total '*'
    select 1
    from public.ebook_acessos a
    join public.ebooks eb on eb.arquivo = p_arquivo
    where a.user_id = auth.uid()
      and (a.ebook_slug = eb.slug or a.ebook_slug = '*')
      and (a.expira_em is null or a.expira_em > now())
  );
$$;

-- 4) BUCKET PRIVADO com os arquivos dos e-books.
insert into storage.buckets (id, name, public)
values ('ebooks', 'ebooks', false)
on conflict (id) do nothing;

-- Só usuário logado E com direito baixa o arquivo. Quem não tem, o banco recusa.
drop policy if exists "ebooks_storage_download" on storage.objects;
create policy "ebooks_storage_download" on storage.objects
  for select to authenticated
  using (bucket_id = 'ebooks' and public.pode_ler_ebook(name));

-- 5) SEED do catálogo (metadados; os arquivos são enviados ao bucket à parte).
insert into public.ebooks (slug, titulo, subtitulo, arquivo, preco_cents, gratuito, ordem) values
  ('guia-canetas', 'Guia Completo das Canetas Emagrecedoras',
   'Emagreça com saúde, preserve a massa muscular e mantenha o resultado.',
   'guia-canetas.html', 2700, false, 1),
  ('5-erros-canetas', '5 Erros na Caneta Emagrecedora',
   'Os deslizes mais comuns de quem usa canetas — e como evitá-los.',
   '5-erros-canetas.html', 0, true, 2)
on conflict (slug) do nothing;
