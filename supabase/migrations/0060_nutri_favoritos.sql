-- ============================================================
--  Plataforma Nutri — Migração 0060
--  MEUS FAVORITOS — a estrela da nutri.
--
--  Uma tabela só para os cinco tipos: o que muda é `tipo` + `ref`.
--  `ref` é TEXTO de propósito: receita/orientação/formulação são linhas
--  do banco (uuid), mas os modelos de anamnese e de plano vivem no
--  código, com id textual ("retorno", "low-carb-1500"). Guardar os dois
--  na mesma tabela é o que permite uma tela de favoritos só.
-- ============================================================

create table if not exists public.nutri_favoritos (
  nutricionista_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tipo             text not null
                   check (tipo in ('receita', 'orientacao', 'formulacao', 'protocolo', 'anamnese', 'plano')),
  ref              text not null,
  rotulo           text,          -- nome no momento em que favoritou (para os refs do código)
  created_at       timestamptz not null default now(),
  primary key (nutricionista_id, tipo, ref)
);

create index if not exists nutri_favoritos_nutri_idx on public.nutri_favoritos (nutricionista_id, tipo);

alter table public.nutri_favoritos enable row level security;

drop policy if exists "nutri_favoritos_all_own" on public.nutri_favoritos;
create policy "nutri_favoritos_all_own" on public.nutri_favoritos
  for all using (auth.uid() = nutricionista_id)
  with check (auth.uid() = nutricionista_id);

notify pgrst, 'reload schema';
