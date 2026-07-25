-- ============================================================
--  Plataforma Nutri — Migração 0037
--  ADMIN + CONVITE DE NUTRICIONISTAS.
--
--  Modelo de acesso escolhido (24/07/2026): POR CONVITE. O cadastro
--  público continua fechado (botão hidden no index + disable_signup no
--  Supabase). Só um admin (a Ana) cria a conta de outra nutricionista;
--  ela recebe e-mail + senha e entra pela tela de login normal.
--
--  Por que isso é seguro/simples:
--   - A conta nasce com tipo='nutri' → o auth-guard deixa entrar no painel.
--   - Ela NÃO herda nada da Ana: RLS escopa pacientes/agenda/etc. por
--     auth.uid(). Cada nutri começa com a carteira vazia.
--   - MAS já enxerga a Inteligência Clínica inteira (protocolos, receitas,
--     orientações, exames, formulações) porque essa base está salva com
--     nutricionista_id IS NULL (base curada, lida por todas). Editar
--     duplica pra conta dela (copy-on-write). Ou seja: nada de painel
--     vazio na parte clínica.
--
--  Quando virar pago: o webhook do InfinitePay chama a MESMA function
--  create-nutri-access (com uma checagem de assinatura no lugar do admin).
-- ============================================================

-- 1) Marca quem pode convidar. Fica em profiles (não é 'tipo', pra não
--    conflitar com o auth-guard que só deixa 'nutri' no painel — a Ana
--    é 'nutri' E admin ao mesmo tempo).
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- 2) A Ana é a admin. Update por e-mail (o id do auth varia por ambiente).
update public.profiles
   set is_admin = true
 where lower(email) = 'nutrianalrocha@gmail.com';

-- 3) Registro dos convites emitidos (auditoria + base do futuro painel
--    "nutris convidadas"). Uma linha por conta criada por convite.
create table if not exists public.nutri_convites (
  id            uuid primary key default gen_random_uuid(),
  -- quem convidou (admin). default auth.uid() p/ inserts diretos; a function
  -- (service_role) grava explicitamente.
  convidado_por uuid not null default auth.uid() references auth.users(id) on delete set null,
  -- a conta criada (pode ficar null se o usuário for removido depois).
  user_id       uuid references auth.users(id) on delete set null,
  nome          text,
  email         text not null,
  status        text not null default 'ativo',   -- 'ativo' | 'revogado'
  observacao    text,
  created_at    timestamptz not null default now()
);

create index if not exists nutri_convites_email_idx on public.nutri_convites (lower(email));
create index if not exists nutri_convites_por_idx   on public.nutri_convites (convidado_por);

alter table public.nutri_convites enable row level security;

-- Só admin enxerga/gerencia os convites. Function usa service_role (ignora RLS).
drop policy if exists "nutri_convites_admin_all" on public.nutri_convites;
create policy "nutri_convites_admin_all" on public.nutri_convites
  for all
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_admin = true
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_admin = true
  ));

notify pgrst, 'reload schema';
