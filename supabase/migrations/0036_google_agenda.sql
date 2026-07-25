-- ============================================================
--  Plataforma Nutri — Migração 0036
--  Integração Google Agenda + Meet.
--
--  A nutri conecta a conta Google (OAuth). A partir daí cada consulta
--  vira um evento no Google Calendar e, se for Online, ganha link do Meet.
--
--  Segurança do token: o refresh_token é o "cofre" da conta Google e NUNCA
--  pode chegar ao navegador. Por isso ele mora numa tabela separada
--  (google_secret) SEM policy de RLS — só o service_role (edge functions)
--  a acessa. O que o front precisa ver (e-mail, se está conectado) fica em
--  google_conta, essa sim legível pela própria nutri.
-- ============================================================

-- ---------- Conta Google conectada (parte "pública" p/ a própria nutri) ----------
create table if not exists public.google_conta (
  nutricionista_id uuid primary key
                   references auth.users(id) on delete cascade,
  email            text,                       -- e-mail Google conectado (exibição)
  calendar_id      text not null default 'primary',
  conectado        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.google_conta enable row level security;

-- A própria nutri LÊ o status da sua conexão (sem token aqui).
drop policy if exists "google_conta_self_select" on public.google_conta;
create policy "google_conta_self_select" on public.google_conta
  for select using (auth.uid() = nutricionista_id);

-- ...e pode DESCONECTAR (apagar a própria linha). Inserir/atualizar continua
-- só via service_role (edge functions) — o front nunca escreve o token.
drop policy if exists "google_conta_self_delete" on public.google_conta;
create policy "google_conta_self_delete" on public.google_conta
  for delete using (auth.uid() = nutricionista_id);

drop trigger if exists trg_google_conta_touch on public.google_conta;
create trigger trg_google_conta_touch
  before update on public.google_conta
  for each row execute function public.touch_updated_at();

-- ---------- Cofre do token (SEM RLS liberada — só service_role) ----------
create table if not exists public.google_secret (
  nutricionista_id uuid primary key
                   references auth.users(id) on delete cascade,
  refresh_token    text not null,
  updated_at       timestamptz not null default now()
);

alter table public.google_secret enable row level security;
-- Sem SELECT/INSERT/UPDATE para authenticated: o token nunca chega ao navegador.
-- O service_role ignora RLS, então as edge functions acessam normalmente.
-- Exceção: a nutri pode APAGAR a própria linha (desconectar) — deletar não
-- expõe o token.
drop policy if exists "google_secret_self_delete" on public.google_secret;
create policy "google_secret_self_delete" on public.google_secret
  for delete using (auth.uid() = nutricionista_id);

-- ---------- Nonce do fluxo OAuth (liga o retorno do Google à nutri certa) ----------
-- O callback do Google não carrega o JWT da nutri; usamos um nonce de uso
-- único, criado no start (autenticado) e consumido no callback.
create table if not exists public.google_oauth_state (
  nonce            text primary key,
  nutricionista_id uuid not null references auth.users(id) on delete cascade,
  created_at       timestamptz not null default now(),
  expires_at       timestamptz not null default now() + interval '15 minutes'
);

alter table public.google_oauth_state enable row level security;
-- Sem policies: manipulado só pelo service_role nas edge functions.

-- ---------- Consultas: guarda o vínculo com o evento do Google ----------
alter table public.consultas add column if not exists google_event_id text;
alter table public.consultas add column if not exists meet_url         text;

-- Recarrega o schema cache do PostgREST (evita "schema cache" nas colunas novas).
notify pgrst, 'reload schema';
