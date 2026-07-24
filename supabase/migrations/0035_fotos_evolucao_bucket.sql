-- ============================================================
--  Plataforma Nutri — Migração 0035
--  Fotos de evolução do paciente num bucket PRIVADO.
--  Antes ficavam em base64 dentro de pacientes.antropometria (jsonb),
--  o que inchava a linha. Agora o arquivo vai para o bucket 'evolucao'
--  e o jsonb guarda só o caminho (path). O RLS do Storage garante que:
--    • a NUTRI dona do paciente gerencia (upload/ver/remover);
--    • o PACIENTE dono da ficha só VÊ as próprias fotos.
--  Convenção de caminho: '<paciente_id>/<foto_id>.jpg'
--  (a 1ª pasta é o id do paciente, usada para casar com a ficha).
-- ============================================================

-- 1) BUCKET PRIVADO.
insert into storage.buckets (id, name, public)
values ('evolucao', 'evolucao', false)
on conflict (id) do nothing;

-- 2) Quem PODE VER a foto? Nutri dona OU paciente dono da ficha.
--    Compara o id do paciente (1ª pasta do caminho) como texto — evita
--    erro de cast quando o nome não é um uuid.
create or replace function public.pode_ver_foto_evolucao(p_name text)
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

-- 3) Quem PODE GERIR (enviar/remover) a foto? Só a nutri dona do paciente.
create or replace function public.pode_gerir_foto_evolucao(p_name text)
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

-- 4) POLÍTICAS no storage.objects (bucket 'evolucao').
drop policy if exists "evolucao_read" on storage.objects;
create policy "evolucao_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'evolucao' and public.pode_ver_foto_evolucao(name));

drop policy if exists "evolucao_insert" on storage.objects;
create policy "evolucao_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'evolucao' and public.pode_gerir_foto_evolucao(name));

drop policy if exists "evolucao_update" on storage.objects;
create policy "evolucao_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'evolucao' and public.pode_gerir_foto_evolucao(name))
  with check (bucket_id = 'evolucao' and public.pode_gerir_foto_evolucao(name));

drop policy if exists "evolucao_delete" on storage.objects;
create policy "evolucao_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'evolucao' and public.pode_gerir_foto_evolucao(name));
