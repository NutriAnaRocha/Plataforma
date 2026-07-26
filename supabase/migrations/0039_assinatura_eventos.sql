-- ============================================================
--  Plataforma Nutri — Migração 0039
--  Auditoria dos eventos do webhook de assinatura (recorrência).
--  Uma linha por notificação recebida do provedor de pagamento — payload
--  cru para depurar os nomes reais dos campos e reconciliar cobranças.
--  Escrita só por service_role (o webhook); leitura só por admin.
-- ============================================================
create table if not exists public.assinatura_eventos (
  id         uuid primary key default gen_random_uuid(),
  email      text,
  nome       text,
  evento     text,
  ref        text,
  provider   text,
  payload    jsonb,
  created_at timestamptz not null default now()
);

create index if not exists assinatura_eventos_email_idx on public.assinatura_eventos (lower(email));
create index if not exists assinatura_eventos_created_idx on public.assinatura_eventos (created_at desc);

alter table public.assinatura_eventos enable row level security;

-- Só admin lê (o webhook grava via service_role, que ignora RLS).
drop policy if exists "assinatura_eventos_admin_read" on public.assinatura_eventos;
create policy "assinatura_eventos_admin_read" on public.assinatura_eventos
  for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

notify pgrst, 'reload schema';
