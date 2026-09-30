-- ============================================================
--  Plataforma Nutri — Migração 0093
--  AVALIAÇÃO DO ATENDIMENTO pelo paciente, ao fim da consulta.
--
--  Objetivo: ter um sinal de qualidade de atendimento que (a) pese na ordem
--  da vitrine e (b) devolva à nutri o que os pacientes dela acham, sem cair
--  no que o Código de Ética veda.
--
--  Por que a v1 é PRIVADA (nada de nota pública no card):
--    • A Res. CFN 856/2026 NÃO proíbe depoimento nem nota de paciente. O que
--      o Art. 69 veda é a exposição de RESULTADO — imagem, composição
--      corporal, exame, gráfico, quilos —, inclusive com autorização.
--    • Ou seja: o risco não está na nota, está no TEXTO livre. "Perdi 8kg com
--      ela" publicado no perfil é exatamente a infração. Publicar comentário
--      exige moderação antes; enquanto ela não existir, nada sai daqui para
--      página pública. `visibilidade` e `moderacao` já ficam no lugar para
--      quando essa decisão for tomada.
--    • Com um punhado de perfis publicados, nota pública também é ruído
--      estatístico. Ela serve melhor como peso de ordenação.
--
--  Anonimato para a nutri: ela NÃO lê a tabela direto (não há policy de select
--  para ela). Lê por `minhas_avaliacoes()`, que devolve nota, comentário e
--  data — nunca o paciente. Sem isso a avaliação vira constrangimento e o
--  paciente responde o que a profissional quer ouvir.
--
--  Uma avaliação por consulta, e só de consulta CONCLUÍDA: é o que impede
--  encher a média e o que amarra a nota a um atendimento que existiu.
-- ============================================================

-- ------------------------------------------------------------
-- 1) A tabela.
--    paciente_id fica ON DELETE SET NULL de propósito: apagar a ficha não
--    pode ser o caminho para apagar uma avaliação ruim. paciente_user_id é
--    quem responde pela autoria (e sobrevive à ficha).
-- ------------------------------------------------------------
create table if not exists public.avaliacoes_atendimento (
  id                uuid primary key default gen_random_uuid(),
  nutricionista_id  uuid not null references auth.users(id) on delete cascade,
  paciente_id       uuid references public.pacientes(id) on delete set null,
  paciente_user_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  consulta_id       uuid references public.consultas(id) on delete set null,
  nota              smallint not null,
  comentario        text,
  -- Reservados para quando a exibição pública for decidida (ver cabeçalho).
  visibilidade      text not null default 'privada',
  moderacao         text not null default 'pendente',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.avaliacoes_atendimento drop constraint if exists avaliacoes_nota_chk;
alter table public.avaliacoes_atendimento add constraint avaliacoes_nota_chk
  check (nota between 1 and 5);

alter table public.avaliacoes_atendimento drop constraint if exists avaliacoes_comentario_chk;
alter table public.avaliacoes_atendimento add constraint avaliacoes_comentario_chk
  check (comentario is null or char_length(comentario) <= 600);

alter table public.avaliacoes_atendimento drop constraint if exists avaliacoes_visibilidade_chk;
alter table public.avaliacoes_atendimento add constraint avaliacoes_visibilidade_chk
  check (visibilidade in ('privada','publica'));

alter table public.avaliacoes_atendimento drop constraint if exists avaliacoes_moderacao_chk;
alter table public.avaliacoes_atendimento add constraint avaliacoes_moderacao_chk
  check (moderacao in ('pendente','aprovada','rejeitada'));

-- Uma por consulta.
create unique index if not exists avaliacoes_consulta_uidx
  on public.avaliacoes_atendimento (consulta_id) where consulta_id is not null;

create index if not exists avaliacoes_nutri_idx
  on public.avaliacoes_atendimento (nutricionista_id, created_at desc);

create index if not exists avaliacoes_paciente_idx
  on public.avaliacoes_atendimento (paciente_user_id, created_at desc);

drop trigger if exists trg_avaliacoes_touch on public.avaliacoes_atendimento;
create trigger trg_avaliacoes_touch
  before update on public.avaliacoes_atendimento
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- 2) RLS: só o autor toca na própria avaliação.
--    A nutri não tem policy aqui — ela lê por minhas_avaliacoes() (item 4).
-- ------------------------------------------------------------
alter table public.avaliacoes_atendimento enable row level security;

-- O paciente escreve a sua, e só sobre consulta concluída da própria ficha.
drop policy if exists "avaliacoes_paciente_insert" on public.avaliacoes_atendimento;
create policy "avaliacoes_paciente_insert" on public.avaliacoes_atendimento
  for insert to authenticated
  with check (
    paciente_user_id = auth.uid()
    and exists (
      select 1
        from public.consultas c
        join public.pacientes p on p.id = c.paciente_id
       where c.id = avaliacoes_atendimento.consulta_id
         and c.nutricionista_id = avaliacoes_atendimento.nutricionista_id
         and p.id = avaliacoes_atendimento.paciente_id
         and p.user_id = auth.uid()
         and c.status = 'concluida'
    )
  );

-- Lê e corrige a sua (o "mudei de ideia" logo depois da consulta).
drop policy if exists "avaliacoes_paciente_select" on public.avaliacoes_atendimento;
create policy "avaliacoes_paciente_select" on public.avaliacoes_atendimento
  for select to authenticated
  using (paciente_user_id = auth.uid());

drop policy if exists "avaliacoes_paciente_update" on public.avaliacoes_atendimento;
create policy "avaliacoes_paciente_update" on public.avaliacoes_atendimento
  for update to authenticated
  using (paciente_user_id = auth.uid() and created_at > now() - interval '7 days')
  with check (paciente_user_id = auth.uid());

-- A Ana (admin) lê tudo: é ela quem vai moderar comentário antes de qualquer
-- exibição pública, e quem investiga nota anômala.
drop policy if exists "avaliacoes_admin_all" on public.avaliacoes_atendimento;
create policy "avaliacoes_admin_all" on public.avaliacoes_atendimento
  for all to authenticated
  using (public.sou_admin()) with check (public.sou_admin());

-- ------------------------------------------------------------
-- 3) Agregado em profiles + trigger de recálculo.
--    A busca é uma edge function com service_role lendo profiles; guardar
--    média e quantidade aqui evita um join/agregação por requisição.
--    São colunas DERIVADAS: ninguém escreve nelas a não ser este trigger.
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists avaliacao_media numeric(3,2),
  add column if not exists avaliacao_qtd   integer not null default 0;

-- guard_curadoria_cols (0086) não cobre estas colunas, e nem deve: elas não
-- são curadoria. Sem trava, porém, a própria nutri poderia dar um PATCH em
-- avaliacao_media e se promover dentro do tier. Fecha o buraco:
create or replace function public.guard_avaliacao_cols()
returns trigger language plpgsql as $$
begin
  if (new.avaliacao_media is distinct from old.avaliacao_media
   or new.avaliacao_qtd   is distinct from old.avaliacao_qtd)
   and coalesce(current_setting('app.allow_avaliacao', true), 'off') <> 'on' then
    raise exception 'avaliacao_media/avaliacao_qtd são derivadas das avaliações';
  end if;
  return new;
end; $$;

drop trigger if exists trg_guard_avaliacao on public.profiles;
create trigger trg_guard_avaliacao
  before update on public.profiles
  for each row execute function public.guard_avaliacao_cols();

-- O recálculo roda como definer e levanta a flag para passar pelo guard.
create or replace function public.recalcular_avaliacao_nutri()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nutri uuid := coalesce(new.nutricionista_id, old.nutricionista_id);
begin
  perform set_config('app.allow_avaliacao', 'on', true);
  update public.profiles p
     set avaliacao_media = a.media,
         avaliacao_qtd   = a.qtd
    from (
      select round(avg(nota)::numeric, 2) as media, count(*)::int as qtd
        from public.avaliacoes_atendimento
       where nutricionista_id = v_nutri
    ) a
   where p.id = v_nutri;
  return null;
end; $$;

drop trigger if exists trg_avaliacoes_recalcular on public.avaliacoes_atendimento;
create trigger trg_avaliacoes_recalcular
  after insert or update or delete on public.avaliacoes_atendimento
  for each row execute function public.recalcular_avaliacao_nutri();

-- ------------------------------------------------------------
-- 4) O que a nutri vê: nota, comentário e data — nunca o paciente.
-- ------------------------------------------------------------
create or replace function public.minhas_avaliacoes(p_limite integer default 50)
returns table (nota smallint, comentario text, data date)
language sql
security definer
stable
set search_path = public
as $$
  select a.nota, a.comentario, a.created_at::date
    from public.avaliacoes_atendimento a
   where a.nutricionista_id = auth.uid()
   order by a.created_at desc
   limit greatest(1, least(coalesce(p_limite, 50), 200));
$$;

-- Resumo para o dashboard da nutri (média, total e distribuição 1..5).
create or replace function public.minhas_avaliacoes_resumo()
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select jsonb_build_object(
    'media', round(avg(nota)::numeric, 2),
    'qtd',   count(*),
    'dist',  jsonb_build_object(
      '1', count(*) filter (where nota = 1),
      '2', count(*) filter (where nota = 2),
      '3', count(*) filter (where nota = 3),
      '4', count(*) filter (where nota = 4),
      '5', count(*) filter (where nota = 5))
  )
  from public.avaliacoes_atendimento
  where nutricionista_id = auth.uid();
$$;

-- ------------------------------------------------------------
-- 5) O que o portal do paciente pergunta: "tem consulta concluída sem
--    avaliação?". Uma chamada, sem expor a agenda inteira.
-- ------------------------------------------------------------
create or replace function public.consulta_a_avaliar()
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select jsonb_build_object(
           'consulta_id', c.id,
           'paciente_id', p.id,
           'nutricionista_id', c.nutricionista_id,
           'nutri_nome', n.nome,
           'data', c.data,
           'modo', c.modo)
    from public.consultas c
    join public.pacientes p on p.id = c.paciente_id
    left join public.profiles n on n.id = c.nutricionista_id
   where p.user_id = auth.uid()
     and c.status = 'concluida'
     and c.data >= current_date - interval '14 days'
     and not exists (select 1 from public.avaliacoes_atendimento a
                      where a.consulta_id = c.id)
   order by c.data desc, c.inicio desc
   limit 1;
$$;

notify pgrst, 'reload schema';
