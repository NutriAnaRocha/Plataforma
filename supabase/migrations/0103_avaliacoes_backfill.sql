-- ============================================================
--  Plataforma Nutri — Migração 0103
--  Leva para o HISTÓRICO a avaliação que ficou só na ficha.
--
--  Antes da 0076, cada "Salvar avaliação" gravava só em
--  pacientes.antropometria. Quem foi avaliado nessa época aparece
--  sem nenhum ponto no gráfico de evolução (nem na ficha, nem no
--  portal), embora a avaliação esteja ali. Aqui ela vira a primeira
--  linha de paciente_avaliacoes — só para quem ainda não tem NENHUMA
--  linha, então não mexe em série já existente e pode rodar de novo.
--
--  Data: o `atualizadoEm` da própria avaliação; sem ele, a data em
--  que a ficha foi atualizada pela última vez.
-- ============================================================

-- Número tolerante: aceita 72.5, "72.5" e "72,5"; o resto vira null
-- (um texto torto numa ficha antiga não pode derrubar a migração).
create or replace function pg_temp.num_seguro(v text) returns numeric
language sql immutable as $$
  select case when btrim(coalesce(v, '')) ~ '^-?[0-9]+([.,][0-9]+)?$'
              then replace(btrim(v), ',', '.')::numeric end
$$;

insert into public.paciente_avaliacoes
  (paciente_id, nutricionista_id, data, peso, altura, imc, gordura_pct, massa_gorda,
   massa_magra, cintura, quadril, abdomen, soma_dobras, observacao, dados)
select
  p.id,
  p.nutricionista_id,
  coalesce(
    case when (p.antropometria->>'atualizadoEm') ~ '^\d{4}-\d{2}-\d{2}'
         then left(p.antropometria->>'atualizadoEm', 10)::date end,
    p.updated_at::date,
    current_date),
  pg_temp.num_seguro(p.antropometria->>'peso'),
  pg_temp.num_seguro(p.antropometria->>'altura'),
  pg_temp.num_seguro(p.antropometria->>'imc'),
  coalesce(pg_temp.num_seguro(p.antropometria->>'gorduraPct'),
           pg_temp.num_seguro(p.antropometria->'raioX'->>'gorduraPct')),
  coalesce(pg_temp.num_seguro(p.antropometria->>'massaGorda'),
           pg_temp.num_seguro(p.antropometria->'raioX'->>'massaGordaKg')),
  coalesce(pg_temp.num_seguro(p.antropometria->>'massaMagra'),
           pg_temp.num_seguro(p.antropometria->'raioX'->>'massaMagraKg')),
  pg_temp.num_seguro(p.antropometria->'circunferencias'->>'cintura'),
  pg_temp.num_seguro(p.antropometria->'circunferencias'->>'quadril'),
  pg_temp.num_seguro(p.antropometria->'circunferencias'->>'abdomen'),
  pg_temp.num_seguro(p.antropometria->>'somaDobras'),
  'Avaliação registrada antes do histórico',
  p.antropometria
from public.pacientes p
where pg_temp.num_seguro(p.antropometria->>'peso') is not null
  and not exists (select 1 from public.paciente_avaliacoes a where a.paciente_id = p.id)
on conflict (paciente_id, data) do nothing;

notify pgrst, 'reload schema';
