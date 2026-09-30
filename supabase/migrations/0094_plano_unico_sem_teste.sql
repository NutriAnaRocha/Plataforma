-- ============================================================
--  Plataforma Nutri — Migração 0094
--  PLANO ÚNICO, SEM TESTE GRÁTIS, VITRINE SÓ PARA ASSINANTE (15/09/2026).
--
--  Decisão da Ana: não existe mais plano só de vitrine nem vitrine grátis.
--  A vitrine é o diferencial que vem junto com a plataforma — quem não
--  assina não aparece. Preço: R$ 39,90/mês nas 3 primeiras mensalidades,
--  depois R$ 89,90; anual R$ 799. Sem teste de 14 dias.
--
--    1) conta nova nasce 'pendente' (sem acesso até o 1º pagamento);
--    2) assinatura_pagamentos conta as mensalidades pagas — é o que decide
--       se a tela de assinatura oferece o preço de entrada ou o cheio;
--    3) nutri_na_vitrine(): perfil aprovado E assinatura vigente (ou admin).
--       A edge function diretorio-buscar aplica a mesma regra;
--    4) o pedido de atendimento pelo portal só vai para quem está na vitrine.
-- ============================================================

-- ---------- 1) Status 'pendente' e fim do trial ----------
alter table public.profiles drop constraint if exists profiles_assinatura_status_chk;
alter table public.profiles add constraint profiles_assinatura_status_chk
  check (assinatura_status in ('pendente','trial','ativa','vencida','cancelada'));

alter table public.profiles alter column assinatura_status set default 'pendente';
alter table public.profiles alter column trial_expira_em  set default now();

-- ---------- 2) Contador de mensalidades pagas ----------
alter table public.profiles
  add column if not exists assinatura_pagamentos integer not null default 0;

-- A própria nutri não pode zerar o contador para voltar ao preço de entrada.
-- Webhook/admin (sem JWT de usuário) e as RPCs com app.allow_billing passam.
create or replace function public.guard_assinatura_pagamentos()
returns trigger
language plpgsql
as $$
begin
  if new.assinatura_pagamentos is distinct from old.assinatura_pagamentos
     and auth.uid() is not null
     and coalesce(current_setting('app.allow_billing', true), '') <> 'on' then
    raise exception 'assinatura_pagamentos só muda por pagamento';
  end if;
  return new;
end; $$;

drop trigger if exists trg_guard_assinatura_pagamentos on public.profiles;
create trigger trg_guard_assinatura_pagamentos
  before update on public.profiles
  for each row execute function public.guard_assinatura_pagamentos();

-- ---------- 3) Quem aparece na vitrine ----------
create or replace function public.nutri_na_vitrine(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
     where p.id = p_id
       and p.perfil_status = 'aprovado'
       and (p.is_admin = true
            or (p.assinatura_status = 'ativa'
                and (p.assinatura_expira_em is null or p.assinatura_expira_em > now())))
  );
$$;

-- ---------- 4) Pedido de atendimento só para nutri na vitrine ----------
drop policy if exists "solicitacoes_paciente_insert" on public.solicitacoes_atendimento;
create policy "solicitacoes_paciente_insert" on public.solicitacoes_atendimento
  for insert with check (
    auth.uid() = paciente_user_id
    and status = 'nova'
    and public.nutri_na_vitrine(nutricionista_id)
    and exists (
      select 1 from public.profiles p
       where p.id = nutricionista_id
         and p.aceita_novos = true
    )
  );

-- ---------- 5) Billing: um plano só, e conta a mensalidade ----------
create or replace function public.ativar_assinatura(
  p_email    text,
  p_meses    int  default 1,
  p_provider text default null,
  p_ref      text default null,
  p_tier     text default 'plataforma',
  p_ciclo    text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id    uuid;
  v_base  timestamptz;
  v_ciclo text;
begin
  -- 'completo' fica reservado para quando o WhatsApp entrar no plano;
  -- qualquer outro nome (gratis, vitrine, essencial, indicada) é a plataforma.
  if p_tier is distinct from 'completo' then p_tier := 'plataforma'; end if;

  v_ciclo := coalesce(p_ciclo, case when p_meses >= 12 then 'anual' else 'mensal' end);
  if v_ciclo not in ('mensal','trimestral','semestral','anual') then v_ciclo := 'mensal'; end if;

  perform set_config('app.allow_billing',  'on', true);
  perform set_config('app.allow_curadoria','on', true);

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
         assinatura_ref = coalesce(p_ref, assinatura_ref),
         assinatura_pagamentos = assinatura_pagamentos + 1,
         plano_tier = p_tier,
         plano_ciclo = v_ciclo
   where id = v_id;
end; $$;

notify pgrst, 'reload schema';
