-- ============================================================
--  0072 — Gravação da consulta (registro, nunca o áudio)
--
--  A gravação vira texto e o áudio é descartado no mesmo request: nada de
--  voz é gravado no Supabase, nem em Storage, nem aqui. Voz de consulta é
--  dado sensível de saúde e biometria — o texto entrega tudo que a nutri
--  precisa sem o passivo de guardar a paciente falando.
--
--  Esta tabela é a PROVA de que houve consentimento antes de gravar
--  (LGPD art. 11, I; CFN 856/2026). Uma linha por sessão de gravação,
--  escrita ANTES do microfone abrir. Sem linha, a edge function
--  transcrever-consulta recusa o áudio.
-- ============================================================

create table if not exists public.consulta_gravacoes (
  id                 uuid primary key default gen_random_uuid(),
  nutri_id           uuid not null default auth.uid() references auth.users(id) on delete cascade,
  paciente_id        uuid not null references public.pacientes(id) on delete cascade,

  -- O consentimento é colhido na sala, de viva voz, e a nutri atesta aqui.
  -- 'verbal' é o caso real do consultório; 'portal' fica reservado para
  -- quando o aceite vier assinado pela própria paciente no portal dela.
  consentimento_em   timestamptz not null default now(),
  consentimento_modo text not null default 'verbal'
    check (consentimento_modo in ('verbal', 'portal')),

  iniciada_em        timestamptz not null default now(),
  encerrada_em       timestamptz,
  duracao_seg        int,

  -- Auditoria de uso/custo. `caracteres` é o tamanho da transcrição —
  -- o conteúdo dela não mora aqui: vai para a anamnese se a nutri aplicar.
  segmentos          int not null default 0,
  caracteres         int not null default 0,
  erro               text
);

create index if not exists consulta_gravacoes_nutri_idx
  on public.consulta_gravacoes (nutri_id, iniciada_em desc);
create index if not exists consulta_gravacoes_paciente_idx
  on public.consulta_gravacoes (paciente_id, iniciada_em desc);

alter table public.consulta_gravacoes enable row level security;

-- A nutri só enxerga e só mexe nas próprias gravações. O paciente_id ainda
-- precisa ser dela: senão daria para abrir uma gravação apontando para a
-- paciente de outra nutricionista.
drop policy if exists "cgrav_select_own" on public.consulta_gravacoes;
create policy "cgrav_select_own" on public.consulta_gravacoes
  for select to authenticated using (auth.uid() = nutri_id);

drop policy if exists "cgrav_insert_own" on public.consulta_gravacoes;
create policy "cgrav_insert_own" on public.consulta_gravacoes
  for insert to authenticated with check (
    auth.uid() = nutri_id
    and exists (
      select 1 from public.pacientes p
      where p.id = paciente_id and p.nutricionista_id = auth.uid()
    )
  );

drop policy if exists "cgrav_update_own" on public.consulta_gravacoes;
create policy "cgrav_update_own" on public.consulta_gravacoes
  for update to authenticated using (auth.uid() = nutri_id);

drop policy if exists "cgrav_delete_own" on public.consulta_gravacoes;
create policy "cgrav_delete_own" on public.consulta_gravacoes
  for delete to authenticated using (auth.uid() = nutri_id);

notify pgrst, 'reload schema';
