-- ============================================================
--  Plataforma Nutri — Migração 0078
--  RotuLens: cada leitura passa a registrar o que custou
--
--  O QUE ISTO FECHA
--    O teto de 100 leituras/mês do assinante foi CALCULADO, nunca
--    observado: a conta partiu de "~R$ 0,02 por leitura", estimada no
--    preço de tabela do gpt-4o-mini. Se o custo real for o dobro, o
--    plano de R$ 11,99 com 100 leituras é prejuízo em quem usa muito —
--    e a fatura da OpenAI não responde isso sozinha, porque na mesma
--    conta correm o diário do prato, a anamnese, as orientações e o
--    interpretador de exame. Só dá para separar medindo NA LEITURA.
--
--  POR QUE GUARDAR TOKEN E NÃO SÓ O REAL
--    Preço de modelo muda e modelo troca (OPENAI_MODEL é secret). Token
--    é o fato; o real é derivado. Guardando os dois, a série histórica
--    continua comparável depois de uma troca de preço — e o custo fica
--    congelado no que foi de fato pago naquele dia.
--
--  NÃO É DADO PESSOAL
--    São três números por linha, na mesma tabela que já guarda a
--    leitura. Nada aqui identifica ninguém e nada disso aparece no app:
--    é instrumento de medida da Ana.
-- ============================================================

alter table public.mercado_analises
  add column if not exists tokens_entrada  integer,
  add column if not exists tokens_saida    integer,
  -- numeric e não float: fração de centavo somada 3.000 vezes em float
  -- devolve um total que não fecha com a fatura.
  add column if not exists custo_usd       numeric(10,6);

comment on column public.mercado_analises.tokens_entrada is
  'prompt_tokens da OpenAI (inclui a imagem já convertida em token).';
comment on column public.mercado_analises.tokens_saida is
  'completion_tokens da OpenAI.';
comment on column public.mercado_analises.custo_usd is
  'Custo da chamada em dólar, pelo preço vigente na data da leitura.';

-- ------------------------------------------------------------
--  A visão do custo por mês — é o que a Ana abre para decidir preço.
--  security_invoker: a tabela é lida com a permissão de quem consulta,
--  não com a do dono da view. Sem isso a view furaria o RLS da
--  mercado_analises, que é o buraco corrigido na 0077.
-- ------------------------------------------------------------
create or replace view public.mercado_custo_mes
with (security_invoker = true) as
select
  date_trunc('month', criado_em)                as mes,
  count(*)                                      as leituras,
  sum(tokens_entrada)                           as tokens_entrada,
  sum(tokens_saida)                             as tokens_saida,
  round(sum(custo_usd), 4)                      as custo_usd,
  round(avg(custo_usd), 6)                      as custo_medio_usd,
  count(*) filter (where custo_usd is null)     as sem_medida
from public.mercado_analises
group by 1
order by 1 desc;

comment on view public.mercado_custo_mes is
  'RotuLens: custo real de IA por mês. sem_medida = leituras anteriores '
  'à migração 0078, que não têm token gravado.';

notify pgrst, 'reload schema';
