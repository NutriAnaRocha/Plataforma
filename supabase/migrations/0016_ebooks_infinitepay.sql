-- ============================================================
--  Plataforma Nutri — Migração 0016
--  Liberação AUTOMÁTICA de e-books pagos via InfinitePay.
--  Ao confirmar o pagamento, o webhook (Edge Function
--  infinitepay-webhook) cria/acha a conta do comprador pelo e-mail
--  e insere o acesso em ebook_acessos (origem 'infinitepay').
--  A biblioteca (0010) já entrega o arquivo do bucket privado só a
--  quem tem acesso. Aqui só preparamos catálogo + registro de compras.
-- ============================================================

-- 1) Colunas opcionais que a biblioteca (biblioteca.js) já sabe usar:
--    'categoria' agrupa os cards; 'previa_url' liga o botão "Ver prévia"
--    (aponta para a página de prévia pública no site).
alter table public.ebooks add column if not exists categoria  text;
alter table public.ebooks add column if not exists previa_url text;

-- 2) Catálogo dos e-books pagos. arquivo = nome do objeto no bucket
--    PRIVADO 'ebooks'. upsert para poder reexecutar sem duplicar.
insert into public.ebooks
  (slug, titulo, subtitulo, arquivo, preco_cents, gratuito, ordem, categoria, previa_url) values
  ('guia-rotulos', 'Guia Completo de Leitura de Rótulos',
   'Decifre os rótulos e escolha melhor no supermercado.',
   'guia-rotulos.html', 790, false, 1, 'Cuidando de você no dia a dia',
   'https://nutrianarocha.github.io/site/e/rotulos.html'),
  ('guia-tentante', 'Guia Completo da Tentante',
   'Prepare seu corpo, entenda seu ciclo e potencialize a fertilidade.',
   'guia-tentante.html', 4700, false, 2, 'Saúde da mulher',
   'https://nutrianarocha.github.io/site/guia-tentante.html'),
  ('guia-canetas', 'Guia Completo das Canetas Emagrecedoras',
   'Emagreça com saúde, preserve a massa muscular e mantenha o resultado.',
   'guia-canetas.html', 2700, false, 3, 'Canetas emagrecedoras',
   'https://nutrianarocha.github.io/site/guia-canetas.html')
on conflict (slug) do update set
  titulo      = excluded.titulo,
  subtitulo   = excluded.subtitulo,
  arquivo     = excluded.arquivo,
  preco_cents = excluded.preco_cents,
  ordem       = excluded.ordem,
  categoria   = excluded.categoria,
  previa_url  = excluded.previa_url,
  ativo       = true;

-- 3) COMPRAS — registro de cada pagamento (auditoria + idempotência).
--    O webhook grava o payload cru aqui e usa transaction_nsu (único da
--    InfinitePay) para não liberar duas vezes a mesma transação.
create table if not exists public.compras (
  id              uuid primary key default gen_random_uuid(),
  transaction_nsu text unique,      -- id único da transação InfinitePay (idempotência)
  order_nsu       text,             -- identifica o produto (ex.: 'rotulos-ebook')
  invoice_slug    text,
  ebook_slug      text,             -- slug do catálogo liberado
  email           text,
  nome            text,
  telefone        text,
  valor_cents     integer,
  status          text not null default 'recebido',
                  -- recebido | confirmado | liberado | pago_sem_email | nao_confirmado | erro
  detalhe         text,
  payload         jsonb,            -- corpo cru do webhook (depurar campos reais)
  user_id         uuid references auth.users(id) on delete set null,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

create index if not exists compras_email_idx on public.compras (email);
create index if not exists compras_status_idx on public.compras (status);

alter table public.compras enable row level security;
-- Sem policy pública: só o service_role (webhook) e o admin acessam.
-- Ninguém consegue ler/gravar compras a partir do front autenticado comum.

-- 4) Helper: acha o id do usuário pelo e-mail (o webhook usa para saber se o
--    comprador já tem conta). SECURITY DEFINER porque auth.users não é exposto.
create or replace function public.user_id_por_email(p_email text)
returns uuid
language sql
security definer
set search_path = public, auth
as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;
