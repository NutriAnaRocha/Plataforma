-- Avaliação do RotuLens pela própria usuária.
--
-- Por que a tabela aceita INSERT do anon (e nada mais): o app é usado sem
-- cadastro, no corredor do mercado. Exigir login para dizer "faltou X" é
-- garantir que ninguém diga nada — e o objetivo aqui é justamente ouvir quem
-- ainda não pagou. Em troca, a tabela é cega: o anon insere e não lê nada,
-- nem o que ele mesmo escreveu.
--
-- O freio contra enxurrada é o índice único por (dispositivo, dia): um
-- aparelho manda no máximo uma avaliação por dia. Sem edge function, sem
-- captcha, e sem precisar de service_role — o que importa aqui é que a
-- Management API está fora do ar por PAT vencido e isso não pode travar a
-- entrega.

create table if not exists public.mercado_avaliacoes (
  id            uuid primary key default gen_random_uuid(),
  criado_em     timestamptz not null default now(),
  -- 1 a 5 estrelas. É o único campo obrigatório: pedir texto junto derruba
  -- a taxa de resposta, e uma nota sem comentário já diz muita coisa.
  nota          smallint not null check (nota between 1 and 5),
  -- O que ela achou / o que faltou. Limitado no banco, não só na tela.
  comentario    text check (comentario is null or length(comentario) <= 1000),
  -- Contato é OPCIONAL, e existe só para a Ana poder responder quem quer
  -- resposta. Quem não preencher continua anônima.
  contato       text check (contato is null or length(contato) <= 120),
  -- Mesmo id de aparelho que já governa o limite grátis. Não identifica
  -- pessoa: é um uuid do localStorage.
  dispositivo   text not null check (length(dispositivo) between 8 and 64),
  -- Em que tela/versão ela estava. Ajuda a ler a nota no contexto certo.
  tela          text check (tela is null or length(tela) <= 40),
  versao        text check (versao is null or length(versao) <= 20),
  -- Assinante e quem usa de graça reclamam de coisas diferentes; sem esse
  -- campo a leitura das notas mistura os dois públicos.
  assinante     boolean not null default false,
  -- Marcada pela Ana quando ela já leu/respondeu.
  tratada       boolean not null default false
);

-- Um aparelho, uma avaliação por dia.
-- O corte do dia é em UTC de propósito: `criado_em::date` sozinho depende do
-- TimeZone da sessão, é apenas STABLE, e o Postgres recusa a função num
-- índice. `timezone('UTC', ...)` é IMMUTABLE e resolve.
create unique index if not exists mercado_avaliacoes_dia_uk
  on public.mercado_avaliacoes (dispositivo, ((timezone('UTC', criado_em))::date));

create index if not exists mercado_avaliacoes_recentes
  on public.mercado_avaliacoes (criado_em desc);

alter table public.mercado_avaliacoes enable row level security;

-- Qualquer pessoa escreve...
drop policy if exists mercado_avaliacoes_insert_anon on public.mercado_avaliacoes;
create policy mercado_avaliacoes_insert_anon
  on public.mercado_avaliacoes for insert
  to anon, authenticated
  with check (
    nota between 1 and 5
    and coalesce(length(comentario), 0) <= 1000
    and coalesce(length(contato), 0) <= 120
    -- Ninguém escreve já marcado como tratado.
    and tratada = false
  );

-- ...e ninguém lê pelo anon. Quem lê é a Ana, pelo painel do Supabase ou por
-- service_role. Sem policy de select, o RLS nega por padrão.

grant insert on public.mercado_avaliacoes to anon, authenticated;
revoke select, update, delete on public.mercado_avaliacoes from anon, authenticated;

-- O PostgREST precisa reler o schema depois disto.
notify pgrst, 'reload schema';
