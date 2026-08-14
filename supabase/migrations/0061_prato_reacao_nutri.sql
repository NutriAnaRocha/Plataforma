-- ============================================================
--  Plataforma Nutri — Migração 0061
--  DIÁRIO DO PRATO — reação da nutri (emoji) em cada foto.
--
--  Complementa o comentário da 0057. O comentário exige escrever; a
--  reação é um toque. Na prática é ela que vai ser usada no dia a dia,
--  e a paciente recebe um retorno em vez de silêncio.
--
--  Mesmas travas da 0057: a policy "pratos_update_nutri" já diz QUEM
--  pode dar update (só a nutri dona do paciente) e continua valendo.
--  Aqui só se acrescenta a coluna ao grant — o grant por coluna é o
--  que impede a nutri de reescrever kcal/itens/alertas lidos da foto.
--
--  Guarda o emoji como texto (não um enum): a lista de reações é
--  decisão de interface e vai mudar sem migração. O check limita o
--  tamanho para a coluna não virar campo de texto livre por outra via.
-- ============================================================

alter table public.pratos_registrados
  add column if not exists reacao_nutri text,
  add column if not exists reacao_em    timestamptz;

alter table public.pratos_registrados
  drop constraint if exists pratos_reacao_nutri_curta;
alter table public.pratos_registrados
  add constraint pratos_reacao_nutri_curta
  check (reacao_nutri is null or char_length(reacao_nutri) <= 8);

-- Reescreve o grant por coluna somando as duas novas.
revoke update on public.pratos_registrados from authenticated;
grant  update (comentario_nutri, comentario_em, reacao_nutri, reacao_em)
  on public.pratos_registrados to authenticated;

notify pgrst, 'reload schema';
