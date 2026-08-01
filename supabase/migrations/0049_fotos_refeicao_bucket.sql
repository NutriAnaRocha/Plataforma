-- ============================================================
--  Plataforma Nutri — Migração 0049
--  Foto da refeição no plano alimentar (bucket PRIVADO 'refeicoes').
--  A nutri fotografa o prato montado e a paciente vê a foto junto da
--  refeição no portal — pedido do vídeo de comparação com o WebDiet.
--  O jsonb do plano guarda só o caminho (pacientes.plano → refeicoes[].foto);
--  o arquivo vai para o bucket.
--  Convenção de caminho: '<paciente_id>/<foto_id>.jpg'
--  (mesma da migração 0035, para o RLS casar pela 1ª pasta).
-- ============================================================

-- 1) BUCKET PRIVADO.
insert into storage.buckets (id, name, public)
values ('refeicoes', 'refeicoes', false)
on conflict (id) do nothing;

-- 2) As regras são as MESMAS das fotos de evolução (1ª pasta = id do paciente):
--    a nutri dona gere, a paciente dona só lê. Como agora servem a dois
--    buckets, ganham nome genérico. As funções da 0035 continuam existindo
--    para não mexer nas políticas de 'evolucao'.
create or replace function public.pode_ver_foto_paciente(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public, storage
as $$
  select exists (
    select 1 from public.pacientes p
    where p.id::text = (storage.foldername(p_name))[1]
      and (p.nutricionista_id = auth.uid() or p.user_id = auth.uid())
  );
$$;

create or replace function public.pode_gerir_foto_paciente(p_name text)
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

-- 3) POLÍTICAS no storage.objects (bucket 'refeicoes').
drop policy if exists "refeicoes_read" on storage.objects;
create policy "refeicoes_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'refeicoes' and public.pode_ver_foto_paciente(name));

drop policy if exists "refeicoes_insert" on storage.objects;
create policy "refeicoes_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'refeicoes' and public.pode_gerir_foto_paciente(name));

drop policy if exists "refeicoes_update" on storage.objects;
create policy "refeicoes_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'refeicoes' and public.pode_gerir_foto_paciente(name))
  with check (bucket_id = 'refeicoes' and public.pode_gerir_foto_paciente(name));

drop policy if exists "refeicoes_delete" on storage.objects;
create policy "refeicoes_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'refeicoes' and public.pode_gerir_foto_paciente(name));
