-- ============================================================
--  Plataforma Nutri — Migração 0022
--  INTELIGÊNCIA CLÍNICA — Banco de Protocolos.
--
--  Segunda fatia da base. Consulta rápida por condição clínica, com os
--  campos que a Ana pediu: objetivo, estratégia, nutrientes, exames,
--  sinais/sintomas, materiais de apoio e referências.
--
--  Mesmo modelo de propriedade da Biblioteca de Exames (0019):
--    nutricionista_id IS NULL -> base curada, lida por todas
--    nutricionista_id = uid   -> conteúdo próprio (criado ou duplicado)
--  Editar um protocolo base duplica antes (ic_protocolo_duplicar).
--
--  Ligação com os exames: `exames_slugs` referencia ic_exames.slug. É o
--  que permite, no futuro, ir do resultado alterado do paciente para os
--  protocolos que tratam daquilo — e o caminho inverso.
--
--  Eixos vêm do mapa curricular da pós (MAPA-POS-NUTMED.md).
-- ============================================================

create table if not exists public.ic_protocolos (
  id            uuid primary key default gen_random_uuid(),
  nutricionista_id uuid references auth.users(id) on delete cascade,
  origem_id     uuid references public.ic_protocolos(id) on delete set null,

  -- ---------- Identificação ----------
  nome          text not null,                  -- "Resistência à insulina"
  slug          text not null,
  sinonimos     text[] not null default '{}',   -- busca por como a paciente fala
  eixo          text not null,                  -- eixo do mapa da pós
  grupo         text not null,                  -- subárea

  -- ---------- Conteúdo (campos pedidos pela Ana) ----------
  objetivo_clinico     text,
  estrategia           text,        -- estratégia nutricional, em prosa
  -- Cada item: { "nutriente": "Magnésio", "papel": "...", "dose": "..." }
  nutrientes           jsonb not null default '[]'::jsonb,
  -- Slugs de ic_exames — liga protocolo aos exames que o acompanham.
  exames_slugs         text[] not null default '{}',
  sinais_sintomas      text[] not null default '{}',
  -- Cada item: { "titulo": "...", "tipo": "orientacao|habito|ebook", "detalhe": "..." }
  materiais_apoio      jsonb not null default '[]'::jsonb,
  -- Cada item: { "fonte": "...", "ano": 2023, "detalhe": "...", "link": "..." }
  referencias          jsonb not null default '[]'::jsonb,

  -- Quando NÃO é caso de conduta nutricional isolada. Campo de segurança:
  -- todo protocolo precisa dizer onde termina o escopo do nutricionista.
  quando_encaminhar    text,
  atencao              text,
  notas_pessoais       text,

  ativo         boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists ic_protocolos_slug_base_uidx
  on public.ic_protocolos (slug) where nutricionista_id is null;
create unique index if not exists ic_protocolos_slug_nutri_uidx
  on public.ic_protocolos (nutricionista_id, slug) where nutricionista_id is not null;

create index if not exists ic_protocolos_nutri_idx on public.ic_protocolos (nutricionista_id);
create index if not exists ic_protocolos_eixo_idx  on public.ic_protocolos (eixo);
create index if not exists ic_protocolos_exames_idx on public.ic_protocolos using gin (exames_slugs);
create index if not exists ic_protocolos_sinonimos_idx on public.ic_protocolos using gin (sinonimos);

alter table public.ic_protocolos enable row level security;

drop policy if exists "ic_protocolos_select" on public.ic_protocolos;
create policy "ic_protocolos_select" on public.ic_protocolos
  for select using (nutricionista_id is null or auth.uid() = nutricionista_id);

drop policy if exists "ic_protocolos_insert_own" on public.ic_protocolos;
create policy "ic_protocolos_insert_own" on public.ic_protocolos
  for insert with check (auth.uid() = nutricionista_id);

drop policy if exists "ic_protocolos_update_own" on public.ic_protocolos;
create policy "ic_protocolos_update_own" on public.ic_protocolos
  for update using (auth.uid() = nutricionista_id)
  with check (auth.uid() = nutricionista_id);

drop policy if exists "ic_protocolos_delete_own" on public.ic_protocolos;
create policy "ic_protocolos_delete_own" on public.ic_protocolos
  for delete using (auth.uid() = nutricionista_id);

drop trigger if exists ic_protocolos_touch on public.ic_protocolos;
create trigger ic_protocolos_touch before update on public.ic_protocolos
  for each row execute function public.ic_touch_updated_at();

-- Ocultar um protocolo base da minha lista (mesmo padrão dos exames).
create table if not exists public.ic_protocolos_ocultos (
  nutricionista_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  protocolo_id     uuid not null references public.ic_protocolos(id) on delete cascade,
  primary key (nutricionista_id, protocolo_id)
);

alter table public.ic_protocolos_ocultos enable row level security;

drop policy if exists "ic_prot_ocultos_all_own" on public.ic_protocolos_ocultos;
create policy "ic_prot_ocultos_all_own" on public.ic_protocolos_ocultos
  for all using (auth.uid() = nutricionista_id)
  with check (auth.uid() = nutricionista_id);

-- Copy-on-write.
create or replace function public.ic_protocolo_duplicar(p_id uuid)
returns uuid
language plpgsql
security invoker
as $$
declare v_novo uuid; v_slug text;
begin
  select slug into v_slug from public.ic_protocolos where id = p_id;
  if v_slug is null then
    raise exception 'Protocolo % não encontrado ou sem acesso', p_id;
  end if;

  insert into public.ic_protocolos (
    nutricionista_id, origem_id, nome, slug, sinonimos, eixo, grupo,
    objetivo_clinico, estrategia, nutrientes, exames_slugs, sinais_sintomas,
    materiais_apoio, referencias, quando_encaminhar, atencao
  )
  select
    auth.uid(), id, nome, slug, sinonimos, eixo, grupo,
    objetivo_clinico, estrategia, nutrientes, exames_slugs, sinais_sintomas,
    materiais_apoio, referencias, quando_encaminhar, atencao
  from public.ic_protocolos where id = p_id
  returning id into v_novo;

  insert into public.ic_protocolos_ocultos (nutricionista_id, protocolo_id)
  values (auth.uid(), p_id) on conflict do nothing;

  return v_novo;
end $$;

-- Minha lista: base (menos os ocultos) + os meus.
create or replace view public.ic_protocolos_meus as
select p.*, (p.nutricionista_id is not null) as editavel
from public.ic_protocolos p
where p.ativo
  and not exists (
    select 1 from public.ic_protocolos_ocultos o
    where o.protocolo_id = p.id and o.nutricionista_id = auth.uid()
  );

notify pgrst, 'reload schema';
