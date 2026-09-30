-- ============================================================
--  Plataforma Nutri — Migração 0099
--  RENOVAÇÃO ASSISTIDA (17/09/2026).
--
--  A InfinitePay não cobra sozinha todo mês: o link de checkout é avulso
--  (ver nutriplat-pagamento). Em vez de recorrência, avisamos ANTES de
--  vencer, com o link pronto, e damos uma carência curta depois.
--
--    trial:   3 dias antes do fim e no dia do fim
--    ativa:   5 dias antes, 1 dia antes, 1 dia depois (carência) e no
--             último dia da carência (bloqueio)
--
--  Carência = 3 dias: quem venceu ontem continua entrando e continua na
--  vitrine, para ninguém perder paciente por causa de um Pix atrasado.
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- ---------- 1) Carência: uma constante só, usada aqui e no front ----------
create or replace function public.nutriplat_carencia_dias()
returns int language sql immutable as $$ select 3 $$;

-- A vitrine acompanha a carência (o auth-guard faz o mesmo no navegador).
create or replace function public.nutri_na_vitrine(p_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
     where p.id = p_id
       and p.perfil_status = 'aprovado'
       and (p.is_admin = true
            or (p.assinatura_status = 'ativa'
                and (p.assinatura_expira_em is null
                     or p.assinatura_expira_em > now() - make_interval(days => public.nutriplat_carencia_dias()))))
  );
$$;

-- ---------- 2) Registro dos avisos ----------
-- referencia = a data do vencimento a que o aviso se refere. É o que
-- permite avisar de novo no mês seguinte sem repetir no mesmo mês.
create table if not exists public.renovacao_avisos (
  id         bigserial primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  tipo       text not null,
  referencia date not null,
  canal      text not null default 'email',
  ok         boolean not null default true,
  detalhe    text,
  criado_em  timestamptz not null default now(),
  constraint renovacao_avisos_unq unique (user_id, tipo, referencia)
);
-- Sem policy = ninguém lê pelo anon/authenticated (só service_role).
alter table public.renovacao_avisos enable row level security;

create index if not exists renovacao_avisos_user_idx on public.renovacao_avisos (user_id, criado_em desc);

-- ---------- 3) Quem avisar hoje ----------
create or replace function public.renovacoes_a_avisar()
returns table (
  user_id uuid, email text, nome text, tipo text,
  referencia date, dias int, ciclo text, preco int
)
language sql stable security definer set search_path = public as $$
  with hoje as (select (now() at time zone 'America/Sao_Paulo')::date as d),
  base as (
    select p.id, p.email, p.nome,
           p.assinatura_status as st,
           coalesce(p.plano_ciclo, 'mensal') as ciclo,
           case when p.assinatura_status = 'trial' then p.trial_expira_em
                else p.assinatura_expira_em end as fim
      from public.profiles p
     where coalesce(p.tipo, 'nutri') = 'nutri'
       and p.is_admin is not true
       and p.email is not null
       -- Embaixadora tem acesso de cortesia: a renovação dela é combinada
       -- com a Ana, não é para receber cobrança.
       and not exists (select 1 from public.embaixadoras e where e.user_id = p.id and e.ativa)
       -- 'ativa' só conta quando veio de pagamento: conta de convite/cortesia
       -- não recebe aviso de renovação.
       and (p.assinatura_status = 'trial'
            or (p.assinatura_status = 'ativa' and p.assinatura_provider = 'infinitepay'))
  ),
  calc as (
    select b.*, ((b.fim at time zone 'America/Sao_Paulo')::date - h.d) as dias,
           (b.fim at time zone 'America/Sao_Paulo')::date as ref
      from base b cross join hoje h
     where b.fim is not null
  ),
  marcado as (
    select c.*,
           case when c.st = 'trial' then
                  case c.dias when 3 then 'trial_3d' when 0 then 'trial_fim' end
                else
                  case c.dias when 5 then 'vence_5d' when 1 then 'vence_1d'
                              when -1 then 'venceu'  when -3 then 'bloqueio' end
           end as tipo
      from calc c
  )
  select m.id, m.email, m.nome, m.tipo, m.ref, m.dias, m.ciclo,
         public.nutriplat_preco(m.id, m.ciclo)
    from marcado m
   where m.tipo is not null
     and not exists (
       select 1 from public.renovacao_avisos a
        where a.user_id = m.id and a.tipo = m.tipo and a.referencia = m.ref)
   order by m.dias;
$$;

create or replace function public.registrar_aviso_renovacao(
  p_user uuid, p_tipo text, p_ref date,
  p_canal text default 'email', p_ok boolean default true, p_detalhe text default null
) returns void language sql security definer set search_path = public as $$
  insert into public.renovacao_avisos (user_id, tipo, referencia, canal, ok, detalhe)
  values (p_user, p_tipo, p_ref, p_canal, p_ok, left(coalesce(p_detalhe, ''), 300))
  on conflict (user_id, tipo, referencia) do nothing;
$$;

revoke all on function public.renovacoes_a_avisar() from public, anon, authenticated;
revoke all on function public.registrar_aviso_renovacao(uuid, text, date, text, boolean, text)
  from public, anon, authenticated;
grant execute on function public.renovacoes_a_avisar() to service_role;
grant execute on function public.registrar_aviso_renovacao(uuid, text, date, text, boolean, text) to service_role;

-- ---------- 4) Admin: o que foi avisado ----------
create or replace function public.admin_avisos_renovacao()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.eh_admin() then return null; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
      'nome', p.nome, 'email', p.email, 'tipo', a.tipo, 'referencia', a.referencia,
      'canal', a.canal, 'ok', a.ok, 'detalhe', a.detalhe, 'em', a.criado_em
    ) order by a.criado_em desc)
    from renovacao_avisos a join profiles p on p.id = a.user_id
   where a.criado_em > now() - interval '30 days'), '[]'::jsonb);
end; $$;
revoke all on function public.admin_avisos_renovacao() from public, anon;
grant execute on function public.admin_avisos_renovacao() to authenticated;

notify pgrst, 'reload schema';
