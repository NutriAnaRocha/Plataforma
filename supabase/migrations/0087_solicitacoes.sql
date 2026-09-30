-- ============================================================
--  Plataforma Nutri — Migração 0087
--  SOLICITAÇÃO DE ATENDIMENTO (o paciente pede, a nutri aceita).
--
--  É o elo que faltava entre a vitrine e a carteira: o paciente acha a nutri
--  na busca pública, manda uma solicitação com o resumo do quiz, e a nutri
--  decide. A ficha em `pacientes` só nasce no ACEITE (RPC na 0089) — quem
--  ainda não foi aceito não vira paciente de ninguém.
--
--  Por que uma tabela e não um e-mail/WhatsApp: o lead fica registrado,
--  a nutri responde de dentro da plataforma, e dá pra medir quantos pedidos
--  a vitrine gera — que é o argumento de venda do plano Indicada.
-- ============================================================

create table if not exists public.solicitacoes_atendimento (
  id               uuid primary key default gen_random_uuid(),
  -- quem pediu. A conta é criada pela edge function criar-conta-paciente
  -- antes de inserir aqui, então nunca é anônimo.
  paciente_user_id uuid not null references auth.users(id) on delete cascade,
  nutricionista_id uuid not null references public.profiles(id) on delete cascade,
  -- cópia do contato no momento do pedido: a nutri precisa ver isso mesmo
  -- antes de aceitar, e não tem acesso ao profiles do paciente.
  nome             text not null,
  email            text,
  telefone         text,
  -- respostas do quiz (objetivo, temas, modalidade, faixa de preço).
  respostas        jsonb not null default '{}'::jsonb,
  mensagem         text,
  status           text not null default 'nova',
  -- preenchido no aceite, aponta pra ficha criada.
  paciente_id      uuid references public.pacientes(id) on delete set null,
  recusa_motivo    text,
  created_at       timestamptz not null default now(),
  respondida_em    timestamptz
);

alter table public.solicitacoes_atendimento drop constraint if exists solicitacoes_status_chk;
alter table public.solicitacoes_atendimento add constraint solicitacoes_status_chk
  check (status in ('nova','aceita','recusada','expirada'));

-- Fila da nutri: as novas primeiro, mais recentes no topo.
create index if not exists solicitacoes_fila_idx
  on public.solicitacoes_atendimento (nutricionista_id, status, created_at desc);

create index if not exists solicitacoes_paciente_idx
  on public.solicitacoes_atendimento (paciente_user_id, created_at desc);

-- O mesmo paciente não enche a fila da mesma nutri: enquanto houver um pedido
-- em aberto (ou já aceito), não entra outro. Recusado/expirado libera de novo.
create unique index if not exists solicitacoes_sem_duplicata_uidx
  on public.solicitacoes_atendimento (paciente_user_id, nutricionista_id)
  where status in ('nova','aceita');

alter table public.solicitacoes_atendimento enable row level security;

-- A nutri vê e responde as suas.
drop policy if exists "solicitacoes_nutri_select" on public.solicitacoes_atendimento;
create policy "solicitacoes_nutri_select" on public.solicitacoes_atendimento
  for select using (auth.uid() = nutricionista_id);

-- O update da nutri passa pelas RPCs (0089), mas a policy existe para o caso
-- de marcar como lida/arquivar pela tela.
drop policy if exists "solicitacoes_nutri_update" on public.solicitacoes_atendimento;
create policy "solicitacoes_nutri_update" on public.solicitacoes_atendimento
  for update using (auth.uid() = nutricionista_id)
  with check (auth.uid() = nutricionista_id);

-- O paciente acompanha as dele no portal.
drop policy if exists "solicitacoes_paciente_select" on public.solicitacoes_atendimento;
create policy "solicitacoes_paciente_select" on public.solicitacoes_atendimento
  for select using (auth.uid() = paciente_user_id);

-- E pode pedir para outra nutri estando logado (a primeira vem pela função
-- de cadastro, com service_role).
drop policy if exists "solicitacoes_paciente_insert" on public.solicitacoes_atendimento;
create policy "solicitacoes_paciente_insert" on public.solicitacoes_atendimento
  for insert with check (
    auth.uid() = paciente_user_id
    and status = 'nova'
    and exists (
      select 1 from public.profiles p
       where p.id = nutricionista_id
         and p.perfil_status = 'aprovado'
         and p.aceita_novos = true
    )
  );

-- Admin acompanha o funil inteiro (quantos pedidos, quantos sem resposta).
drop policy if exists "solicitacoes_admin_all" on public.solicitacoes_atendimento;
create policy "solicitacoes_admin_all" on public.solicitacoes_atendimento
  for all using (public.sou_admin()) with check (public.sou_admin());

notify pgrst, 'reload schema';
