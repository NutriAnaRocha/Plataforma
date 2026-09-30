-- ============================================================
--  Plataforma Nutri — Migração 0096
--  EMBAIXADORAS, CUPOM DE INDICAÇÃO E COMISSÃO (17/09/2026).
--
--  Regras combinadas com a Ana:
--    * a embaixadora produz conteúdo e não paga a assinatura (6 meses,
--      renováveis — a Ana libera no Admin);
--    * a nutri NOVA digita o cupom da embaixadora ao se cadastrar (ou na
--      tela de assinatura, antes do 1º pagamento). A indicação fica gravada
--      no perfil e não muda mais;
--    * a indicada ganha 1 mês a mais no preço de entrada (4 mensalidades de
--      R$ 39,90 em vez de 3);
--    * comissão de 30% sobre o PREÇO DE TABELA de cada pagamento confirmado
--      da indicada, por 12 meses contados do 1º pagamento dela. Tabela e não
--      valor pago: o juros do parcelado não é receita da NutriPlat;
--    * a Ana paga por Pix no 1º dia útil do mês o que entrou no mês anterior,
--      e marca "Paguei" — cada comissão só é paga uma vez.
--
--  Por que o pagamento carrega o id da nutri: a API de checkout da
--  InfinitePay só cria link avulso e o webhook não traz e-mail (ver
--  mercado-webhook). O link é criado para ELA, com o id no order_nsu —
--  e é isso que liga pagamento -> nutri -> embaixadora sem ninguém digitar.
-- ============================================================

-- ---------- 1) Embaixadoras ----------
create table if not exists public.embaixadoras (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references public.profiles(id) on delete cascade,
  cupom           text not null unique check (cupom ~ '^[A-Z0-9]{4,20}$'),
  pix_chave       text,
  percentual      numeric(5,2) not null default 30,
  meses_comissao  int not null default 12,
  ativa           boolean not null default true,
  criado_em       timestamptz not null default now()
);
alter table public.embaixadoras enable row level security;
drop policy if exists "embaixadora_le_a_propria" on public.embaixadoras;
create policy "embaixadora_le_a_propria" on public.embaixadoras
  for select using (user_id = auth.uid());

-- ---------- 2) Quem indicou (gravado uma vez) ----------
alter table public.profiles
  add column if not exists indicada_por uuid references public.embaixadoras(id) on delete set null,
  add column if not exists indicada_em  timestamptz;

create or replace function public.guard_indicada_por()
returns trigger language plpgsql as $$
begin
  if new.indicada_por is distinct from old.indicada_por
     and auth.uid() is not null
     and coalesce(current_setting('app.allow_billing', true), '') <> 'on' then
    raise exception 'indicada_por só muda pelo cupom';
  end if;
  return new;
end; $$;
drop trigger if exists trg_guard_indicada_por on public.profiles;
create trigger trg_guard_indicada_por
  before update on public.profiles
  for each row execute function public.guard_indicada_por();

-- ---------- 3) Pagamentos da assinatura ----------
create table if not exists public.nutriplat_pagamentos (
  transaction_nsu  text primary key,
  user_id          uuid references public.profiles(id) on delete set null,
  order_nsu        text,
  invoice_slug     text,
  ciclo            text,
  valor_pago       int,
  valor_tabela     int,
  receipt_url      text,
  payload          jsonb,
  criado_em        timestamptz not null default now()
);
alter table public.nutriplat_pagamentos enable row level security;

-- ---------- 4) Comissões ----------
create table if not exists public.comissoes (
  id               uuid primary key default gen_random_uuid(),
  embaixadora_id   uuid not null references public.embaixadoras(id) on delete cascade,
  indicada_id      uuid not null references public.profiles(id) on delete cascade,
  transaction_nsu  text not null unique references public.nutriplat_pagamentos(transaction_nsu),
  ciclo            text not null,
  valor_base       int not null,
  valor            int not null,
  criado_em        timestamptz not null default now(),
  pago_em          timestamptz
);
create index if not exists comissoes_emb_idx on public.comissoes (embaixadora_id, pago_em);
alter table public.comissoes enable row level security;

-- ---------- 5) Cupom: nome da embaixadora (tela pública) ----------
create or replace function public.cupom_embaixadora(p_cupom text)
returns text language sql stable security definer set search_path = public as $$
  select split_part(coalesce(p.nome, ''), ' ', 1)
    from public.embaixadoras e join public.profiles p on p.id = e.user_id
   where e.cupom = upper(trim(p_cupom)) and e.ativa;
$$;
grant execute on function public.cupom_embaixadora(text) to anon, authenticated;

-- Aplica o cupom numa conta. Só antes do 1º pagamento e só uma vez;
-- ninguém usa o próprio cupom. Chamado pelo cadastro (service_role, com
-- p_user) e pela tela de assinatura (a própria nutri, sem p_user).
create or replace function public.aplicar_cupom(p_cupom text, p_user uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := coalesce(auth.uid(), p_user);
  v_emb  public.embaixadoras%rowtype;
  v_prof public.profiles%rowtype;
begin
  if auth.uid() is not null and p_user is not null and p_user <> auth.uid() then
    return jsonb_build_object('ok', false, 'motivo', 'nao_autorizado');
  end if;
  select * into v_emb from public.embaixadoras where cupom = upper(trim(p_cupom)) and ativa;
  if v_emb.id is null then return jsonb_build_object('ok', false, 'motivo', 'cupom_invalido'); end if;
  select * into v_prof from public.profiles where id = v_user;
  if v_prof.id is null then return jsonb_build_object('ok', false, 'motivo', 'sem_conta'); end if;
  if v_emb.user_id = v_user then return jsonb_build_object('ok', false, 'motivo', 'proprio_cupom'); end if;
  if v_prof.indicada_por is not null then return jsonb_build_object('ok', false, 'motivo', 'ja_indicada'); end if;
  if coalesce(v_prof.assinatura_pagamentos, 0) > 0 then
    return jsonb_build_object('ok', false, 'motivo', 'ja_assinante');
  end if;
  perform set_config('app.allow_billing', 'on', true);
  update public.profiles set indicada_por = v_emb.id, indicada_em = now() where id = v_user;
  return jsonb_build_object('ok', true);
end; $$;
revoke all on function public.aplicar_cupom(text, uuid) from public, anon;
grant execute on function public.aplicar_cupom(text, uuid) to authenticated, service_role;

-- ---------- 6) Preço de tabela (uma verdade só) ----------
-- Entrada: 3 mensalidades a R$ 39,90; indicada ganha a 4ª.
create or replace function public.nutriplat_preco(p_user uuid, p_ciclo text)
returns int language sql stable security definer set search_path = public as $$
  select case
    when p_ciclo = 'anual' then 79900
    when coalesce(p.assinatura_pagamentos, 0) < (case when p.indicada_por is null then 3 else 4 end) then 3990
    else 8990 end
  from public.profiles p where p.id = p_user;
$$;
revoke all on function public.nutriplat_preco(uuid, text) from public, anon;
grant execute on function public.nutriplat_preco(uuid, text) to authenticated, service_role;

-- ---------- 7) Registrar pagamento confirmado ----------
-- Idempotente pelo transaction_nsu: webhook e redirect podem chegar os dois.
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

  perform public.ativar_assinatura(v_prof.email, case when p_ciclo = 'anual' then 12 else 1 end,
                                   'infinitepay', p_nsu, 'plataforma', p_ciclo);

  if v_prof.indicada_por is not null then
    select * into v_emb from public.embaixadoras where id = v_prof.indicada_por;
    select min(criado_em) into v_primeira from public.comissoes where indicada_id = p_user;
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

-- Mês "fechado" é o horário de Brasília: o que entrou até o fim do mês
-- anterior é o que se paga no 1º dia útil.
create or replace function public.inicio_mes_brasilia()
returns timestamptz language sql stable as $$
  select (date_trunc('month', now() at time zone 'America/Sao_Paulo')) at time zone 'America/Sao_Paulo';
$$;

-- ---------- 8) Painel da embaixadora ----------
create or replace function public.minhas_indicacoes()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_emb public.embaixadoras%rowtype;
  v_ini timestamptz := public.inicio_mes_brasilia();
begin
  select * into v_emb from public.embaixadoras where user_id = auth.uid();
  if v_emb.id is null then return null; end if;
  return jsonb_build_object(
    'cupom', v_emb.cupom, 'pix', v_emb.pix_chave, 'ativa', v_emb.ativa,
    'percentual', v_emb.percentual, 'meses', v_emb.meses_comissao,
    'a_receber', (select coalesce(sum(valor),0) from comissoes where embaixadora_id = v_emb.id and pago_em is null and criado_em < v_ini),
    'acumulando', (select coalesce(sum(valor),0) from comissoes where embaixadora_id = v_emb.id and pago_em is null and criado_em >= v_ini),
    'recebido', (select coalesce(sum(valor),0) from comissoes where embaixadora_id = v_emb.id and pago_em is not null),
    -- Só o primeiro nome: a embaixadora precisa saber que a indicação
    -- entrou, não os dados da colega.
    'indicadas', coalesce((select jsonb_agg(jsonb_build_object(
        'nome', split_part(coalesce(p.nome,''), ' ', 1),
        'desde', p.indicada_em,
        'ativa', p.assinatura_status = 'ativa' and (p.assinatura_expira_em is null or p.assinatura_expira_em > now()),
        'pagamentos', (select count(*) from comissoes c where c.indicada_id = p.id)
      ) order by p.indicada_em desc)
      from profiles p where p.indicada_por = v_emb.id), '[]'::jsonb),
    'pagamentos', coalesce((select jsonb_agg(x order by x->>'pago_em' desc) from (
        select jsonb_build_object('pago_em', date_trunc('day', pago_em), 'valor', sum(valor)) x
          from comissoes where embaixadora_id = v_emb.id and pago_em is not null
         group by date_trunc('day', pago_em)) t), '[]'::jsonb)
  );
end; $$;
revoke all on function public.minhas_indicacoes() from public, anon;
grant execute on function public.minhas_indicacoes() to authenticated;

-- ---------- 9) Admin ----------
create or replace function public.eh_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

-- Cadastra ou atualiza a embaixadora e libera a assinatura grátis.
create or replace function public.admin_embaixadora_salvar(
  p_email text, p_cupom text, p_pix text, p_meses_gratis int default 6
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user  uuid;
  v_cupom text := upper(regexp_replace(coalesce(p_cupom,''), '[^A-Za-z0-9]', '', 'g'));
  v_base  timestamptz;
begin
  if not public.eh_admin() then return jsonb_build_object('ok', false, 'motivo', 'nao_autorizado'); end if;
  select id, assinatura_expira_em into v_user, v_base from profiles
   where lower(email) = lower(trim(p_email)) and coalesce(tipo,'nutri') <> 'paciente' limit 1;
  if v_user is null then return jsonb_build_object('ok', false, 'motivo', 'sem_conta'); end if;
  if v_cupom !~ '^[A-Z0-9]{4,20}$' then return jsonb_build_object('ok', false, 'motivo', 'cupom_invalido'); end if;
  if exists (select 1 from embaixadoras where cupom = v_cupom and user_id <> v_user) then
    return jsonb_build_object('ok', false, 'motivo', 'cupom_em_uso');
  end if;

  insert into embaixadoras (user_id, cupom, pix_chave) values (v_user, v_cupom, nullif(trim(p_pix),''))
  on conflict (user_id) do update set cupom = excluded.cupom, pix_chave = excluded.pix_chave, ativa = true;

  if coalesce(p_meses_gratis, 0) > 0 then
    if v_base is null or v_base < now() then v_base := now(); end if;
    perform set_config('app.allow_billing', 'on', true);
    perform set_config('app.allow_curadoria', 'on', true); -- guard de plano_tier
    update profiles set assinatura_status = 'ativa',
           assinatura_expira_em = v_base + make_interval(months => p_meses_gratis),
           assinatura_provider = 'embaixadora', plano_tier = 'plataforma'
     where id = v_user;
  end if;
  return jsonb_build_object('ok', true, 'cupom', v_cupom);
end; $$;

create or replace function public.admin_embaixadora_ativa(p_id uuid, p_ativa boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.eh_admin() then return jsonb_build_object('ok', false, 'motivo', 'nao_autorizado'); end if;
  update embaixadoras set ativa = p_ativa where id = p_id;
  return jsonb_build_object('ok', true);
end; $$;

create or replace function public.admin_embaixadoras()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_ini timestamptz := public.inicio_mes_brasilia();
begin
  if not public.eh_admin() then return null; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', e.id, 'nome', p.nome, 'email', p.email, 'cupom', e.cupom, 'pix', e.pix_chave,
      'ativa', e.ativa, 'gratis_ate', p.assinatura_expira_em,
      'indicadas', (select count(*) from profiles i where i.indicada_por = e.id),
      'pagantes', (select count(distinct c.indicada_id) from comissoes c where c.embaixadora_id = e.id),
      'a_pagar', (select coalesce(sum(valor),0) from comissoes c where c.embaixadora_id = e.id and c.pago_em is null and c.criado_em < v_ini),
      'acumulando', (select coalesce(sum(valor),0) from comissoes c where c.embaixadora_id = e.id and c.pago_em is null and c.criado_em >= v_ini),
      'pago', (select coalesce(sum(valor),0) from comissoes c where c.embaixadora_id = e.id and c.pago_em is not null)
    ) order by p.nome)
    from embaixadoras e join profiles p on p.id = e.user_id), '[]'::jsonb);
end; $$;

-- "Paguei": fecha tudo que entrou ANTES deste mês para essa embaixadora.
create or replace function public.admin_comissao_paga(p_embaixadora uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_total int;
begin
  if not public.eh_admin() then return jsonb_build_object('ok', false, 'motivo', 'nao_autorizado'); end if;
  with pagas as (
    update comissoes set pago_em = now()
     where embaixadora_id = p_embaixadora and pago_em is null and criado_em < public.inicio_mes_brasilia()
    returning valor)
  select coalesce(sum(valor),0) into v_total from pagas;
  return jsonb_build_object('ok', true, 'total', v_total);
end; $$;

revoke all on function public.admin_embaixadora_salvar(text, text, text, int) from public, anon;
revoke all on function public.admin_embaixadora_ativa(uuid, boolean) from public, anon;
revoke all on function public.admin_embaixadoras() from public, anon;
revoke all on function public.admin_comissao_paga(uuid) from public, anon;
grant execute on function public.admin_embaixadora_salvar(text, text, text, int) to authenticated;
grant execute on function public.admin_embaixadora_ativa(uuid, boolean) to authenticated;
grant execute on function public.admin_embaixadoras() to authenticated;
grant execute on function public.admin_comissao_paga(uuid) to authenticated;

notify pgrst, 'reload schema';
