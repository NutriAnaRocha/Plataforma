-- ============================================================
--  Plataforma Nutri — Migração 0004
--  Entitlements em 2 níveis:
--    (1) profiles.plano_nutri     = teto de features (assinatura da nutri)
--    (2) pacientes.portal_features = o que AQUELE paciente vê (subconjunto)
--  Gate de RLS de verdade só no chat; o resto é escondido no front
--  (o portal já é a própria ficha do paciente, isolada por RLS).
-- ============================================================

-- (1) Teto da assinatura da nutri. 'full' = tudo liberado (tiers comerciais
--     ainda não definidos; começar liberando tudo).
alter table public.profiles add column if not exists plano_nutri text not null default 'full';

-- (2) Features que ESTE paciente enxerga no portal. Default = as 4 seções.
alter table public.pacientes add column if not exists portal_features jsonb not null
  default '["plano","evolucao","consultas","chat"]'::jsonb;

-- Chat com gate real: o paciente só lê/escreve se 'chat' estiver na lista dele.
-- (operador ? testa se o array jsonb contém o elemento 'chat')
drop policy if exists "mensagens_paciente_all" on public.mensagens;
create policy "mensagens_paciente_all" on public.mensagens
  for all
  using (exists (select 1 from public.pacientes p
                 where p.id = paciente_id and p.user_id = auth.uid()
                   and p.portal_features ? 'chat'))
  with check (exists (select 1 from public.pacientes p
                 where p.id = paciente_id and p.user_id = auth.uid()
                   and p.portal_features ? 'chat'));
