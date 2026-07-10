-- ============================================================
--  Plataforma Nutri — Migração 0012
--  Captura de LEADS do site (e-books gratuitos).
--  O visitante deixa nome + WhatsApp para liberar a leitura do
--  e-book; o registro cai aqui para a Ana usar depois (lista de
--  contatos / WhatsApp). Inserção é anônima (site público); a
--  LEITURA da lista é restrita ao painel (service_role) — ninguém
--  consegue ver os leads de outra pessoa pela chave pública.
-- ============================================================

create table if not exists public.leads (
  id                uuid primary key default gen_random_uuid(),
  nome              text not null,
  telefone          text not null,          -- como foi digitado: "(21) 99999-9999"
  telefone_digitos  text,                   -- só dígitos, para deduplicar/exportar
  ebook             text,                   -- e-book que originou o lead
  origem            text default 'site',    -- de onde veio ('site', campanha, etc.)
  criado_em         timestamptz not null default now()
);
create index if not exists leads_criado_idx  on public.leads (criado_em desc);
create index if not exists leads_digitos_idx on public.leads (telefone_digitos);

alter table public.leads enable row level security;

-- Qualquer visitante (anon) pode CADASTRAR um lead — é o formulário público.
drop policy if exists "leads_insert_publico" on public.leads;
create policy "leads_insert_publico" on public.leads
  for insert to anon, authenticated
  with check (true);

-- Ninguém lê a lista pela chave pública. Só service_role (painel/admin)
-- e o dono do projeto no dashboard enxergam os leads. Sem policy de SELECT
-- para anon/authenticated => leitura negada por padrão.
