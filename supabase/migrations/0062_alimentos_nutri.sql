-- ============================================================
--  Plataforma Nutri — Migração 0062
--  ALIMENTOS DA NUTRI — o que a TACO não tem.
--
--  A TACO é tabela de alimento in natura e preparação: não tem produto de
--  marca (Rap10, requeijão light), não tem o corte com o nome que a nutri
--  usa no dia a dia ("frango desfiado", "patinho moído") e não tem receita
--  da casa. Sem lugar para cadastrar, a nutri digitava o nome livre no
--  editor de plano e o item ficava com 0 kcal — o plano fechava com conta
--  errada e ninguém via.
--
--  ID NUMÉRICO A PARTIR DE 900001, de propósito: o editor indexa alimento
--  por id inteiro (window.ALIMENTOS vai de 1 a 599). Uuid aqui quebraria o
--  AL_BY_ID e os planos já salvos.
--
--  Valores SEMPRE por 100 g — o formulário aceita o rótulo por porção e
--  converte antes de gravar.
-- ============================================================

create table if not exists public.alimentos_nutri (
  id               bigint generated always as identity (start with 900001) primary key,
  nutricionista_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome             text not null,
  grupo            text not null default 'Meus alimentos',
  kcal             numeric not null default 0,
  cho              numeric not null default 0,
  ptn              numeric not null default 0,
  lip              numeric not null default 0,
  fibra            numeric not null default 0,
  -- [{"nome":"grama","g":1},{"nome":"unidade","g":40}] — "grama" sempre presente
  medidas          jsonb not null default '[{"nome":"grama","g":1}]'::jsonb,
  created_at       timestamptz not null default now()
);

create index if not exists alimentos_nutri_dono_idx on public.alimentos_nutri (nutricionista_id, nome);

alter table public.alimentos_nutri enable row level security;

drop policy if exists "alimentos_nutri_all_own" on public.alimentos_nutri;
create policy "alimentos_nutri_all_own" on public.alimentos_nutri
  for all using (auth.uid() = nutricionista_id)
  with check (auth.uid() = nutricionista_id);

notify pgrst, 'reload schema';
