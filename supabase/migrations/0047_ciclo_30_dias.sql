-- ============================================================
--  Plataforma Nutri — Migração 0047
--  O ciclo de reavaliação passa de 45 para 30 dias.
--
--  Por quê: 45 dias faz o acompanhamento parecer entrega esporádica.
--  Quem acompanha de verdade revisa o plano todo mês — é também o que o
--  mercado pratica (benchmark 28/07: dieta ajustada a cada 30 dias,
--  reavaliação a cada 30/40). Com 30 dias a paciente tem revisão em todo
--  mês contratado, que é o que a página promete.
--
--  Além de trocar o número, esta migração conserta a ARMADILHA: os 45
--  estavam escritos em dois corpos de função (0045 e 0046), e mudar um e
--  esquecer o outro passava despercebido. Agora o número mora em
--  programa_ciclo_dias() e as duas RPCs perguntam a ela. Sobra um único
--  lugar fora do banco: reavaliacao_dias no programa-webhook — que só
--  agenda a âncora provisória da compra, reancorada pela anamnese (0046).
-- ============================================================

-- ------------------------------------------------------------
-- 1) A fonte única do número
-- ------------------------------------------------------------
create or replace function public.programa_ciclo_dias()
returns integer
language sql
immutable
set search_path = public
as $$ select 30 $$;

comment on function public.programa_ciclo_dias() is
  'Dias entre reavaliações do programa "Meu Plano". Mudar AQUI muda o ciclo inteiro; lembrar de espelhar reavaliacao_dias no programa-webhook.';

grant execute on function public.programa_ciclo_dias() to authenticated, service_role;

-- ------------------------------------------------------------
-- 2) salvar_reavaliacao_paciente — idêntica à 0045, exceto o reagendamento
-- ------------------------------------------------------------
create or replace function public.salvar_reavaliacao_paciente(
  p_respostas jsonb,
  p_medidas   jsonb default '{}'::jsonb,
  p_modelo_id text  default 'reavaliacao-programa'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paciente  public.pacientes%rowtype;
  v_ass       public.programa_assinaturas%rowtype;
  v_instancia jsonb;
  v_hist      jsonb;
  v_medidas   jsonb;
  v_n         integer;
  v_proxima   date;
  v_hoje      date := (now() at time zone 'America/Sao_Paulo')::date;
  v_hoje_txt  text := to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD');
begin
  if jsonb_typeof(p_respostas) <> 'array' or jsonb_array_length(p_respostas) = 0 then
    raise exception 'respostas_vazias' using errcode = '22023';
  end if;

  select * into v_paciente
    from public.pacientes
   where user_id = auth.uid()
   limit 1;

  if not found then
    raise exception 'ficha_nao_encontrada' using errcode = '42501';
  end if;

  select * into v_ass
    from public.programa_assinaturas
   where user_id = auth.uid()
     and status = 'ativa'
     and fim >= v_hoje
     and proxima_reavaliacao is not null
     and proxima_reavaliacao <= v_hoje
   order by fim desc
   limit 1;

  if not found then
    raise exception 'reavaliacao_nao_aberta' using errcode = '42501';
  end if;

  v_n := coalesce(v_ass.reavaliacoes_feitas, 0) + 1;

  v_instancia := jsonb_build_object(
    'id',        gen_random_uuid(),
    'tipo',      'anamnese',           -- questionarios.js só conhece este tipo
    'modeloId',  p_modelo_id,
    'titulo',    'Reavaliação ' || v_n,
    'data',      v_hoje_txt,
    'status',    'preenchido',
    'origem',    'portal',
    'ciclo',     v_n,
    'respostas', p_respostas
  );

  v_medidas := coalesce(p_medidas, '{}'::jsonb)
             || jsonb_build_object('informado_em', v_hoje_txt,
                                   'fonte', 'portal-reavaliacao',
                                   'ciclo', v_n);

  -- Série histórica: a foto anterior entra na lista antes de ser trocada.
  v_hist := coalesce(v_paciente.antropometria -> 'autorreferida_hist', '[]'::jsonb);
  if jsonb_typeof(v_hist) <> 'array' then v_hist := '[]'::jsonb; end if;
  v_hist := v_hist || jsonb_build_array(v_medidas);

  update public.pacientes
     set questionarios = coalesce(questionarios, '[]'::jsonb) || jsonb_build_array(v_instancia),
         antropometria = jsonb_set(
           jsonb_set(coalesce(antropometria, '{}'::jsonb), '{autorreferida}', v_medidas, true),
           '{autorreferida_hist}', v_hist, true
         )
   where id = v_paciente.id;

  -- Reagenda o ciclo seguinte, a não ser que já ultrapasse a vigência.
  v_proxima := v_hoje + public.programa_ciclo_dias();
  if v_proxima > v_ass.fim then v_proxima := null; end if;

  update public.programa_assinaturas
     set reavaliacoes_feitas   = v_n,
         ultima_reavaliacao_em = now(),
         reavaliacao_vista_em  = null,   -- volta para a fila da nutri
         proxima_reavaliacao   = v_proxima,
         atualizado_em         = now()
   where id = v_ass.id;

  return jsonb_build_object('ok', true, 'ciclo', v_n, 'proxima_reavaliacao', v_proxima);
end;
$$;

revoke execute on function public.salvar_reavaliacao_paciente(jsonb, jsonb, text)
  from public, anon;
grant execute on function public.salvar_reavaliacao_paciente(jsonb, jsonb, text)
  to authenticated, service_role;

-- ------------------------------------------------------------
-- 3) salvar_anamnese_paciente — idêntica à 0046, exceto a âncora do 1º ciclo
-- ------------------------------------------------------------
create or replace function public.salvar_anamnese_paciente(
  p_respostas jsonb,
  p_medidas   jsonb default '{}'::jsonb,
  p_modelo_id text  default 'anamnese-programa',
  p_titulo    text  default 'Anamnese do programa'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paciente  public.pacientes%rowtype;
  v_instancia jsonb;
  v_restantes jsonb;
  -- current_date é UTC: entre 21h e meia-noite ele já virou o dia no
  -- servidor e não aqui. A anamnese enviada às 22h de terça agendaria o
  -- ciclo como se fosse quarta, e o portal — que compara com a data do
  -- celular — mostraria a aba fechada por um dia. O relógio do programa
  -- é o de quem usa: São Paulo, igual ao de salvar_reavaliacao_paciente.
  v_hoje      date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if jsonb_typeof(p_respostas) <> 'array' or jsonb_array_length(p_respostas) = 0 then
    raise exception 'respostas_vazias' using errcode = '22023';
  end if;

  select * into v_paciente
    from public.pacientes
   where user_id = auth.uid()
   limit 1;

  if not found then
    raise exception 'ficha_nao_encontrada' using errcode = '42501';
  end if;

  v_instancia := jsonb_build_object(
    'id',        gen_random_uuid(),
    'tipo',      'anamnese',
    'modeloId',  p_modelo_id,
    'titulo',    p_titulo,
    'data',      to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD'),
    'status',    'preenchido',
    'origem',    'portal',
    'respostas', p_respostas
  );

  select coalesce(jsonb_agg(item), '[]'::jsonb) into v_restantes
    from jsonb_array_elements(v_paciente.questionarios) as item
   where not (item->>'origem' = 'portal' and item->>'modeloId' = p_modelo_id);

  update public.pacientes
     set questionarios = v_restantes || jsonb_build_array(v_instancia),
         antropometria = jsonb_set(
           coalesce(antropometria, '{}'::jsonb),
           '{autorreferida}',
           coalesce(p_medidas, '{}'::jsonb) || jsonb_build_object(
             'informado_em', to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD'),
             'fonte', 'portal-paciente'
           ),
           true
         )
   where id = v_paciente.id;

  -- Dispara o relógio do SLA de entrega e reancora o 1º ciclo de
  -- reavaliação. Nunca passa do fim da vigência: não se marca reavaliação
  -- para um período que a pessoa não comprou (mesma regra da 0045).
  update public.programa_assinaturas
     set anamnese_recebida_em = coalesce(anamnese_recebida_em, now()),
         proxima_reavaliacao  = case
           when coalesce(reavaliacoes_feitas, 0) > 0 then proxima_reavaliacao
           when (v_hoje + public.programa_ciclo_dias()) > fim then null
           else v_hoje + public.programa_ciclo_dias()
         end,
         atualizado_em = now()
   where user_id = auth.uid()
     and status = 'ativa';

  return jsonb_build_object('ok', true, 'paciente_id', v_paciente.id);
end;
$$;

revoke execute on function public.salvar_anamnese_paciente(jsonb, jsonb, text, text)
  from public, anon;
grant execute on function public.salvar_anamnese_paciente(jsonb, jsonb, text, text)
  to authenticated, service_role;

-- ------------------------------------------------------------
-- 4) Quem já está no ciclo antigo
--
--    Assinatura ativa agendada com o compasso de 45 dias fica com o
--    próximo encontro longe demais. Reancora a partir do último marco
--    real (última reavaliação, ou a anamnese, ou o início), respeitando
--    o teto da vigência e sem nunca EMPURRAR uma data que já está mais
--    perto do que o ciclo novo — antecipar é justo, adiar não.
-- ------------------------------------------------------------
update public.programa_assinaturas
   set proxima_reavaliacao = case
         when (coalesce(ultima_reavaliacao_em::date, anamnese_recebida_em::date, inicio)
               + public.programa_ciclo_dias()) > fim then null
         else (coalesce(ultima_reavaliacao_em::date, anamnese_recebida_em::date, inicio)
               + public.programa_ciclo_dias())
       end,
       atualizado_em = now()
 where status = 'ativa'
   and proxima_reavaliacao is not null
   and proxima_reavaliacao > (coalesce(ultima_reavaliacao_em::date, anamnese_recebida_em::date, inicio)
                              + public.programa_ciclo_dias());

notify pgrst, 'reload schema';
