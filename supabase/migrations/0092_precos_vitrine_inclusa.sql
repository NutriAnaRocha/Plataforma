-- ============================================================
--  Plataforma Nutri — Migração 0092
--  A VITRINE DEIXA DE SER ADD-ON (14/09/2026), e os preços caem.
--
--  Pesquisa de mercado feita antes desta virada: o mercado brasileiro é
--  barbell — produto raso a R$ 28-40 (SimpleDiet 27,90 · Nutriform 29,90) e
--  consolidado a R$ 80-140 (DietSystem 79,90 com IA e WhatsApp oficial ·
--  Dietbox 91,90 · WebDiet 94,90, Black 139,90). Não havia meio ocupado.
--  A Anutri está começando, sem marca nem prova social: cobrar o preço do
--  líder era perder toda comparação. R$ 59,90 (R$ 47,90/mês no anual) entra
--  abaixo de todo consolidado e acima de todo produto raso.
--
--  O que muda no MODELO (e não só no preço):
--    gratis     → R$ 0     · SÓ divulgação. Perfil na busca, último na ordem.
--    vitrine    → R$ 29,90 · SÓ divulgação, acima do grátis. (1/10 do que a
--                            Doctoralia cobra pela mesma coisa.)
--    plataforma → R$ 59,90 · o app inteiro COM a vitrine inclusa.
--    completo   → R$ 89,90 · plataforma + envio assistido de WhatsApp.
--
--  Ou seja: 'vitrine' INVERTE de sentido. Na 0091 ela era "app + vitrine";
--  aqui vira "só vitrine". Quem já estava em 'vitrine' comprou o app e não
--  pode perdê-lo — por isso a conversão abaixo joga todo mundo para
--  'plataforma', que hoje entrega app + vitrine pelo preço MENOR.
--  'plataforma' da 0091 (app sem vitrine) também vira a nova 'plataforma':
--  ganha a vitrine de brinde e paga R$ 10 a menos. Ninguém perde nada.
--
--  Consequência na busca: acabou o filtro de quem entra na vitrine — todo
--  perfil aprovado aparece. O que o plano compra agora é POSIÇÃO, não
--  existência. O diretório precisa de densidade antes de precisar de receita.
-- ============================================================

-- ---------- 1) Conversão dos níveis ----------
-- O trigger da 0086 barra update direto em plano_tier; sobe app.allow_curadoria,
-- como a 0090 e a 0091 fazem nos backfills delas.
do $$
begin
  perform set_config('app.allow_curadoria', 'on', true);
  -- quem comprou app + vitrine continua com app + vitrine, mais barato
  update public.profiles set plano_tier = 'plataforma' where plano_tier = 'vitrine';
end $$;

-- O check da 0091 já aceita os quatro nomes; nada a alterar aqui.
-- 'vitrine' segue válido, agora com o sentido novo (só divulgação).

comment on column public.profiles.plano_tier is
  'gratis = só vitrine, sem cobrança · vitrine = só divulgação paga · '
  'plataforma = app com vitrine inclusa · completo = plataforma + WhatsApp assistido';

-- ---------- 2) Billing: os nomes antigos apontam para o lugar certo ----------
-- Links de pagamento já emitidos mandam 'essencial'/'indicada' — os dois
-- venderam o APP, então os dois caem em 'plataforma'. Se caíssem em 'vitrine'
-- a nutri perderia o prontuário depois de pagar.
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
  if p_tier in ('essencial','indicada') then p_tier := 'plataforma'; end if;
  if p_tier not in ('vitrine','plataforma','completo') then p_tier := 'plataforma'; end if;

  v_ciclo := coalesce(p_ciclo, case p_meses when 3 then 'trimestral'
                                            when 6 then 'semestral'
                                            when 12 then 'anual'
                                            else 'mensal' end);
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
         plano_tier = p_tier,
         plano_ciclo = v_ciclo
   where id = v_id;
end; $$;

-- ---------- 3) A fila do cadastro público ----------
-- O padrão da inscrição passa a ser 'plataforma' (o cartão em destaque na
-- tela). Quem escolhe a vitrine grátis manda 'gratis' explicitamente.
alter table public.nutri_cadastros alter column plano_tier set default 'plataforma';

-- A fila aceita os quatro níveis — inclusive 'gratis', que antes não existia
-- como escolha de compra e agora é a porta de entrada mais provável.
alter table public.nutri_cadastros drop constraint if exists nutri_cadastros_tier_chk;
alter table public.nutri_cadastros add constraint nutri_cadastros_tier_chk
  check (plano_tier in ('gratis','vitrine','plataforma','completo'));

notify pgrst, 'reload schema';
