-- ============================================================
--  Plataforma Nutri — Migração 0046
--  O relógio da 1ª reavaliação passa a contar da ANAMNESE, não da compra.
--
--  Por quê: o programa-webhook agenda proxima_reavaliacao = compra + 45,
--  porque na hora do pagamento é a única data que existe. Só que o
--  acompanhamento não começa no pagamento — começa quando a paciente
--  responde a anamnese e a Ana entrega o plano. Quem demora 20 dias para
--  responder ficaria com o primeiro ciclo de 25 dias, avaliando um plano
--  que mal saiu; quem responde no mesmo dia teria 45. Contar da anamnese
--  dá o mesmo ciclo para todo mundo.
--
--  Esta migração reescreve salvar_anamnese_paciente (0044) mudando UMA
--  coisa: o update da assinatura também reancora proxima_reavaliacao —
--  e só na primeira vez (coalesce em anamnese_recebida_em já garantia
--  isso para o SLA; aqui o guard é reavaliacoes_feitas = 0, para um
--  reenvio da anamnese não empurrar um ciclo que já está correndo).
--  O resto do corpo é idêntico ao da 0044.
-- ============================================================

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
           when (current_date + 45) > fim then null
           else current_date + 45
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

notify pgrst, 'reload schema';
