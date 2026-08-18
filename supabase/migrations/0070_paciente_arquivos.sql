-- ============================================================
--  Plataforma Nutri — Migração 0070
--  ARQUIVOS DO PACIENTE: PDFs, fotos e documentos anexados à ficha.
--  O binário vai para o bucket PRIVADO 'arquivos'; a linha guarda só o
--  caminho + metadados (nome original, categoria, tamanho, mime).
--  Convenção de caminho: '<paciente_id>/<uuid>.<ext>' — a 1ª pasta é o id
--  do paciente, do mesmo jeito que em 0035 (evolucao) e 0049 (refeicoes).
--
--  Quem vê o quê:
--    • a NUTRI dona do paciente gerencia tudo (enviar/renomear/apagar);
--    • o PACIENTE só vê o que ela marcou como visivel_paciente — por isso
--      a política de leitura do Storage consulta esta tabela, e não só a
--      pasta: o caminho é um uuid, mas segredo de URL não é permissão.
-- ============================================================

create table if not exists public.paciente_arquivos (
  id               uuid primary key default gen_random_uuid(),
  paciente_id      uuid not null references public.pacientes(id) on delete cascade,
  nutricionista_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome             text not null,                       -- nome original do arquivo (o que a nutri lê)
  categoria        text not null default 'outros',
  path             text not null unique,                -- caminho no bucket 'arquivos'
  mime             text,
  tamanho_bytes    bigint not null default 0,
  visivel_paciente boolean not null default false,
  observacao       text,
  created_at       timestamptz not null default now()
);

alter table public.paciente_arquivos drop constraint if exists paciente_arquivos_categoria_chk;
alter table public.paciente_arquivos add constraint paciente_arquivos_categoria_chk
  check (categoria in ('exame','laudo','prescricao','plano','contrato','foto','atestado','outros'));

create index if not exists paciente_arquivos_pac_idx
  on public.paciente_arquivos (paciente_id, created_at desc);

alter table public.paciente_arquivos enable row level security;

-- A nutri dona do paciente faz tudo.
drop policy if exists "paciente_arquivos_nutri_all" on public.paciente_arquivos;
create policy "paciente_arquivos_nutri_all" on public.paciente_arquivos
  for all to authenticated
  using (exists (
    select 1 from public.pacientes p
    where p.id = paciente_arquivos.paciente_id and p.nutricionista_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.pacientes p
    where p.id = paciente_arquivos.paciente_id and p.nutricionista_id = auth.uid()
  ));

-- O paciente dono da ficha lê o que foi liberado para ele.
drop policy if exists "paciente_arquivos_paciente_read" on public.paciente_arquivos;
create policy "paciente_arquivos_paciente_read" on public.paciente_arquivos
  for select to authenticated
  using (
    visivel_paciente
    and exists (
      select 1 from public.pacientes p
      where p.id = paciente_arquivos.paciente_id and p.user_id = auth.uid()
    )
  );

-- ---------- Storage: bucket privado 'arquivos' ----------
insert into storage.buckets (id, name, public)
values ('arquivos', 'arquivos', false)
on conflict (id) do nothing;

-- Ler: nutri dona do paciente OU paciente com o arquivo liberado.
create or replace function public.pode_ver_arquivo_paciente(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public, storage
as $$
  select exists (
    select 1 from public.pacientes p
    where p.id::text = (storage.foldername(p_name))[1]
      and p.nutricionista_id = auth.uid()
  ) or exists (
    select 1
      from public.paciente_arquivos a
      join public.pacientes p on p.id = a.paciente_id
     where a.path = p_name
       and a.visivel_paciente
       and p.user_id = auth.uid()
  );
$$;

-- Gerir (enviar/substituir/apagar): só a nutri dona do paciente.
create or replace function public.pode_gerir_arquivo_paciente(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public, storage
as $$
  select exists (
    select 1 from public.pacientes p
    where p.id::text = (storage.foldername(p_name))[1]
      and p.nutricionista_id = auth.uid()
  );
$$;

drop policy if exists "arquivos_read" on storage.objects;
create policy "arquivos_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'arquivos' and public.pode_ver_arquivo_paciente(name));

drop policy if exists "arquivos_insert" on storage.objects;
create policy "arquivos_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'arquivos' and public.pode_gerir_arquivo_paciente(name));

drop policy if exists "arquivos_update" on storage.objects;
create policy "arquivos_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'arquivos' and public.pode_gerir_arquivo_paciente(name))
  with check (bucket_id = 'arquivos' and public.pode_gerir_arquivo_paciente(name));

drop policy if exists "arquivos_delete" on storage.objects;
create policy "arquivos_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'arquivos' and public.pode_gerir_arquivo_paciente(name));

notify pgrst, 'reload schema';
