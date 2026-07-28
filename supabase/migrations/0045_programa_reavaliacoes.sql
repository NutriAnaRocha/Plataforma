-- ============================================================
--  Plataforma Nutri — Migração 0045
--  "Meu Plano com a Nutri Ana": REAVALIAÇÕES periódicas e o
--  convite de RENOVAÇÃO no fim da vigência.
--
--  Por que reavaliação é obrigação, não enfeite: o que foi vendido é
--  ACOMPANHAMENTO. Sem reavaliar, o produto viraria "plano entregue uma
--  vez", que é exatamente a venda de plano pronto que o Art. 34 da
--  Res. CFN 856/2026 não admite. A cada ciclo a paciente reporta como
--  foi o período e informa medidas; a nutri ajusta o plano.
--
--  Renovação é CONVITE, nunca cobrança automática: o pagamento é único
--  por período (decisão da 0043). Aqui só guardamos que o convite foi
--  feito, para a fila da nutri parar de cobrar.
--
--  Escrita continua fechada: a paciente grava por RPC (mesma postura da
--  0044), e a nutri só consegue carimbar os dois eventos abaixo — nunca
--  mexer em vigência, que é dado de cobrança.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Colunas de acompanhamento do ciclo
-- ------------------------------------------------------------
alter table public.programa_assinaturas
  add column if not exists reavaliacoes_feitas    integer not null default 0,
  add column if not exists ultima_reavaliacao_em  timestamptz,
  -- Carimbo da nutri: "já li a reavaliação que chegou". É o que tira o
  -- item da fila do dashboard sem precisar inventar um status novo.
  add column if not exists reavaliacao_vista_em   timestamptz,
  add column if not exists renovacao_convidada_em timestamptz;

-- Fila "reavaliação aberta": assinaturas ativas com a data já vencida.
create index if not exists programa_ass_reav_idx
  on public.programa_assinaturas (proxima_reavaliacao)
  where status = 'ativa';

-- ------------------------------------------------------------
-- 2) RPC: a paciente envia a reavaliação do ciclo.
--
--    Difere da anamnese (0044) em três pontos deliberados:
--
--    a) EMPILHA em vez de substituir. A anamnese é uma foto inicial que
--       pode ser corrigida; a reavaliação é histórico clínico — apagar a
--       anterior destruiria a linha do tempo do acompanhamento.
--    b) Só abre quando proxima_reavaliacao <= hoje. É o mesmo portão que
--       o portal usa para mostrar a aba, e impede reenvio em sequência.
--    c) Reagenda o próximo ciclo; se o próximo cairia depois do fim da
--       vigência, zera (não se marca reavaliação para um período que a
--       pessoa ainda não comprou).
--
--    As medidas seguem AUTORREFERIDAS (Art. 35): a última fica em
--    antropometria.autorreferida e a série inteira em
--    antropometria.autorreferida_hist. Nada disso encosta em
--    peso_atual/altura/imc — quem promove medida a dado de prontuário é
--    a nutricionista, que responde por ele.
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

  -- Assinatura vigente com a reavaliação aberta. Sem isso não há ciclo a
  -- reavaliar — e é aqui que a dupla submissão morre.
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

  -- Reagenda o ciclo seguinte (45 dias), a não ser que já ultrapasse a vigência.
  v_proxima := v_hoje + 45;
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
-- 3) RPC: a nutri carimba um evento da assinatura.
--    Dois eventos, whitelist fechada — nada que toque em vigência,
--    plano ou valor, que são dados de cobrança e só o webhook escreve.
--      'reavaliacao_vista'   → tira "reavaliação de X chegou" da fila
--      'renovacao_convidada' → tira "convidar X para renovar" da fila
-- ------------------------------------------------------------
create or replace function public.programa_marcar_evento(
  p_assinatura_id uuid,
  p_evento        text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok boolean;
begin
  if p_evento not in ('reavaliacao_vista', 'renovacao_convidada') then
    raise exception 'evento_invalido' using errcode = '22023';
  end if;

  -- Só a dona da carteira. Sem isso, qualquer nutri carimbaria a fila alheia.
  select true into v_ok
    from public.programa_assinaturas
   where id = p_assinatura_id
     and nutricionista_id = auth.uid();

  if not found then
    raise exception 'assinatura_nao_encontrada' using errcode = '42501';
  end if;

  if p_evento = 'reavaliacao_vista' then
    update public.programa_assinaturas
       set reavaliacao_vista_em = now(), atualizado_em = now()
     where id = p_assinatura_id;
  else
    update public.programa_assinaturas
       set renovacao_convidada_em = now(), atualizado_em = now()
     where id = p_assinatura_id;
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.programa_marcar_evento(uuid, text) from public, anon;
grant execute on function public.programa_marcar_evento(uuid, text)
  to authenticated, service_role;

notify pgrst, 'reload schema';
