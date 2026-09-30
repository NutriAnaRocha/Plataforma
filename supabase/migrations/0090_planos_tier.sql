-- ============================================================
--  Plataforma Nutri — Migração 0090
--  OS TRÊS NÍVEIS: grátis, Essencial (R$49,90) e Indicada (R$69,90).
--
--  A régua de acesso passa a ter dois eixos independentes:
--    - assinatura_status/trial (0038) → dá ou tira o APP (prontuário, planos, IA);
--    - plano_tier (0086)              → define a POSIÇÃO na vitrine.
--
--  Quem não paga não perde a vitrine: o perfil aprovado continua no ar,
--  no fim da lista. É isso que faz o diretório encher e, depois, converter.
--
--  ativar_assinatura ganha p_tier. Como o parâmetro entra no meio de uma
--  função que já existe com 4 argumentos, a antiga é derrubada antes — duas
--  sobrecargas com defaults deixariam a chamada por nome ambígua no PostgREST.
-- ============================================================

drop function if exists public.ativar_assinatura(text, int, text, text);

create or replace function public.ativar_assinatura(
  p_email    text,
  p_meses    int  default 1,
  p_provider text default null,
  p_ref      text default null,
  p_tier     text default 'essencial'   -- 'essencial' | 'indicada'
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id   uuid;
  v_base timestamptz;
begin
  if p_tier not in ('essencial','indicada') then p_tier := 'essencial'; end if;

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
         plano_tier = p_tier
   where id = v_id;
end; $$;

-- Assinatura encerrada devolve a nutri ao nível grátis: ela mantém o perfil
-- na vitrine (no fim da fila) e perde o app. Nada é apagado.
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
  perform set_config('app.allow_billing',  'on', true);
  perform set_config('app.allow_curadoria','on', true);
  update public.profiles
     set assinatura_status = p_status,
         plano_tier = 'gratis'
   where lower(email) = lower(p_email);
end; $$;

-- Mudar só o nível, sem tocar na validade (correção manual da Ana, ou
-- upgrade/downgrade dentro do mesmo ciclo pago).
create or replace function public.definir_tier(p_email text, p_tier text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.sou_admin() then raise exception 'só a administração muda o plano'; end if;
  if p_tier not in ('gratis','essencial','indicada') then
    raise exception 'plano inválido: %', p_tier;
  end if;
  perform set_config('app.allow_curadoria', 'on', true);
  update public.profiles set plano_tier = p_tier where lower(email) = lower(p_email);
end; $$;

-- Quem já usa a plataforma hoje entrou como 'ativa' sem prazo (backfill 0038)
-- e não pode ser rebaixada por esta migração: vira Essencial.
-- A Ana fica em Indicada — o perfil dela é a vitrine de referência.
-- O bloco existe para levantar app.allow_curadoria: o trigger da 0086 barra
-- qualquer update direto em plano_tier, inclusive este.
do $$
begin
  perform set_config('app.allow_curadoria', 'on', true);

  update public.profiles
     set plano_tier = 'essencial'
   where coalesce(tipo,'nutri') = 'nutri'
     and assinatura_status = 'ativa'
     and plano_tier = 'gratis';

  update public.profiles
     set plano_tier = 'indicada'
   where is_admin = true;
end $$;

notify pgrst, 'reload schema';
