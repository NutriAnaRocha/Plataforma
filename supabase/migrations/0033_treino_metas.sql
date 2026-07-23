-- 0033 — Treino em casa + Metas (checklist) por paciente
-- Colunas jsonb aditivas na tabela pacientes. Nullable, sem default pesado,
-- não afetam linhas existentes nem as políticas de RLS (o paciente já lê a
-- própria linha; a nutri já escreve). Os check-offs do paciente (exercício
-- feito / meta batida) reaproveitam a tabela plano_adesao.marcas com chaves
-- namespaced ("treino:*", "meta:*"), então não precisam de tabela/policy nova.

alter table public.pacientes add column if not exists treino jsonb;
alter table public.pacientes add column if not exists metas  jsonb;

comment on column public.pacientes.treino is 'Plano de treino em casa (jsonb): { titulo, publicado, atualizadoEm, blocos:[{nome, exercicios:[{nome, series, reps, descanso, video, obs}]}] }';
comment on column public.pacientes.metas  is 'Checklist de metas (jsonb): { publicado, atualizadoEm, itens:[{texto}] }. Marcação do paciente vai em plano_adesao.marcas com chave meta:<i>.';

-- Recarrega o cache de schema do PostgREST (senão a API acusa "schema cache").
notify pgrst, 'reload schema';
