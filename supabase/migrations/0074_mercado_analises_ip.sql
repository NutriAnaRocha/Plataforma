-- ============================================================
--  Plataforma Nutri — Migração 0074
--  RotuLens: o limite do visitante passa a contar também por origem
--
--  O BURACO QUE ISTO FECHA
--    O limite de 3 leituras por dia do visitante é contado por
--    'dispositivo', que é um uuid do localStorage escrito pelo próprio
--    cliente. Trocar esse uuid é uma linha de JavaScript — e um script
--    girando uuid novo a cada chamada queima o teto global de 150
--    leituras do dia em minutos. No dia do anúncio no Instagram isso
--    significa o app morto para todo mundo, com a fatura da OpenAI
--    paga do mesmo jeito.
--
--  POR QUE HASH E NÃO O IP
--    Para contar "quantas leituras vieram desta origem hoje" não é
--    preciso saber QUAL é a origem. Guardar o IP cru seria guardar dado
--    pessoal (LGPD) de gente que nem conta tem no app, para nada. O
--    hash resolve a contagem e não volta a ser IP.
--
--    Não substitui o dispositivo: continua contando os dois. Casa de
--    família, escritório e operadora de celular (CGNAT) fazem muita
--    gente sair pelo mesmo IP — por isso o teto por origem é bem mais
--    alto que o do dispositivo, e quem PAGA nunca passa por ele.
-- ============================================================

alter table public.mercado_analises
  add column if not exists ip_hash text;

-- A pergunta é sempre "quantas leituras deste hash nas últimas 24 h",
-- nesta ordem de colunas. Sem o índice, a contagem vira o gargalo
-- justamente quando o app fica popular — que é quando ela importa.
create index if not exists mercado_analises_ip_idx
  on public.mercado_analises (ip_hash, criado_em desc)
  where ip_hash is not null;

notify pgrst, 'reload schema';
