-- ============================================================
--  Plataforma Nutri — Migração 0097
--  TESTE DE 15 DIAS, PREÇOS NOVOS, SEMESTRAL E CARÊNCIA DE 7 DIAS (17/09/2026).
--
--  Decisão da Ana, depois da pesquisa (WebDiet 94,90 com 3 meses a 49,90;
--  Dietbox semestral 83,65/mês e anual 76,58/mês; DietSystem 79,90):
--    * 15 dias grátis — SEM vitrine (nutri_na_vitrine já exige 'ativa'),
--      para ninguém captar paciente de graça e atender em outro sistema;
--    * 3 mensalidades com 50% (R$ 39,95), 4 para quem veio por cupom;
--    * mensal R$ 79,90 · semestral R$ 419,40 · anual R$ 719.
--  Comissão: só vira "a pagar" 7 dias depois do pagamento (arrependimento);
--  reembolso dentro desse prazo cancela a comissão.
-- ============================================================

-- ---------- 1) Conta nova nasce em teste de 15 dias ----------
alter table public.profiles alter column assinatura_status set default 'trial';
alter table public.profiles alter column trial_expira_em  set default (now() + interval '15 days');

-- Quem se cadastrou no regime "sem teste" e nunca pagou ganha os 15 dias agora.
update public.profiles
   set assinatura_status = 'trial', trial_expira_em = now() + interval '15 days'
 where assinatura_status = 'pendente'
   and coalesce(assinatura_pagamentos, 0) = 0
   and coalesce(tipo, 'nutri') <> 'paciente';

-- ---------- 2) Preço de tabela ----------
create or replace function public.nutriplat_preco(p_user uuid, p_ciclo text)
returns int language sql stable security definer set search_path = public as $$
  select case
    when p_ciclo = 'anual'     then 71900
    when p_ciclo = 'semestral' then 41940
    when coalesce(p.assinatura_pagamentos, 0) < (case when p.indicada_por is null then 3 else 4 end) then 3995
    else 7990 end
  from public.profiles p where p.id = p_user;
$$;

-- ---------- 3) Ativar: quem paga durante o teste não perde os dias grátis ----------
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
  v_id     uuid;
  v_base   timestamptz;
  v_status text;
  v_trial  timestamptz;
  v_ciclo  text;
begin
  if p_tier is distinct from 'completo' then p_tier := 'plataforma'; end if;

  v_ciclo := coalesce(p_ciclo, case when p_meses >= 12 then 'anual' when p_meses >= 6 then 'semestral' else 'mensal' end);
  if v_ciclo not in ('mensal','trimestral','semestral','anual') then v_ciclo := 'mensal'; end if;

  perform set_config('app.allow_billing',  'on', true);
  perform set_config('app.allow_curadoria','on', true);

  select id, assinatura_expira_em, assinatura_status, trial_expira_em
    into v_id, v_base, v_status, v_trial
    from public.profiles where lower(email) = lower(p_email) limit 1;
  if v_id is null then
    return;
  end if;
  if v_base is null or v_base < now() then v_base := now(); end if;
  if v_status = 'trial' and v_trial > v_base then v_base := v_trial; end if;

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

-- ---------- 4) Registrar pagamento: semestral = 6 meses ----------
create or replace function public.registrar_pagamento_nutriplat(
  p_user uuid, p_nsu text, p_order text, p_slug text,
  p_valor int, p_ciclo text, p_recibo text, p_payload jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_prof     public.profiles%rowtype;
  v_emb      public.embaixadoras%rowtype;
  v_tabela   int;
  v_primeira timestamptz;
  v_comissao int := 0;
begin
  select * into v_prof from public.profiles where id = p_user;
  if v_prof.id is null then return jsonb_build_object('ok', false, 'motivo', 'sem_conta'); end if;

  v_tabela := public.nutriplat_preco(p_user, p_ciclo);

  insert into public.nutriplat_pagamentos
    (transaction_nsu, user_id, order_nsu, invoice_slug, ciclo, valor_pago, valor_tabela, receipt_url, payload)
  values (p_nsu, p_user, p_order, p_slug, p_ciclo, p_valor, v_tabela, p_recibo, p_payload)
  on conflict (transaction_nsu) do nothing;
  if not found then return jsonb_build_object('ok', true, 'ja_registrado', true); end if;

  perform public.ativar_assinatura(v_prof.email,
    case p_ciclo when 'anual' then 12 when 'semestral' then 6 else 1 end,
    'infinitepay', p_nsu, 'plataforma', p_ciclo);

  if v_prof.indicada_por is not null then
    select * into v_emb from public.embaixadoras where id = v_prof.indicada_por;
    select min(criado_em) into v_primeira from public.comissoes where indicada_id = p_user and cancelada_em is null;
    if v_emb.ativa and v_emb.user_id <> p_user
       and (v_primeira is null or now() < v_primeira + make_interval(months => v_emb.meses_comissao)) then
      v_comissao := round(v_tabela * v_emb.percentual / 100.0);
      insert into public.comissoes (embaixadora_id, indicada_id, transaction_nsu, ciclo, valor_base, valor)
      values (v_emb.id, p_user, p_nsu, p_ciclo, v_tabela, v_comissao);
    end if;
  end if;

  return jsonb_build_object('ok', true, 'valor_tabela', v_tabela, 'comissao', v_comissao);
end; $$;
revoke all on function public.registrar_pagamento_nutriplat(uuid, text, text, text, int, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.registrar_pagamento_nutriplat(uuid, text, text, text, int, text, text, jsonb) to service_role;

-- ---------- 5) Carência de 7 dias e reembolso ----------
alter table public.comissoes add column if not exists cancelada_em timestamptz;
alter table public.nutriplat_pagamentos add column if not exists reembolsado_em timestamptz;

-- Uma regra só para "pode pagar": fora do reembolso, entrou antes deste mês
-- e já passou o prazo de arrependimento.
create or replace function public.comissao_liberada(c public.comissoes)
returns boolean language sql stable as $$
  select c.pago_em is null and c.cancelada_em is null
     and c.criado_em < public.inicio_mes_brasilia()
     and c.criado_em + interval '7 days' <= now();
$$;

create or replace function public.minhas_indicacoes()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_emb public.embaixadoras%rowtype;
begin
  select * into v_emb from public.embaixadoras where user_id = auth.uid();
  if v_emb.id is null then return null; end if;
  return jsonb_build_object(
    'cupom', v_emb.cupom, 'pix', v_emb.pix_chave, 'ativa', v_emb.ativa,
    'percentual', v_emb.percentual, 'meses', v_emb.meses_comissao,
    'a_receber', (select coalesce(sum(valor),0) from comissoes c where c.embaixadora_id = v_emb.id and public.comissao_liberada(c)),
    'acumulando', (select coalesce(sum(valor),0) from comissoes c where c.embaixadora_id = v_emb.id
                     and c.pago_em is null and c.cancelada_em is null and not public.comissao_liberada(c)),
    'recebido', (select coalesce(sum(valor),0) from comissoes where embaixadora_id = v_emb.id and pago_em is not null),
    'indicadas', coalesce((select jsonb_agg(jsonb_build_object(
        'nome', split_part(coalesce(p.nome,''), ' ', 1),
        'desde', p.indicada_em,
        'ativa', p.assinatura_status = 'ativa' and (p.assinatura_expira_em is null or p.assinatura_expira_em > now()),
        'pagamentos', (select count(*) from comissoes c where c.indicada_id = p.id and c.cancelada_em is null)
      ) order by p.indicada_em desc)
      from profiles p where p.indicada_por = v_emb.id), '[]'::jsonb),
    'pagamentos', coalesce((select jsonb_agg(x order by x->>'pago_em' desc) from (
        select jsonb_build_object('pago_em', date_trunc('day', pago_em), 'valor', sum(valor)) x
          from comissoes where embaixadora_id = v_emb.id and pago_em is not null
         group by date_trunc('day', pago_em)) t), '[]'::jsonb)
  );
end; $$;

create or replace function public.admin_embaixadoras()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.eh_admin() then return null; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', e.id, 'nome', p.nome, 'email', p.email, 'cupom', e.cupom, 'pix', e.pix_chave,
      'ativa', e.ativa, 'gratis_ate', p.assinatura_expira_em,
      'indicadas', (select count(*) from profiles i where i.indicada_por = e.id),
      'pagantes', (select count(distinct c.indicada_id) from comissoes c where c.embaixadora_id = e.id and c.cancelada_em is null),
      'a_pagar', (select coalesce(sum(valor),0) from comissoes c where c.embaixadora_id = e.id and public.comissao_liberada(c)),
      'acumulando', (select coalesce(sum(valor),0) from comissoes c where c.embaixadora_id = e.id
                       and c.pago_em is null and c.cancelada_em is null and not public.comissao_liberada(c)),
      'pago', (select coalesce(sum(valor),0) from comissoes c where c.embaixadora_id = e.id and c.pago_em is not null)
    ) order by p.nome)
    from embaixadoras e join profiles p on p.id = e.user_id), '[]'::jsonb);
end; $$;

create or replace function public.admin_comissao_paga(p_embaixadora uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_total int;
begin
  if not public.eh_admin() then return jsonb_build_object('ok', false, 'motivo', 'nao_autorizado'); end if;
  with pagas as (
    update comissoes c set pago_em = now()
     where c.embaixadora_id = p_embaixadora and public.comissao_liberada(c)
    returning valor)
  select coalesce(sum(valor),0) into v_total from pagas;
  return jsonb_build_object('ok', true, 'total', v_total);
end; $$;

-- Pagamentos dos últimos 7 dias (os que ainda podem ser reembolsados).
create or replace function public.admin_pagamentos_recentes()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.eh_admin() then return null; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
      'nsu', g.transaction_nsu, 'nome', p.nome, 'email', p.email, 'ciclo', g.ciclo,
      'valor', g.valor_pago, 'em', g.criado_em,
      'comissao', (select c.valor from comissoes c where c.transaction_nsu = g.transaction_nsu and c.cancelada_em is null)
    ) order by g.criado_em desc)
    from nutriplat_pagamentos g join profiles p on p.id = g.user_id
   where g.reembolsado_em is null and g.criado_em > now() - interval '7 days'), '[]'::jsonb);
end; $$;

-- "Reembolsou": cancela a comissão, desfaz o período pago e tira da vitrine.
create or replace function public.admin_reembolsou(p_nsu text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_pg   public.nutriplat_pagamentos%rowtype;
  v_meses int;
begin
  if not public.eh_admin() then return jsonb_build_object('ok', false, 'motivo', 'nao_autorizado'); end if;
  select * into v_pg from nutriplat_pagamentos where transaction_nsu = p_nsu;
  if v_pg.transaction_nsu is null then return jsonb_build_object('ok', false, 'motivo', 'sem_pagamento'); end if;
  if v_pg.reembolsado_em is not null then return jsonb_build_object('ok', true, 'ja_registrado', true); end if;

  update nutriplat_pagamentos set reembolsado_em = now() where transaction_nsu = p_nsu;
  update comissoes set cancelada_em = now() where transaction_nsu = p_nsu and pago_em is null;

  v_meses := case v_pg.ciclo when 'anual' then 12 when 'semestral' then 6 else 1 end;
  perform set_config('app.allow_billing', 'on', true);
  update profiles
     set assinatura_expira_em = assinatura_expira_em - make_interval(months => v_meses),
         assinatura_pagamentos = greatest(assinatura_pagamentos - 1, 0),
         assinatura_status = case when assinatura_expira_em - make_interval(months => v_meses) <= now()
                                  then 'cancelada' else assinatura_status end
   where id = v_pg.user_id and assinatura_expira_em is not null;
  return jsonb_build_object('ok', true);
end; $$;

revoke all on function public.admin_pagamentos_recentes() from public, anon;
revoke all on function public.admin_reembolsou(text) from public, anon;
grant execute on function public.admin_pagamentos_recentes() to authenticated;
grant execute on function public.admin_reembolsou(text) to authenticated;

notify pgrst, 'reload schema';
