-- ============================================================
--  Plataforma Nutri — Migração 0084
--  ORIENTAÇÕES DE SAÚDE DA MULHER (linguagem de paciente).
--
--  Fonte: apostila "Saúde da Mulher" da pós (Profa. Bianca Innocencio) e os
--  manuais FEBRASGO citados nela. Acervo PESSOAL da Ana.
--
--  Só as três que faltavam na biblioteca — TPM, SOP e menopausa já existem
--  na base curada e não são duplicadas aqui.
--  Reexecutável (upsert por (nutricionista_id, slug)).
-- ============================================================

do $$
declare v_ana uuid;
begin
  select id into v_ana from auth.users
   where lower(email) = 'nutrianalrocha@gmail.com' limit 1;
  if v_ana is null then
    raise exception 'Usuária nutrianalrocha@gmail.com não encontrada';
  end if;

  create temp table _o (
    nome text, slug text, sinonimos text[], categoria text, eixo text, grupo text,
    resumo text, blocos jsonb, dica_pratica text, referencias jsonb, atencao text
  ) on commit drop;

  insert into _o values

  ('Endometriose', 'endometriose',
   array['endometriose','dor pélvica','cólica forte','dismenorreia'],
   'condicao', 'Saúde da mulher', 'Ginecologia',
   'Como a alimentação ajuda a controlar a inflamação e a dor da endometriose.',
   '[{"titulo":"O que colocar no prato","itens":[
       "Peixes gordos (sardinha, salmão, atum) 2 a 3 vezes por semana — o ômega-3 é anti-inflamatório e ajuda na dor.",
       "Frutas, verduras e legumes todos os dias, de preferência orgânicos quando der: são a principal fonte de antioxidantes.",
       "Grãos integrais no lugar dos refinados.",
       "Tempere com gengibre, cúrcuma e alho — os três têm ação anti-inflamatória de verdade, não é só sabor.",
       "Capriche em magnésio: folhas verde-escuras, sementes, cacau e leguminosas. Ele é anti-inflamatório e relaxante natural."]},
     {"titulo":"O que reduzir","itens":[
       "Carne vermelha e embutidos (salsicha, presunto, linguiça, bacon): estão ligados a maior risco e a mais sintomas.",
       "Álcool — tem relação direta com aumento da dor.",
       "Óleos ricos em ômega-6 (soja, milho, girassol) usados em excesso; prefira azeite.",
       "Ultraprocessados em geral."]},
     {"titulo":"Atenção com fitoestrógenos","itens":[
       "Soja em cápsula, isoflavona e outros suplementos \"para hormônio feminino\" NÃO são indicados aqui sem avaliação.",
       "A endometriose depende de estrogênio para se manter, e o consumo de fitoestrógenos foi associado a aumento do risco.",
       "Se você viu essa recomendação em algum lugar, provavelmente era para menopausa — que é o oposto do seu caso. Converse comigo antes de tomar."]},
     {"titulo":"Movimento e rotina","itens":[
       "Duas horas de exercício aeróbico por semana ajudam a regular o estradiol e reduzem substâncias inflamatórias.",
       "Sono e manejo do estresse contam: dor crônica piora com noite mal dormida.",
       "Manter a vitamina D em dia faz diferença — é um dos poucos nutrientes com associação clara a menor risco."]}]'::jsonb,
   'Troque a carne vermelha do jantar por sardinha pelo menos duas vezes na semana: é a mudança única que mais mexe no seu perfil inflamatório.',
   '[{"fonte":"FEBRASGO — Manual de endometriose","ano":2021,"detalhe":"Exercício e regulação do estradiol"},
     {"fonte":"Revisão em Am J Matern Child Nurs","ano":2017,"detalhe":"Dieta, estilo de vida e inflamação crônica na endometriose"}]'::jsonb,
   'A alimentação apoia o tratamento, não substitui o acompanhamento ginecológico. Dor que impede sua rotina, sangramento muito intenso ou dor ao evacuar e urinar durante a menstruação precisam de avaliação médica.'),

  ('Candidíase de repetição', 'candidiase-repeticao',
   array['candidíase','cândida','corrimento','coceira','fungo','repetição'],
   'condicao', 'Saúde da mulher', 'Microbiota',
   'O que comer e o que evitar para reduzir as crises de candidíase.',
   '[{"titulo":"Durante a crise","itens":[
       "Corte açúcar, doces e farinha branca: a glicose é o principal alimento do fungo.",
       "Evite frutas secas e sucos concentrados — prefira a fruta fresca e inteira.",
       "Evite bebidas fermentadas (vinho, espumante, cerveja) enquanto estiver em crise.",
       "Evite conservas: azeitona, picles, cogumelos (shitake, shimeji).",
       "Segure as oleaginosas (amendoim, castanha de caju, pistache) — são as mais sujeitas a contaminação por fungo.",
       "Leite e derivados costumam ser retirados temporariamente nos casos que voltam sempre."]},
     {"titulo":"O que ajuda","itens":[
       "Alho cru, amassado e usado logo depois do preparo: é assim que se forma a alicina, o composto antifúngico.",
       "Tempere com orégano, tomilho, canela e alecrim — os óleos essenciais desses temperos atrapalham a membrana do fungo.",
       "Óleo de coco extravirgem: rico em ácido láurico e caprílico, com ação antifúngica.",
       "Fibras todos os dias — alimentação pobre em fibra favorece a disbiose, que é o pano de fundo das crises.",
       "Probióticos, quando eu indicar: os lactobacilos competem com o fungo, impedem que ele grude na parede vaginal e reduzem coceira, ardência e dor."]},
     {"titulo":"Fora do prato","itens":[
       "Roupa apertada e ambiente úmido e quente favorecem o fungo — prefira algodão e troque roupa molhada logo.",
       "Se você tem diabetes, o controle da glicemia reduz muito o risco de nova crise.",
       "Antibiótico, anti-inflamatório e laxante usados com frequência desequilibram a microbiota. Se precisar usar, me avise para reforçarmos a proteção.",
       "Estresse e noites mal dormidas derrubam a imunidade — e a imunidade é o que impede a repetição."]}]'::jsonb,
   'A restrição forte é para a fase da crise, não para sempre. Assim que o quadro cede a gente reintroduz os alimentos com calma — dieta restritiva permanente não é o objetivo.',
   '[{"fonte":"CHAITOW L. Candidíase recorrente. KN Books","ano":2014,"detalhe":""},
     {"fonte":"Ceccarani C et al. Sci Rep 9:14095","ano":2019,"detalhe":"Microbioma vaginal nas infecções genitais"}]'::jsonb,
   'O remédio antifúngico é prescrição médica. Quatro ou mais episódios por ano, corrimento com odor forte, febre ou dor pélvica: procure o ginecologista — pode não ser cândida.'),

  ('Preparando o corpo para engravidar', 'preconcepcional',
   array['fertilidade','engravidar','pré-concepcional','preconcepção','tentante'],
   'condicao', 'Saúde da mulher', 'Fertilidade',
   'O que ajustar nos 3 a 6 meses antes de tentar engravidar.',
   '[{"titulo":"Por que começar antes","itens":[
       "Alimentação equilibrada e exercício de 3 a 6 meses antes da concepção aumentam a chance de sucesso — o corpo precisa desse tempo.",
       "O objetivo é chegar na gestação com as reservas cheias, o peso estável e a inflamação baixa.",
       "Grandes variações de peso, para cima ou para baixo, desequilibram os hormônios do ciclo."]},
     {"titulo":"Se você usou anticoncepcional por muito tempo","itens":[
       "O uso prolongado reduz vitamina B12, B6, ácido fólico, zinco, selênio, fósforo e magnésio — quanto mais tempo de uso, maior a queda.",
       "Esses nutrientes são justamente os que participam da produção de hormônios e do desenvolvimento do bebê.",
       "Vamos avaliar exames e repor o que estiver baixo antes de você começar a tentar."]},
     {"titulo":"No prato","itens":[
       "Variedade acima de tudo: dieta monótona leva a carências que não aparecem em sintoma, só no exame.",
       "Folhas verde-escuras, leguminosas, ovos, peixes e sementes todos os dias.",
       "Antioxidantes (frutas coloridas, vegetais, castanhas) protegem o óvulo do estresse oxidativo.",
       "Nada de dieta restritiva por conta própria nesse período."]},
     {"titulo":"Fora do prato","itens":[
       "Café: menos de 1 xícara por dia (100 ml) se associa a maior fertilidade.",
       "Cigarro, inclusive de segunda mão: as substâncias tóxicas chegam ao líquido que envolve o óvulo, atrapalham a ovulação e antecipam a menopausa.",
       "Reduza a exposição a agrotóxicos e plásticos: lave bem os vegetais, prefira orgânicos quando der, evite esquentar comida em plástico.",
       "Álcool: reduzir já nessa fase."]},
     {"titulo":"Sinais que eu preciso saber","itens":[
       "Ciclos irregulares ou que sumiram.",
       "Intestino que vive alterado, distensão, diarreia ou muita gases — problemas intestinais atrapalham a absorção e são investigados nesses casos.",
       "Histórico de dieta muito restritiva ou transtorno alimentar.",
       "Se você já tirou o glúten por conta própria, me conte ANTES de qualquer exame: a retirada atrapalha o diagnóstico de doença celíaca."]}]'::jsonb,
   'Marque no calendário a data em que quer começar a tentar e conte 3 meses para trás — é aí que o preparo começa, não no mês da tentativa.',
   '[{"fonte":"SILVESTRIS E et al. Front Endocrinol","ano":2019,"detalhe":"Nutrição e fertilidade feminina"},
     {"fonte":"LYNGSO J et al. Clin Epidemiol","ano":2017,"detalhe":"Cafeína, fecundidade e fertilidade"},
     {"fonte":"PALMERY M et al. Eur Rev Med Pharmacol Sci","ano":2013,"detalhe":"Anticoncepcional oral e necessidades nutricionais"}]'::jsonb,
   'Nutrição prepara o terreno, mas não trata infertilidade nem garante gravidez. Depois de 12 meses tentando (ou 6 meses, se você tem mais de 35 anos), a investigação é com o médico — e o casal vai junto.');

  insert into public.ic_orientacoes
    (nutricionista_id, nome, slug, sinonimos, categoria, eixo, grupo,
     resumo, blocos, dica_pratica, referencias, atencao)
  select v_ana, nome, slug, sinonimos, categoria, eixo, grupo,
         resumo, blocos, dica_pratica, referencias, atencao
    from _o
  on conflict (nutricionista_id, slug) where nutricionista_id is not null
  do update set
    nome = excluded.nome, sinonimos = excluded.sinonimos, categoria = excluded.categoria,
    eixo = excluded.eixo, grupo = excluded.grupo, resumo = excluded.resumo,
    blocos = excluded.blocos, dica_pratica = excluded.dica_pratica,
    referencias = excluded.referencias, atencao = excluded.atencao,
    ativo = true, updated_at = now();

  raise notice 'Orientações de saúde da mulher gravadas para %', v_ana;
end $$;

notify pgrst, 'reload schema';
