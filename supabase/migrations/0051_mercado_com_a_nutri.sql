-- ============================================================
--  Plataforma Nutri — Migração 0051
--  "NO MERCADO COM A NUTRI ANA" — a pessoa fotografa o rótulo
--  (frente, tabela nutricional e lista de ingredientes) e recebe a
--  leitura do produto, a explicação dos ingredientes e, quando o
--  produto não é uma boa escolha, ALTERNATIVAS DE MARCAS REAIS.
--
--  Este é um app ABERTO: quem usa não é necessariamente paciente da
--  Ana. Por isso ele não se pendura em public.pacientes como o resto
--  da plataforma — a identidade aqui é opcional.
--
--  TRÊS DECISÕES QUE EXPLICAM O RESTO DO ARQUIVO
--
--  1) A FOTO NÃO É GUARDADA. Diferente do diário do prato (0050), aqui
--     não há bucket. A imagem vai no corpo da chamada para a edge
--     function, é enviada ao modelo e morre ali. Rótulo de produto não
--     tem valor clínico depois de lido, e um usuário anônimo não tem
--     auth.uid() para o RLS de storage casar — guardar a foto criaria um
--     bucket sem dono, que é exatamente o tipo de coisa que vaza.
--
--  2) AS MARCAS SUGERIDAS SAEM DE UMA BASE REAL, NUNCA DA MEMÓRIA DO
--     MODELO. mercado_produtos é um espelho do recorte brasileiro da
--     Open Food Facts (ver mercado/importar_off.py). Um modelo que
--     "lembra" de marcas inventa produto que não existe na prateleira —
--     num app que dá indicação de compra assinada por uma nutricionista
--     registrada, isso é risco profissional dela, não só bug.
--
--  3) REGRA DAS 3 MARCAS. A indicação de produto por nutricionista só
--     se sustenta se não favorecer marca; por isso o app nunca sugere
--     menos de três. Isso é regra de NEGÓCIO e está no código da edge
--     function, mas a base precisa ser capaz de sustentá-la — daí o
--     índice por categoria e o filtro de tabela nutricional completa
--     já na importação.
--
--  Res. CFN 856/2026: isto é orientação geral sobre leitura de rótulo,
--  não avaliação nutricional individualizada e não prescrição. A tela
--  diz isso, e o prompt proíbe diagnóstico, dieta e promessa.
-- ============================================================

-- ------------------------------------------------------------
-- 1) mercado_produtos — espelho local da Open Food Facts (Brasil)
--
--    Por que espelhar: a API de busca da OFF limita ~10 requisições por
--    minuto e devolve 503 acima disso. As edge functions da Supabase
--    saem por poucos IPs compartilhados, então duas pessoas usando o app
--    ao mesmo tempo já derrubariam a busca de alternativas. Aqui a busca
--    vira uma query local — instantânea e imune à OFF sair do ar.
-- ------------------------------------------------------------
create table if not exists public.mercado_produtos (
  code           text primary key,          -- código de barras (EAN)
  nome           text not null,
  marca          text,
  quantidade     text,
  categoria_tag  text not null,             -- tag da OFF: 'biscuits', 'yogurts'...
  categoria      text not null,             -- como a pessoa fala: 'Biscoitos e bolachas'

  nova           smallint,                  -- classificação NOVA (1 a 4)
  nutriscore     text,
  aditivos       smallint default 0,
  labels         text[] default '{}',       -- 'integral', 'sem-lactose', 'organico'...
  ingredientes   text,

  -- Tudo por 100 g/ml, que é a única base em que dá para comparar dois
  -- produtos de porções diferentes. A porção do rótulo é escolha do
  -- fabricante e serve justamente para maquiar a comparação.
  kcal           numeric,
  ptn            numeric,
  cho            numeric,
  acucar         numeric,
  fibra          numeric,
  lip            numeric,
  sat            numeric,
  sodio          numeric,                   -- em gramas, como vem da OFF

  atualizado_em  timestamptz not null default now()
);

create index if not exists mercado_produtos_cat_idx
  on public.mercado_produtos (categoria_tag);

-- Busca por nome/marca quando a categoria não resolve sozinha.
create index if not exists mercado_produtos_busca_idx
  on public.mercado_produtos using gin (
    to_tsvector('portuguese', coalesce(nome,'') || ' ' || coalesce(marca,''))
  );

alter table public.mercado_produtos enable row level security;

-- Catálogo público de produto de supermercado: qualquer um lê, inclusive
-- quem não entrou. Escrever é só do importador (service_role, ignora RLS).
drop policy if exists "mercado_produtos_leitura_publica" on public.mercado_produtos;
create policy "mercado_produtos_leitura_publica" on public.mercado_produtos
  for select to anon, authenticated using (true);

-- ------------------------------------------------------------
-- 2) mercado_analises — o que a pessoa já leu
--
--    user_id é NULO para quem usa sem entrar. 'dispositivo' é um uuid
--    que o app guarda no localStorage: serve para dois fins, mostrar o
--    histórico de quem não tem conta e CONTAR O USO DO DIA (o freio de
--    custo). Não identifica pessoa e some quando ela limpa o navegador.
-- ------------------------------------------------------------
create table if not exists public.mercado_analises (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete set null,
  dispositivo    text not null,

  produto        text,
  marca          text,
  categoria      text,
  categoria_tag  text,
  codigo_barras  text,

  -- 'boa' | 'atencao' | 'evitar'. É a leitura do rótulo, não um juízo
  -- sobre a pessoa: a tela traduz isso em orientação, nunca em culpa.
  veredito       text,
  resumo         text,

  tabela         jsonb not null default '{}'::jsonb,  -- o que a IA leu da tabela
  destaques      jsonb not null default '[]'::jsonb,  -- o que esse produto tem de bom
  alertas        jsonb not null default '[]'::jsonb,  -- o que pesa contra
  ingredientes   jsonb not null default '[]'::jsonb,  -- [{termo, explicacao}]
  alternativas   jsonb not null default '[]'::jsonb,  -- [{code, nome, marca, porque}]

  modelo         text,
  criado_em      timestamptz not null default now()
);

create index if not exists mercado_analises_user_idx
  on public.mercado_analises (user_id, criado_em desc);

-- Índice do freio de custo: a contagem "quantas análises este dispositivo
-- fez nas últimas 24 h" roda ANTES de cada chamada à OpenAI. Sem índice,
-- ela vira o gargalo justamente no momento em que o app fica popular.
create index if not exists mercado_analises_disp_idx
  on public.mercado_analises (dispositivo, criado_em desc);

alter table public.mercado_analises enable row level security;

-- Quem entrou lê o próprio histórico. Quem não entrou não lê nada por
-- aqui: o histórico dele fica no localStorage do próprio aparelho.
-- (Ler por 'dispositivo' via RLS não daria — o dispositivo é um palpite
-- do cliente, e qualquer um poderia pedir o histórico de outro.)
drop policy if exists "mercado_analises_select_dono" on public.mercado_analises;
create policy "mercado_analises_select_dono" on public.mercado_analises
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "mercado_analises_delete_dono" on public.mercado_analises;
create policy "mercado_analises_delete_dono" on public.mercado_analises
  for delete to authenticated using (user_id = auth.uid());

-- Sem policy de insert: quem grava é a edge function 'analisar-rotulo'
-- com service_role. Se o cliente pudesse inserir, ele zeraria o próprio
-- contador de uso simplesmente não gravando a análise que acabou de
-- consumir — o freio de custo é contado nesta tabela.

-- ------------------------------------------------------------
-- 3) Quem tem acesso liberado
--
--    Paciente ativa da Ana (tem ficha com user_id) e a própria nutri
--    usam sem o limite do visitante. Fica como função para a edge
--    function perguntar em uma linha, e para a regra morar em um lugar
--    só quando virar assinatura paga.
-- ------------------------------------------------------------
create or replace function public.mercado_acesso_liberado(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.pacientes p where p.user_id = p_uid)
      or exists (select 1 from public.profiles f where f.id = p_uid and f.tipo = 'nutri');
$$;

revoke all on function public.mercado_acesso_liberado(uuid) from public, anon, authenticated;

notify pgrst, 'reload schema';
