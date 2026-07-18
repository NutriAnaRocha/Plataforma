-- ============================================================
--  Plataforma Nutri — Migração 0027
--  Biblioteca de RECEITAS fit e práticas.
--
--  Receitas para anexar ao plano / sugerir ao paciente. Mesmo modelo de
--  propriedade das outras telas da Inteligência Clínica: base curada
--  (nutricionista_id null) + as da Ana. Editar uma base duplica antes.
--
--  Conteúdo AUTORAL (escrito do zero). Receita caseira comum não tem dono,
--  mas a redação é nossa.
-- ============================================================

create table if not exists public.ic_receitas (
  id            uuid primary key default gen_random_uuid(),
  nutricionista_id uuid references auth.users(id) on delete cascade,
  origem_id     uuid references public.ic_receitas(id) on delete set null,

  -- ---------- Identificação ----------
  nome          text not null,
  slug          text not null,
  sinonimos     text[] not null default '{}',
  categoria     text not null default 'refeicao'
                check (categoria in ('cafe-lanche', 'refeicao', 'doce', 'bebida')),
  tags          text[] not null default '{}',   -- "low carb", "proteica", "vegana"…

  -- ---------- Conteúdo ----------
  resumo        text,                            -- 1 linha, para o card
  porcoes       text,                            -- "2 porções", "6 unidades"
  tempo_min     int,                             -- tempo total em minutos
  kcal_porcao   int,                             -- estimativa por porção (opcional)
  ingredientes  text[] not null default '{}',    -- uma linha por ingrediente
  modo_preparo  text[] not null default '{}',    -- uma linha por passo
  dica          text,
  atencao       text,                            -- alérgeno / observação
  notas_pessoais text,

  ativo         boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists ic_receitas_slug_base_uidx
  on public.ic_receitas (slug) where nutricionista_id is null;
create unique index if not exists ic_receitas_slug_nutri_uidx
  on public.ic_receitas (nutricionista_id, slug) where nutricionista_id is not null;

create index if not exists ic_receitas_nutri_idx on public.ic_receitas (nutricionista_id);
create index if not exists ic_receitas_cat_idx   on public.ic_receitas (categoria);
create index if not exists ic_receitas_tags_idx  on public.ic_receitas using gin (tags);

alter table public.ic_receitas enable row level security;

drop policy if exists "ic_receitas_select" on public.ic_receitas;
create policy "ic_receitas_select" on public.ic_receitas
  for select using (nutricionista_id is null or auth.uid() = nutricionista_id);

drop policy if exists "ic_receitas_insert_own" on public.ic_receitas;
create policy "ic_receitas_insert_own" on public.ic_receitas
  for insert with check (auth.uid() = nutricionista_id);

drop policy if exists "ic_receitas_update_own" on public.ic_receitas;
create policy "ic_receitas_update_own" on public.ic_receitas
  for update using (auth.uid() = nutricionista_id)
  with check (auth.uid() = nutricionista_id);

drop policy if exists "ic_receitas_delete_own" on public.ic_receitas;
create policy "ic_receitas_delete_own" on public.ic_receitas
  for delete using (auth.uid() = nutricionista_id);

drop trigger if exists ic_receitas_touch on public.ic_receitas;
create trigger ic_receitas_touch before update on public.ic_receitas
  for each row execute function public.ic_touch_updated_at();

-- Ocultar uma receita base da minha lista.
create table if not exists public.ic_receitas_ocultas (
  nutricionista_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  receita_id       uuid not null references public.ic_receitas(id) on delete cascade,
  primary key (nutricionista_id, receita_id)
);

alter table public.ic_receitas_ocultas enable row level security;

drop policy if exists "ic_receitas_ocultas_all_own" on public.ic_receitas_ocultas;
create policy "ic_receitas_ocultas_all_own" on public.ic_receitas_ocultas
  for all using (auth.uid() = nutricionista_id)
  with check (auth.uid() = nutricionista_id);

-- Copy-on-write.
create or replace function public.ic_receita_duplicar(p_id uuid)
returns uuid
language plpgsql
security invoker
as $$
declare v_novo uuid; v_slug text;
begin
  select slug into v_slug from public.ic_receitas where id = p_id;
  if v_slug is null then
    raise exception 'Receita % não encontrada ou sem acesso', p_id;
  end if;

  insert into public.ic_receitas (
    nutricionista_id, origem_id, nome, slug, sinonimos, categoria, tags,
    resumo, porcoes, tempo_min, kcal_porcao, ingredientes, modo_preparo, dica, atencao
  )
  select
    auth.uid(), id, nome, slug, sinonimos, categoria, tags,
    resumo, porcoes, tempo_min, kcal_porcao, ingredientes, modo_preparo, dica, atencao
  from public.ic_receitas where id = p_id
  returning id into v_novo;

  insert into public.ic_receitas_ocultas (nutricionista_id, receita_id)
  values (auth.uid(), p_id) on conflict do nothing;

  return v_novo;
end $$;

-- Minha lista: base (menos as ocultas) + as minhas.
create or replace view public.ic_receitas_minhas as
select r.*, (r.nutricionista_id is not null) as editavel
from public.ic_receitas r
where r.ativo
  and not exists (
    select 1 from public.ic_receitas_ocultas x
    where x.receita_id = r.id and x.nutricionista_id = auth.uid()
  );

notify pgrst, 'reload schema';
