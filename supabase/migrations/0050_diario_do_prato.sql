-- ============================================================
--  Plataforma Nutri — Migração 0050
--  DIÁRIO DO PRATO — a paciente fotografa o prato e a IA estima
--  calorias e macros, aponta o que está fora do combinado e o que
--  está bom. A nutri vê tudo na ficha.
--
--  QUEM ESCREVE: só a edge function 'analisar-prato' (service_role).
--  A paciente sobe a FOTO para o bucket e chama a function; a linha com
--  kcal/macros é gravada do lado do servidor. Se a paciente pudesse dar
--  insert nesta tabela, ela poderia digitar os próprios números — e a
--  nutri leria como se fossem estimativa da IA. O dado perderia o
--  sentido clínico exatamente por parecer confiável.
--
--  A paciente PODE apagar um registro (foto do próprio prato é dado
--  dela, e ela pode se arrepender de ter mandado). A nutri também.
--
--  Escopo: isto é ESTIMATIVA a partir de uma foto — não substitui
--  avaliação nutricional nem vira prescrição (Res. CFN 856/2026).
--  Quem interpreta é a nutricionista; a tela diz isso à paciente.
--  Convenção de caminho no bucket: '<paciente_id>/<uuid>.jpg'
--  (mesma das 0035/0049, para o RLS casar pela 1ª pasta).
-- ============================================================

-- ------------------------------------------------------------
-- 1) BUCKET PRIVADO 'pratos'
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('pratos', 'pratos', false)
on conflict (id) do nothing;

-- Diferente de 'evolucao' e 'refeicoes': aqui quem ENVIA é a paciente.
-- Por isso uma função própria em vez de reusar pode_gerir_foto_paciente
-- (que é só da nutri).
create or replace function public.pode_paciente_enviar_prato(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public, storage
as $$
  select exists (
    select 1 from public.pacientes p
    where p.id::text = (storage.foldername(p_name))[1]
      and p.user_id = auth.uid()
  );
$$;

drop policy if exists "pratos_read" on storage.objects;
create policy "pratos_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'pratos' and public.pode_ver_foto_paciente(name));

drop policy if exists "pratos_insert" on storage.objects;
create policy "pratos_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'pratos' and public.pode_paciente_enviar_prato(name));

-- Apagar: a dona da foto ou a nutri dela.
drop policy if exists "pratos_delete" on storage.objects;
create policy "pratos_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'pratos' and public.pode_ver_foto_paciente(name));

-- Sem UPDATE: foto de prato não se edita, se apaga e manda outra.

-- ------------------------------------------------------------
-- 2) TABELA pratos_registrados
-- ------------------------------------------------------------
create table if not exists public.pratos_registrados (
  id           uuid primary key default gen_random_uuid(),
  paciente_id  uuid not null references public.pacientes(id) on delete cascade,
  foto_path    text not null,
  refeicao     text,                     -- 'Almoço', 'Jantar'... o que a paciente marcou
  observacao   text,                     -- o que ela quis contar junto ("comi fora")

  -- Estimativa da IA. numeric e não int: 'meia banana' não é número redondo.
  kcal         numeric,
  ptn_g        numeric,
  cho_g        numeric,
  lip_g        numeric,

  itens        jsonb not null default '[]'::jsonb,  -- [{nome, porcao, kcal}]
  alertas      jsonb not null default '[]'::jsonb,  -- o que está fora do combinado
  pontos_bons  jsonb not null default '[]'::jsonb,  -- o que está bom (não é só cobrança)
  confianca    text,                                -- 'alta' | 'media' | 'baixa'
  modelo       text,                                -- rastreabilidade: qual modelo estimou
  criado_em    timestamptz not null default now()
);

create index if not exists pratos_paciente_idx
  on public.pratos_registrados (paciente_id, criado_em desc);

alter table public.pratos_registrados enable row level security;

-- A paciente lê os próprios pratos.
drop policy if exists "pratos_select_paciente" on public.pratos_registrados;
create policy "pratos_select_paciente" on public.pratos_registrados
  for select to authenticated using (
    exists (
      select 1 from public.pacientes p
       where p.id = pratos_registrados.paciente_id
         and p.user_id = auth.uid()
    )
  );

-- A nutri lê os pratos de quem é paciente dela.
drop policy if exists "pratos_select_nutri" on public.pratos_registrados;
create policy "pratos_select_nutri" on public.pratos_registrados
  for select to authenticated using (
    exists (
      select 1 from public.pacientes p
       where p.id = pratos_registrados.paciente_id
         and p.nutricionista_id = auth.uid()
    )
  );

-- Apagar: as duas pontas. (pode_ver_foto_paciente cobre exatamente esse par.)
drop policy if exists "pratos_delete_dono" on public.pratos_registrados;
create policy "pratos_delete_dono" on public.pratos_registrados
  for delete to authenticated using (
    exists (
      select 1 from public.pacientes p
       where p.id = pratos_registrados.paciente_id
         and (p.user_id = auth.uid() or p.nutricionista_id = auth.uid())
    )
  );

-- SEM policy de insert/update: quem grava é a edge function com
-- service_role, que ignora RLS. Ver o cabeçalho.

notify pgrst, 'reload schema';
