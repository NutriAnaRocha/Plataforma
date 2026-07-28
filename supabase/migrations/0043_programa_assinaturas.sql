-- ============================================================
--  Plataforma Nutri — Migração 0043
--  "Meu Plano com a Nutri Ana": assinaturas do programa de
--  acompanhamento por telenutrição vendido no site.
--
--  O que é vendido é ACOMPANHAMENTO (avaliação individual + plano +
--  reavaliações), não um arquivo pronto — por isso cada compra vira uma
--  ficha de paciente de verdade (public.pacientes) mais uma linha aqui,
--  que guarda a vigência e o relógio do SLA de entrega.
--
--  Cobrança é pagamento ÚNICO por período (sem recorrência): quando 'fim'
--  passa, a assinatura vence e a Ana convida para renovar. Nada é cobrado
--  automaticamente — decisão deliberada para não repetir o problema de
--  cobrança indevida que assola os concorrentes desse mercado.
--
--  Escrita: só service_role (a edge function programa-webhook). Nem a
--  paciente nem a nutri conseguem alterar vigência pela API — mesma
--  postura do billing do SaaS (migração 0038).
-- ============================================================

create table if not exists public.programa_assinaturas (
  id                  uuid primary key default gen_random_uuid(),

  -- Quem comprou (login) e a ficha clínica correspondente.
  user_id             uuid not null references auth.users(id) on delete cascade,
  paciente_id         uuid references public.pacientes(id) on delete set null,
  nutricionista_id    uuid not null references auth.users(id) on delete cascade,

  plano               text not null check (plano in ('trimestral','semestral','anual')),
  status              text not null default 'ativa'
                      check (status in ('ativa','vencida','cancelada','reembolsada')),

  inicio              date not null default current_date,
  fim                 date not null,
  proxima_reavaliacao date,

  -- Relógio do SLA: a promessa é entregar o plano em até 2 dias úteis
  -- CONTADOS DA ANAMNESE COMPLETA (não da compra) — é o que mantém a
  -- entrega dentro dos 7 dias de arrependimento do art. 49 do CDC.
  anamnese_recebida_em timestamptz,
  plano_entregue_em    timestamptz,

  valor_cents         integer,
  compra_id           uuid references public.compras(id) on delete set null,

  criado_em           timestamptz not null default now(),
  atualizado_em       timestamptz not null default now()
);

create index if not exists programa_ass_user_idx  on public.programa_assinaturas (user_id);
create index if not exists programa_ass_nutri_idx on public.programa_assinaturas (nutricionista_id, status);
create index if not exists programa_ass_fim_idx   on public.programa_assinaturas (fim);

-- Idempotência: uma compra libera no máximo uma assinatura. Se o webhook
-- do InfinitePay reenviar o mesmo pagamento, o insert falha em vez de
-- criar uma segunda ficha para a mesma pessoa.
create unique index if not exists programa_ass_compra_uidx
  on public.programa_assinaturas (compra_id) where compra_id is not null;

alter table public.programa_assinaturas enable row level security;

-- A paciente lê a PRÓPRIA assinatura (para o portal mostrar vigência).
drop policy if exists "programa_ass_select_paciente" on public.programa_assinaturas;
create policy "programa_ass_select_paciente" on public.programa_assinaturas
  for select using (auth.uid() = user_id);

-- A nutri lê as assinaturas da carteira dela (fila de trabalho no painel).
drop policy if exists "programa_ass_select_nutri" on public.programa_assinaturas;
create policy "programa_ass_select_nutri" on public.programa_assinaturas
  for select using (auth.uid() = nutricionista_id);

-- Sem policy de INSERT/UPDATE/DELETE: escrita só pelo service_role.

-- Sem trigger de atualizado_em: touch_updated_at() da 0001 mexe na coluna
-- 'updated_at', que não existe aqui. Segue o precedente de public.compras
-- (0016) — quem escreve (webhook / RPC) preenche a data na mão.

notify pgrst, 'reload schema';
