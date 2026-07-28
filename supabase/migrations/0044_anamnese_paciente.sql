-- ============================================================
--  Plataforma Nutri — Migração 0044
--  Anamnese preenchida PELA PACIENTE no portal + registro de
--  consentimento (TCLE de telenutrição).
--
--  Por que uma RPC e não uma policy de UPDATE em pacientes:
--  a paciente precisa gravar UMA coisa (a anamnese dela) dentro de uma
--  tabela que guarda o prontuário inteiro. Uma policy de update abriria
--  a ficha toda — ela poderia reescrever peso, plano, observações
--  clínicas, adesão. A RPC abaixo é SECURITY DEFINER e toca exatamente
--  três lugares: questionarios (append/replace da instância do portal),
--  antropometria->'autorreferida' e o relógio do SLA na assinatura.
--
--  As medidas que a paciente informa NÃO viram peso_atual/altura/imc da
--  ficha. São autorreferidas, não aferidas — quem decide o que entra no
--  prontuário como dado clínico é a nutricionista, que responde por ele
--  (Art. 35 da Res. CFN 856/2026). Ficam guardadas à parte, rotuladas.
-- ============================================================

-- ------------------------------------------------------------
-- 1) CONSENTIMENTOS — trilha de aceite (TCLE de telenutrição, termos).
--    A Res. CFN 760/2023 exige TCLE informando possibilidades, limites e
--    fragilidades do atendimento a distância. Guardamos versão e data
--    para conseguir provar QUAL texto a pessoa aceitou.
-- ------------------------------------------------------------
create table if not exists public.consentimentos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  tipo       text not null,            -- 'telenutricao' | 'termos-programa' | ...
  versao     text not null,            -- ex.: '2026-07-27'
  aceito_em  timestamptz not null default now()
);

create index if not exists consentimentos_user_idx on public.consentimentos (user_id, tipo);

alter table public.consentimentos enable row level security;

-- A pessoa registra o próprio aceite...
drop policy if exists "consentimentos_insert_own" on public.consentimentos;
create policy "consentimentos_insert_own" on public.consentimentos
  for insert to authenticated with check (auth.uid() = user_id);

-- ...e consegue reler o que aceitou.
drop policy if exists "consentimentos_select_own" on public.consentimentos;
create policy "consentimentos_select_own" on public.consentimentos
  for select to authenticated using (auth.uid() = user_id);

-- A nutri enxerga o aceite de quem é paciente dela (prova documental).
drop policy if exists "consentimentos_select_nutri" on public.consentimentos;
create policy "consentimentos_select_nutri" on public.consentimentos
  for select to authenticated using (
    exists (
      select 1 from public.pacientes p
       where p.user_id = consentimentos.user_id
         and p.nutricionista_id = auth.uid()
    )
  );

-- Sem UPDATE nem DELETE para ninguém: aceite é registro imutável.

-- ------------------------------------------------------------
-- 2) RPC: a paciente grava a própria anamnese.
--    p_respostas  jsonb: [{ id, label, valor, secao }, ...] — mesmo
--                 formato que questionarios.js já lê no histórico da
--                 ficha, no modal de detalhe e no PDF.
--    p_medidas    jsonb: { peso, altura, cintura, quadril, ... } —
--                 autorreferidas, guardadas à parte.
--    p_modelo_id  text : qual modelo foi respondido.
--    p_titulo     text : rótulo exibido na ficha.
--
--    Reenviar substitui a instância anterior do portal em vez de
--    empilhar duplicatas (a paciente pode corrigir antes de a Ana montar
--    o plano). O status é forçado aqui — não vem do cliente.
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
begin
  if jsonb_typeof(p_respostas) <> 'array' or jsonb_array_length(p_respostas) = 0 then
    raise exception 'respostas_vazias' using errcode = '22023';
  end if;

  -- Só a ficha vinculada a quem está chamando. Sem auth.uid() não há ficha.
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
    'status',    'preenchido',        -- mesmo status que a nutri grava
    'origem',    'portal',            -- distingue do que a nutri preenche
    'respostas', p_respostas
  );

  -- Tira a instância anterior vinda do portal para o mesmo modelo.
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

  -- Dispara o relógio do SLA de entrega na assinatura ativa (se houver).
  update public.programa_assinaturas
     set anamnese_recebida_em = coalesce(anamnese_recebida_em, now()),
         atualizado_em = now()
   where user_id = auth.uid()
     and status = 'ativa';

  return jsonb_build_object('ok', true, 'paciente_id', v_paciente.id);
end;
$$;

-- Lockdown no mesmo padrão das migrações 0041/0042: SECURITY DEFINER
-- nasce com EXECUTE para PUBLIC, o que deixaria a função chamável com a
-- chave anon. Aqui ela depende de auth.uid(), então anon já não passaria
-- do 'ficha_nao_encontrada' — mas fechamos assim mesmo.
revoke execute on function public.salvar_anamnese_paciente(jsonb, jsonb, text, text)
  from public, anon;
grant execute on function public.salvar_anamnese_paciente(jsonb, jsonb, text, text)
  to authenticated, service_role;

notify pgrst, 'reload schema';
