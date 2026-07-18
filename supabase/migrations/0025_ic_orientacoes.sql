-- ============================================================
--  Plataforma Nutri — Migração 0025
--  INTELIGÊNCIA CLÍNICA — Biblioteca de Orientações.
--
--  Orientações voltadas AO PACIENTE: textos prontos que a Ana anexa
--  ao plano/prescrição e que saem impressos. Dois tipos:
--    - categoria 'condicao'  -> orientação por condição (ansiedade, TPM…)
--    - categoria 'tecnica'   -> técnica de cozinha/dia a dia (branqueamento…)
--
--  Mesmo modelo de propriedade da Biblioteca de Exames (0019) e dos
--  Protocolos (0022): base curada (nutricionista_id null, lida por todas)
--  + conteúdo próprio. Editar uma base duplica antes (copy-on-write).
--
--  Conteúdo AUTORAL (escrito do zero), com referência citável por item —
--  a pós da NutMed é mapa de temas, não fonte de texto.
-- ============================================================

create table if not exists public.ic_orientacoes (
  id            uuid primary key default gen_random_uuid(),
  nutricionista_id uuid references auth.users(id) on delete cascade,
  origem_id     uuid references public.ic_orientacoes(id) on delete set null,

  -- ---------- Identificação ----------
  nome          text not null,                  -- "Ansiedade", "Branqueamento"
  slug          text not null,
  sinonimos     text[] not null default '{}',   -- como a paciente/ Ana busca
  categoria     text not null default 'condicao'
                check (categoria in ('condicao', 'tecnica', 'geral')),
  eixo          text,                            -- eixo do mapa da pós (opcional)
  grupo         text,                            -- subárea (opcional)

  -- ---------- Conteúdo (voltado ao paciente) ----------
  resumo        text,                            -- 1 linha, para o card
  -- Blocos da orientação. Cada item:
  --   { "titulo": "Rotina e sono", "itens": ["...", "..."] }
  blocos        jsonb not null default '[]'::jsonb,
  dica_pratica  text,                            -- destaque opcional
  -- Cada item: { "fonte": "...", "ano": 2023, "detalhe": "...", "link": "..." }
  referencias   jsonb not null default '[]'::jsonb,

  atencao       text,                            -- limites / sinais de alerta
  notas_pessoais text,

  ativo         boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists ic_orientacoes_slug_base_uidx
  on public.ic_orientacoes (slug) where nutricionista_id is null;
create unique index if not exists ic_orientacoes_slug_nutri_uidx
  on public.ic_orientacoes (nutricionista_id, slug) where nutricionista_id is not null;

create index if not exists ic_orientacoes_nutri_idx on public.ic_orientacoes (nutricionista_id);
create index if not exists ic_orientacoes_cat_idx   on public.ic_orientacoes (categoria);
create index if not exists ic_orientacoes_sinonimos_idx on public.ic_orientacoes using gin (sinonimos);

alter table public.ic_orientacoes enable row level security;

drop policy if exists "ic_orientacoes_select" on public.ic_orientacoes;
create policy "ic_orientacoes_select" on public.ic_orientacoes
  for select using (nutricionista_id is null or auth.uid() = nutricionista_id);

drop policy if exists "ic_orientacoes_insert_own" on public.ic_orientacoes;
create policy "ic_orientacoes_insert_own" on public.ic_orientacoes
  for insert with check (auth.uid() = nutricionista_id);

drop policy if exists "ic_orientacoes_update_own" on public.ic_orientacoes;
create policy "ic_orientacoes_update_own" on public.ic_orientacoes
  for update using (auth.uid() = nutricionista_id)
  with check (auth.uid() = nutricionista_id);

drop policy if exists "ic_orientacoes_delete_own" on public.ic_orientacoes;
create policy "ic_orientacoes_delete_own" on public.ic_orientacoes
  for delete using (auth.uid() = nutricionista_id);

drop trigger if exists ic_orientacoes_touch on public.ic_orientacoes;
create trigger ic_orientacoes_touch before update on public.ic_orientacoes
  for each row execute function public.ic_touch_updated_at();

-- Ocultar uma orientação base da minha lista (mesmo padrão dos protocolos).
create table if not exists public.ic_orientacoes_ocultas (
  nutricionista_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  orientacao_id    uuid not null references public.ic_orientacoes(id) on delete cascade,
  primary key (nutricionista_id, orientacao_id)
);

alter table public.ic_orientacoes_ocultas enable row level security;

drop policy if exists "ic_orient_ocultas_all_own" on public.ic_orientacoes_ocultas;
create policy "ic_orient_ocultas_all_own" on public.ic_orientacoes_ocultas
  for all using (auth.uid() = nutricionista_id)
  with check (auth.uid() = nutricionista_id);

-- Copy-on-write.
create or replace function public.ic_orientacao_duplicar(p_id uuid)
returns uuid
language plpgsql
security invoker
as $$
declare v_novo uuid; v_slug text;
begin
  select slug into v_slug from public.ic_orientacoes where id = p_id;
  if v_slug is null then
    raise exception 'Orientação % não encontrada ou sem acesso', p_id;
  end if;

  insert into public.ic_orientacoes (
    nutricionista_id, origem_id, nome, slug, sinonimos, categoria, eixo, grupo,
    resumo, blocos, dica_pratica, referencias, atencao
  )
  select
    auth.uid(), id, nome, slug, sinonimos, categoria, eixo, grupo,
    resumo, blocos, dica_pratica, referencias, atencao
  from public.ic_orientacoes where id = p_id
  returning id into v_novo;

  insert into public.ic_orientacoes_ocultas (nutricionista_id, orientacao_id)
  values (auth.uid(), p_id) on conflict do nothing;

  return v_novo;
end $$;

-- Minha lista: base (menos as ocultas) + as minhas.
create or replace view public.ic_orientacoes_minhas as
select o.*, (o.nutricionista_id is not null) as editavel
from public.ic_orientacoes o
where o.ativo
  and not exists (
    select 1 from public.ic_orientacoes_ocultas x
    where x.orientacao_id = o.id and x.nutricionista_id = auth.uid()
  );

notify pgrst, 'reload schema';
