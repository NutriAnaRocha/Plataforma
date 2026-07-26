-- ============================================================
--  Plataforma Nutri — Migração 0038
--  ASSINATURA / TRIAL da nutricionista (monetização do SaaS).
--
--  Contexto: até aqui o acesso era por convite e gratuito. Esta migração
--  cria a camada de cobrança recorrente:
--    - período de trial (avaliação) automático para novas contas self-serve;
--    - status da assinatura (ativa/vencida/cancelada);
--    - data de expiração que o webhook de pagamento renova.
--
--  Modelo de acesso (enforcement na UI, ver assinatura.js):
--    liberado = is_admin
--            OR (status = 'ativa'  AND (assinatura_expira_em IS NULL OR futuro))
--            OR (status = 'trial'  AND trial_expira_em > agora)
--  A proteção REAL dos dados continua sendo o RLS por auth.uid() — o gate de
--  assinatura só tranca a INTERFACE (billing), nunca é a barreira de segurança.
--
--  As colunas de billing são SOMENTE-LEITURA para a própria nutri (um trigger
--  bloqueia a alteração). Só mudam por SECURITY DEFINER (webhook/admin), que
--  levantam a flag app.allow_billing antes de gravar.
-- ============================================================

-- 1) Colunas de billing no perfil.
alter table public.profiles
  add column if not exists assinatura_status    text        not null default 'trial',
  add column if not exists trial_expira_em      timestamptz not null default (now() + interval '14 days'),
  add column if not exists assinatura_expira_em timestamptz,
  add column if not exists assinatura_provider  text,
  add column if not exists assinatura_ref       text;

-- Domínio dos valores válidos (defensivo).
alter table public.profiles drop constraint if exists profiles_assinatura_status_chk;
alter table public.profiles add constraint profiles_assinatura_status_chk
  check (assinatura_status in ('trial','ativa','vencida','cancelada'));

-- 2) Backfill: ninguém que JÁ usa a plataforma pode ser trancado por esta
--    migração. Toda nutri existente (e o admin) entra como 'ativa' sem prazo.
--    Só contas criadas DEPOIS daqui nascem em 'trial'.
update public.profiles
   set assinatura_status = 'ativa', assinatura_expira_em = null
 where coalesce(tipo, 'nutri') = 'nutri' or is_admin = true;

-- 3) Trigger que torna as colunas de billing imutáveis pela própria nutri.
--    Sem isto, bastaria um update no console (auth.uid()=id já é permitido
--    por profiles_update_own) para virar 'ativa' e furar o paywall.
--    As funções SECURITY DEFINER abaixo levantam app.allow_billing='on'.
create or replace function public.guard_billing_cols()
returns trigger language plpgsql as $$
begin
  if (new.assinatura_status    is distinct from old.assinatura_status
   or new.trial_expira_em      is distinct from old.trial_expira_em
   or new.assinatura_expira_em is distinct from old.assinatura_expira_em
   or new.assinatura_provider  is distinct from old.assinatura_provider
   or new.assinatura_ref       is distinct from old.assinatura_ref)
   and coalesce(current_setting('app.allow_billing', true), 'off') <> 'on' then
    raise exception 'colunas de assinatura são somente-leitura (billing)';
  end if;
  return new;
end; $$;

drop trigger if exists trg_guard_billing on public.profiles;
create trigger trg_guard_billing
  before update on public.profiles
  for each row execute function public.guard_billing_cols();

-- 4) Ativar/renovar a assinatura de uma nutri pelo e-mail, somando um ciclo.
--    Chamada pelo webhook de pagamento (service_role). Idempotente por ciclo:
--    renova a partir da validade vigente (se futura) ou de agora.
create or replace function public.ativar_assinatura(
  p_email    text,
  p_meses    int    default 1,
  p_provider text   default null,
  p_ref      text   default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id   uuid;
  v_base timestamptz;
begin
  perform set_config('app.allow_billing', 'on', true);  -- libera o trigger nesta transação
  select id, assinatura_expira_em into v_id, v_base
    from public.profiles where lower(email) = lower(p_email) limit 1;
  if v_id is null then
    return; -- sem conta ainda; o webhook cria a conta antes de chamar.
  end if;
  if v_base is null or v_base < now() then v_base := now(); end if;
  update public.profiles
     set assinatura_status = 'ativa',
         assinatura_expira_em = v_base + (p_meses || ' months')::interval,
         assinatura_provider = coalesce(p_provider, assinatura_provider),
         assinatura_ref = coalesce(p_ref, assinatura_ref)
   where id = v_id;
end; $$;

-- 5) Marcar como vencida/cancelada (chamada por webhook de falha/cancelamento).
create or replace function public.encerrar_assinatura(
  p_email  text,
  p_status text default 'cancelada'   -- 'vencida' | 'cancelada'
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('vencida','cancelada') then p_status := 'cancelada'; end if;
  perform set_config('app.allow_billing', 'on', true);
  update public.profiles
     set assinatura_status = p_status
   where lower(email) = lower(p_email);
end; $$;

notify pgrst, 'reload schema';
