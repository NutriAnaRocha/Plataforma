-- ============================================================
--  Plataforma Nutri — Migração 0019
--  INTELIGÊNCIA CLÍNICA — Biblioteca de Exames Laboratoriais.
--
--  Primeira fatia da base de suporte clínico. Guarda o CONHECIMENTO
--  sobre cada exame (interpretação clínica, interpretação funcional,
--  nutrientes relacionados, estratégias), não o resultado do paciente
--  — resultados continuam em pacientes.exames (0002).
--
--  Modelo de propriedade (copy-on-write):
--    nutricionista_id IS NULL  -> conteúdo BASE, curado, lido por toda
--                                 nutri autenticada. Ninguém edita direto.
--    nutricionista_id = uid    -> conteúdo DA NUTRI: criado do zero ou
--                                 duplicado de um item base para editar.
--  Assim "todo conteúdo é editável" sem que uma nutri altere a base da
--  outra — e a base pode ser aberta para assinantes no futuro sem migrar
--  dado nenhum.
--
--  A taxonomia de `eixo` vem do mapa curricular da pós (MAPA-POS-NUTMED.md).
-- ============================================================

create table if not exists public.ic_exames (
  id            uuid primary key default gen_random_uuid(),

  -- NULL = conteúdo base (curadoria). Preenchido = conteúdo próprio da nutri.
  nutricionista_id uuid references auth.users(id) on delete cascade,

  -- Se veio de uma duplicação, aponta o item base de origem.
  origem_id     uuid references public.ic_exames(id) on delete set null,

  -- ---------- Identificação ----------
  nome          text not null,                      -- "Ferritina"
  slug          text not null,                      -- "ferritina"
  sinonimos     text[] not null default '{}',       -- busca: {"ferritina sérica"}
  unidade       text,                               -- "ng/mL"

  -- Taxonomia. `eixo` = eixo clínico do mapa da pós; `grupo` = painel laboratorial.
  eixo          text not null default 'Bioquímica e exames',
  grupo         text not null,                      -- "Metabolismo do ferro"

  -- ---------- Faixas ----------
  ref_convencional text,        -- faixa do laboratório
  ref_funcional    text,        -- faixa funcional/ortomolecular (quando aplicável)

  -- ---------- Conteúdo clínico ----------
  interpretacao_clinica   text,
  interpretacao_funcional text,

  -- Cada item: { "nutriente": "Ferro", "relacao": "..." }
  nutrientes    jsonb not null default '[]'::jsonb,

  -- Sinais/sintomas associados a desvio para cima e para baixo.
  sinais_alto   text[] not null default '{}',
  sinais_baixo  text[] not null default '{}',

  -- Estratégias nutricionais por direção do desvio.
  estrategia_alto  text,
  estrategia_baixo text,

  -- Armadilhas de interpretação (ex.: ferritina como proteína de fase aguda).
  atencao       text,

  -- Cada item: { "fonte": "...", "ano": 2023, "detalhe": "...", "link": "..." }
  -- Regra do projeto: todo item da base nasce com referência citável.
  referencias   jsonb not null default '[]'::jsonb,

  -- ---------- Estado ----------
  ativo         boolean not null default true,
  -- Permite a nutri esconder um item base da lista dela sem apagá-lo.
  oculto        boolean not null default false,
  notas_pessoais text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Slug único dentro do escopo: um por base, um por nutri.
create unique index if not exists ic_exames_slug_base_uidx
  on public.ic_exames (slug) where nutricionista_id is null;
create unique index if not exists ic_exames_slug_nutri_uidx
  on public.ic_exames (nutricionista_id, slug) where nutricionista_id is not null;

create index if not exists ic_exames_nutri_idx on public.ic_exames (nutricionista_id);
create index if not exists ic_exames_grupo_idx on public.ic_exames (grupo);
create index if not exists ic_exames_eixo_idx  on public.ic_exames (eixo);

-- Busca. A tabela é pequena (dezenas a centenas de linhas), então ilike sobre
-- nome + varredura do array de sinônimos resolve sem full-text.
create index if not exists ic_exames_sinonimos_idx on public.ic_exames using gin (sinonimos);

alter table public.ic_exames enable row level security;

-- SELECT: conteúdo base (de todo mundo) + o meu.
drop policy if exists "ic_exames_select" on public.ic_exames;
create policy "ic_exames_select" on public.ic_exames
  for select using (
    nutricionista_id is null or auth.uid() = nutricionista_id
  );

-- INSERT/UPDATE/DELETE: só o meu. A base é intocável pelo app
-- (curadoria entra por migration/painel, com service_role).
drop policy if exists "ic_exames_insert_own" on public.ic_exames;
create policy "ic_exames_insert_own" on public.ic_exames
  for insert with check (auth.uid() = nutricionista_id);

drop policy if exists "ic_exames_update_own" on public.ic_exames;
create policy "ic_exames_update_own" on public.ic_exames
  for update using (auth.uid() = nutricionista_id)
  with check (auth.uid() = nutricionista_id);

drop policy if exists "ic_exames_delete_own" on public.ic_exames;
create policy "ic_exames_delete_own" on public.ic_exames
  for delete using (auth.uid() = nutricionista_id);

-- updated_at automático
create or replace function public.ic_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists ic_exames_touch on public.ic_exames;
create trigger ic_exames_touch before update on public.ic_exames
  for each row execute function public.ic_touch_updated_at();

-- ------------------------------------------------------------
--  Ocultar um item base da minha lista sem apagá-lo.
--  Cria uma linha minha, marcada oculta, apontando para a base.
-- ------------------------------------------------------------
create table if not exists public.ic_exames_ocultos (
  nutricionista_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  exame_id         uuid not null references public.ic_exames(id) on delete cascade,
  primary key (nutricionista_id, exame_id)
);

alter table public.ic_exames_ocultos enable row level security;

drop policy if exists "ic_ocultos_all_own" on public.ic_exames_ocultos;
create policy "ic_ocultos_all_own" on public.ic_exames_ocultos
  for all using (auth.uid() = nutricionista_id)
  with check (auth.uid() = nutricionista_id);

-- ------------------------------------------------------------
--  Duplicar um item base para edição (copy-on-write).
--  A cópia nasce minha, com origem_id apontando para a base,
--  e a base entra na minha lista de ocultos.
-- ------------------------------------------------------------
create or replace function public.ic_exame_duplicar(p_exame_id uuid)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_novo uuid;
  v_slug text;
begin
  select slug into v_slug from public.ic_exames where id = p_exame_id;
  if v_slug is null then
    raise exception 'Exame % não encontrado ou sem acesso', p_exame_id;
  end if;

  insert into public.ic_exames (
    nutricionista_id, origem_id, nome, slug, sinonimos, unidade, eixo, grupo,
    ref_convencional, ref_funcional, interpretacao_clinica, interpretacao_funcional,
    nutrientes, sinais_alto, sinais_baixo, estrategia_alto, estrategia_baixo,
    atencao, referencias
  )
  select
    auth.uid(), id, nome, slug, sinonimos, unidade, eixo, grupo,
    ref_convencional, ref_funcional, interpretacao_clinica, interpretacao_funcional,
    nutrientes, sinais_alto, sinais_baixo, estrategia_alto, estrategia_baixo,
    atencao, referencias
  from public.ic_exames
  where id = p_exame_id
  returning id into v_novo;

  -- Some com a versão base da minha lista; fico com a minha cópia.
  insert into public.ic_exames_ocultos (nutricionista_id, exame_id)
  values (auth.uid(), p_exame_id)
  on conflict do nothing;

  return v_novo;
end $$;

-- ------------------------------------------------------------
--  View da minha biblioteca: base (menos os que ocultei) + os meus.
-- ------------------------------------------------------------
create or replace view public.ic_exames_meus as
select e.*, (e.nutricionista_id is not null) as editavel
from public.ic_exames e
where e.ativo
  and not exists (
    select 1 from public.ic_exames_ocultos o
    where o.exame_id = e.id and o.nutricionista_id = auth.uid()
  );

notify pgrst, 'reload schema';
