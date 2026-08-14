-- ============================================================
--  Plataforma Nutri — Migração 0057
--  DIÁRIO DO PRATO — comentário da nutri em cada foto.
--
--  Até aqui a tabela era só-leitura para os dois lados (ver 0050): quem
--  escrevia era a edge function com service_role. O comentário quebra
--  isso de propósito, mas do jeito mais estreito possível:
--
--   - só a NUTRI do paciente pode dar update (policy abaixo);
--   - e só nas colunas do comentário (grant por coluna). Sem isso, a
--     mesma policy deixaria a nutri reescrever kcal/itens/alertas — e o
--     registro deixaria de ser "o que a IA leu da foto da paciente",
--     que é justamente o dado clínico útil.
--
--  A paciente continua sem update: ela lê o comentário e responde pelo
--  chat, não editando o registro.
-- ============================================================

alter table public.pratos_registrados
  add column if not exists comentario_nutri text,
  add column if not exists comentario_em    timestamptz;

-- Update só para a nutri dona do paciente.
drop policy if exists "pratos_update_nutri" on public.pratos_registrados;
create policy "pratos_update_nutri" on public.pratos_registrados
  for update to authenticated
  using (
    exists (
      select 1 from public.pacientes p
       where p.id = pratos_registrados.paciente_id
         and p.nutricionista_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.pacientes p
       where p.id = pratos_registrados.paciente_id
         and p.nutricionista_id = auth.uid()
    )
  );

-- A trava que importa: o grant de update é POR COLUNA. A policy diz
-- "quem", o grant diz "o quê".
revoke update on public.pratos_registrados from authenticated;
grant  update (comentario_nutri, comentario_em) on public.pratos_registrados to authenticated;

notify pgrst, 'reload schema';
