-- ============================================================
--  Plataforma Nutri — Migração 0083
--  PROTOCOLOS DE SAÚDE DA MULHER — condutas da apostila da pós.
--
--  Fonte: apostila "Saúde da Mulher" — Pós-graduação em Nutrição Clínica
--  Funcional, Ortomolecular e Fitoterapia (Profa. Bianca Innocencio),
--  complementada pelos manuais FEBRASGO citados no próprio material.
--
--  Vão para o acervo PESSOAL da Ana (nutricionista_id = uid dela), não para
--  a base curada: é material didático de terceiro. Privados pela RLS.
--
--  Seis condições: SPM/TDPM, fertilidade (pré-concepcional), SOP,
--  endometriose, candidíase vulvovaginal de repetição e climatério/menopausa.
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

  create temp table _p (
    nome text, slug text, sinonimos text[], eixo text, grupo text,
    objetivo_clinico text, estrategia text, nutrientes jsonb, exames_slugs text[],
    sinais_sintomas text[], materiais_apoio jsonb, referencias jsonb,
    quando_encaminhar text, atencao text
  ) on commit drop;

  insert into _p values

  -- ==========================================================
  --  SPM / TDPM
  -- ==========================================================
  ('Síndrome pré-menstrual (SPM) e TDPM', 'spm-tdpm',
   array['spm','tpm','tensão pré-menstrual','tdpm','disfórico','cólica','mastalgia','inchaço'],
   'Saúde da mulher', 'Ciclo menstrual',
   'Reduzir a intensidade dos sintomas físicos e emocionais da fase lútea e o impacto deles na rotina, corrigindo deficiências nutricionais que agravam o quadro.',
   'A SPM atinge 75–80% das mulheres em idade reprodutiva; 2–10% têm sintomas graves. Não existe tratamento padrão — a conduta se monta pelo SINTOMA predominante, seguindo a classificação de Hargrove e Abraham adotada pela OMS: tipo A (ansiedade), tipo C (craving/cefaleia), tipo H (hiper-hidratação/edema) e tipo D (depressão). A mesma mulher pode ter mais de um tipo.

Base da conduta: dieta com perfil menos inflamatório, refeições menores e frequentes com carboidrato integral (o carboidrato aumenta a insulina, que reduz a competição dos aminoácidos de cadeia ramificada pelo transportador e favorece a entrada de triptofano no cérebro — daí a compulsão por doce na fase lútea ser uma tentativa inconsciente de subir a serotonina). Carboidrato simples em excesso faz o contrário: pico de insulina e piora da fadiga e do humor.

Reduzir sal, alimentos condimentados, embutidos, enlatados, cafeína, fast food, refrigerante, gordura saturada e álcool. Aumentar fontes de magnésio e cálcio (folhas verde-escuras), hidratação e gorduras monoinsaturadas. Exercício físico é parte do tratamento — a literatura mostra sintomas mais intensos em sedentárias.

Pedir à paciente um diário de sintomas por pelo menos 3 ciclos: é o que fecha o raciocínio, já que não existe exame diagnóstico. O diferencial da SPM é a regressão dos sintomas depois que a menstruação começa.',
   '[{"nutriente":"Triptofano","papel":"Precursor da serotonina; dividir em 3 tomadas ao dia reduziu a ansiedade e o consumo de açúcar. Ofertar junto de carboidrato para melhorar a entrada no SNC.","dose":"50–150 mg"},
     {"nutriente":"Vitamina B6 (piridoxina)","papel":"Cofator na hidroxilação e descarboxilação do triptofano em serotonina e na síntese de dopamina. Com 50 mg de B6 + 200 mg de magnésio houve redução significativa de tensão nervosa, oscilação de humor e irritabilidade na fase lútea.","dose":"40–100 mg/dia"},
     {"nutriente":"Magnésio","papel":"Cofator na produção de serotonina e melatonina; antagonista do receptor NMDA, reduzindo cefaleia e dor menstrual; melhora edema. Mulheres com baixo consumo têm mais queixas mesmo com sérico normal.","dose":"200 mg/dia"},
     {"nutriente":"Cálcio","papel":"Há flutuação cíclica de cálcio, PTH e vitamina D ao longo do ciclo; baixo consumo se associa a irritabilidade e ansiedade.","dose":"500 mg 2x/dia — ou cálcio quelado 200 mg 2x/dia"},
     {"nutriente":"Vitamina E","papel":"Antioxidante de membrana, regula neurotransmissores centrais e modula a síntese de prostaglandinas pró-inflamatórias — foco em mastalgia e retenção hídrica.","dose":"avaliar consumo alimentar"},
     {"nutriente":"Óleo de prímula (Oenothera biennis)","papel":"10% de ácido gamalinolênico, precursor da PGE1 anti-inflamatória; mastalgia.","dose":"conforme produto"},
     {"nutriente":"Óleo de borragem (Borago officinalis)","papel":"20% de GLA — mesma via da prímula, para mastalgia.","dose":"conforme produto"},
     {"nutriente":"Vitex agnus-castus","papel":"Ação dopaminérgica, suprime prolactina; melhora mastalgia, hiperprolactinemia e dores da SPM.","dose":"100–370 mg/dia"},
     {"nutriente":"Gengibre (Zingiber officinale)","papel":"Inibe ciclo-oxigenase e lipo-oxigenase, reduzindo prostaglandinas pró-inflamatórias (cólica).","dose":"250 mg/dia"},
     {"nutriente":"Isoflavonas","papel":"Ação estrogênica; reduziu enxaqueca pré-menstrual. Avaliar caso a caso.","dose":"40 mg/dia"},
     {"nutriente":"Passiflora incarnata e Angelica sinensis","papel":"Ansiedade e insônia associadas ao período.","dose":"conforme produto"}]'::jsonb,
   array['vitamina-d','magnesio','calcio','hemoglobina','ferritina','tsh'],
   array['Irritabilidade e oscilação de humor na fase lútea','Ansiedade e tensão nervosa','Compulsão por doce','Mastalgia (dor cíclica nas mamas)','Dismenorreia','Retenção hídrica e distensão abdominal','Cefaleia pré-menstrual','Fadiga e insônia','Acne','Irregularidade intestinal'],
   '[{"titulo":"TPM","tipo":"orientacao","detalhe":"Orientação da biblioteca para entregar à paciente"},
     {"titulo":"Diário de sintomas por 3 ciclos","tipo":"habito","detalhe":"Registrar sintoma, intensidade e dia do ciclo — base do diagnóstico e da reavaliação"},
     {"titulo":"Meu ciclo","tipo":"habito","detalhe":"Módulo do portal do paciente para o auto-registro do ciclo"}]'::jsonb,
   '[{"fonte":"American College of Obstetricians and Gynecologists (ACOG)","ano":null,"detalhe":"Critério diagnóstico: 1+ sintoma somático e 1+ emocional nos 5 dias que antecedem a menstruação, por 2–3 ciclos"},
     {"fonte":"Hargrove e Abraham","ano":null,"detalhe":"Classificação da SPM em tipos A, C, H e D — adotada pela OMS"},
     {"fonte":"Apostila Saúde da Mulher — Pós em Nutrição Clínica Funcional, Ortomolecular e Fitoterapia (Profa. Bianca Innocencio)","ano":2024,"detalhe":"Abordagem nutricional para SPM"},
     {"fonte":"NAVES, Andréia. Nutrição clínica funcional: modulação hormonal","ano":2010,"detalhe":""}]'::jsonb,
   'TDPM (transtorno disfórico pré-menstrual) exige equipe multidisciplinar — médico, nutricionista, psicólogo e psiquiatra. Sintomas que incapacitam, depressão, ideação suicida ou suspeita de outro transtorno emocional: encaminhar. Sangramento muito intenso, dor que não cede a analgésico comum ou suspeita de endometriose: ginecologia.',
   'B6 em dose alta e prolongada tem risco de neuropatia periférica — não manter indefinidamente. Vitex interfere em contraceptivos hormonais e agonistas dopaminérgicos. A queixa da SPM regride com o fluxo; se não regride, o diagnóstico é outro.'),

  -- ==========================================================
  --  FERTILIDADE / PRÉ-CONCEPCIONAL
  -- ==========================================================
  ('Fertilidade e cuidado pré-concepcional', 'fertilidade-preconcepcional',
   array['fertilidade','infertilidade','engravidar','pré-concepcional','preconcepção','reserva ovariana','amh'],
   'Saúde da mulher', 'Fertilidade',
   'Preparar o terreno nutricional nos 3 a 6 meses que antecedem a concepção: corrigir carências subclínicas, reduzir estresse oxidativo e exposição a disruptores, e ajustar peso e composição corporal.',
   'Evidências mostram que padrão alimentar saudável e exercício regular 3–6 meses antes da concepção aumentam a chance de sucesso na fecundação e na gestação — por melhora da saúde global, restauro do peso, redução da inflamação crônica e melhor funcionamento hormonal.

Cinco pontos a rastrear na anamnese de toda mulher em idade reprodutiva:

1. Baixa ingestão de nutrientes levando a carência subclínica — trabalhar a introdução de novos alimentos e ampliar o valor nutricional da dieta.
2. Uso prolongado de anticoncepcional oral — reduz, de forma proporcional ao tempo de uso, as concentrações séricas de B12, B6, B9, zinco, selênio, fósforo e magnésio. São cofatores de vias metabólicas, neurotransmissores e produção hormonal.
3. Alta exposição a xenobióticos (herbicidas, fungicidas, inseticidas, cádmio, chumbo, mercúrio, PBBs, PCBs, ftalatos) — dar suporte à detoxificação, incentivar alimentação limpa, reduzir industrializados com aditivos e preferir orgânicos quando possível. Fitoestrógenos naturais (soja/isoflavona, linhaça/lignana) são metabólitos secundários, mais facilmente excretados que os sintéticos.
4. Exclusão de alimentos por modismo, transtorno alimentar ou alergia — dietas restritivas sem acompanhamento levam a deficiência de complexo B (folato, B6, B12), CoQ10, zinco, ferro e vitamina D. Grandes variações de peso desequilibram o eixo hipotálamo-hipófise-gonadal.
5. Questões gástricas e intestinais — doença celíaca, parasitoses, doenças inflamatórias intestinais. A doença celíaca aparece em 4–8% dos casos de infertilidade inexplicada; bebês de mães celíacas não tratadas podem ter restrição de crescimento intra-uterino e parto prematuro. Conduta: dieta isenta de glúten, tratar intestino (probiótico e glutamina) e repor nutrientes.

Estilo de vida: consumo de cafeína inferior a 1 xícara de café por dia (100 ml) se associa a maior fertilidade. Cigarro (ativo ou passivo) deposita cádmio e nicotina no fluido folicular, gerando estresse oxidativo intrafolicular, comprometendo a ovulação e antecipando a menopausa.

Estresse oxidativo é apontado como uma das principais causas do aumento da infertilidade: age direto no oócito, no embrião e na implantação, por peroxidação lipídica de membrana, oxidação proteica e dano ao DNA. O excesso de EROs no folículo sobrecarrega a defesa antioxidante do fluido folicular e prejudica a receptividade endometrial.',
   '[{"nutriente":"Folato (B9, metilfolato)","papel":"Fechamento do tubo neural e metilação; primeiro nutriente a garantir antes da concepção, sobretudo após uso prolongado de anticoncepcional.","dose":"conforme protocolo pré-concepcional"},
     {"nutriente":"Vitamina B12 (metilcobalamina)","papel":"Metilação e homocisteína; depleção clássica do anticoncepcional oral e de dietas restritivas.","dose":"avaliar sérico e homocisteína"},
     {"nutriente":"Vitamina B6","papel":"Cofator do metabolismo hormonal e de neurotransmissores; também depletada pelo anticoncepcional.","dose":"individualizar"},
     {"nutriente":"Zinco","papel":"Esteroidogênese, divisão celular e qualidade oocitária; depletado pelo anticoncepcional.","dose":"individualizar"},
     {"nutriente":"Selênio","papel":"Antioxidante do fluido folicular (glutationa peroxidase).","dose":"individualizar"},
     {"nutriente":"Coenzima Q10","papel":"Bioenergética mitocondrial do oócito — relevante em dietas restritivas e idade materna avançada.","dose":"individualizar"},
     {"nutriente":"Ômega-3","papel":"Perfil anti-inflamatório; suplementar sobretudo na presença de doença celíaca ou dieta pobre em peixe.","dose":"individualizar"},
     {"nutriente":"Antioxidantes (vitaminas A, C, E, selênio, zinco)","papel":"Neutralizam o estresse oxidativo intrafolicular e protegem oócito, embrião e endométrio.","dose":"priorizar via alimentar; suplementar o que faltar"},
     {"nutriente":"Ferro","papel":"Reserva antes da gestação; avaliar ferritina, não só hemoglobina.","dose":"conforme ferritina"},
     {"nutriente":"Vitamina D","papel":"Função ovariana, sensibilidade à insulina e implantação.","dose":"conforme sérico"},
     {"nutriente":"Glutamina e probióticos","papel":"Reparo de mucosa e microbiota — via de nutrição celular quando há doença intestinal associada.","dose":"individualizar"}]'::jsonb,
   array['vitamina-b12','folato','homocisteina','ferritina','hemoglobina','vitamina-d','zinco','selenio','tsh','glicemia-jejum','insulina-jejum','homa-ir'],
   array['Dificuldade para engravidar há 12 meses ou mais','Ciclos irregulares ou anovulatórios','Uso prolongado de anticoncepcional oral','Histórico de dietas restritivas ou transtorno alimentar','Grandes variações de peso','Sintomas gastrointestinais crônicos','Exposição ocupacional ou ambiental a agrotóxicos e plásticos','Tabagismo ativo ou passivo','Consumo alto de cafeína'],
   '[{"titulo":"Rastreio de doença celíaca","tipo":"habito","detalhe":"Infertilidade inexplicada com sintomas digestivos: alinhar investigação com o médico antes de retirar o glúten"},
     {"titulo":"Alimentação limpa e redução de disruptores","tipo":"orientacao","detalhe":"Higienização de vegetais, menos industrializados, preferência por orgânicos quando viável"},
     {"titulo":"Janela de 3 a 6 meses","tipo":"habito","detalhe":"Combinar com a paciente o tempo de preparo antes de tentar engravidar"}]'::jsonb,
   '[{"fonte":"SILVESTRIS E et al. Nutrition and Female Fertility: An Interdependent Correlation. Front Endocrinol","ano":2019,"detalhe":""},
     {"fonte":"PANTH N, Gavarkovs A, Tamez M, Mattei J. The Influence of Diet on Fertility. Front Public Health 6:211","ano":2018,"detalhe":""},
     {"fonte":"LYNGSO J et al. Coffee or caffeine consumption and fecundity and fertility: systematic review and dose-response meta-analysis. Clin Epidemiol","ano":2017,"detalhe":"Relação inversa entre cafeína e fertilidade"},
     {"fonte":"PALMERY M et al. Oral contraceptives and changes in nutritional requirements. Eur Rev Med Pharmacol Sci","ano":2013,"detalhe":"Depleção de B12, B6, B9, zinco, selênio, fósforo e magnésio"},
     {"fonte":"ROSSI BV, Abusief M, Missmer SA. Modifiable risk factors and infertility. Am J Lifestyle Med","ano":2014,"detalhe":""},
     {"fonte":"CHAVARRO J, WILLET W. A dieta da fertilidade. Elsevier","ano":2008,"detalhe":""},
     {"fonte":"FEBRASGO — Manual de reprodução humana","ano":2023,"detalhe":""}]'::jsonb,
   'Investigação e diagnóstico de infertilidade são do médico — o casal deve ser encaminhado após 12 meses de tentativas (ou 6 meses acima dos 35 anos). Solicitação e interpretação de FSH, LH e hormônio anti-mülleriano para avaliar reserva ovariana são conduta médica. Suspeita de doença celíaca: confirmar com o médico ANTES de retirar o glúten, porque a retirada prévia invalida a sorologia e a biópsia.',
   'O papel do nutricionista aqui é o terreno: estado nutricional, peso, inflamação e exposição. Não prometer gravidez nem tratar infertilidade — a promessa de resultado fere o Código de Ética. Doses de suplementação pré-concepcional devem respeitar a Res. CFN 656/2020; o que passar disso é prescrição médica.'),

  -- ==========================================================
  --  SOP
  -- ==========================================================
  ('Síndrome dos ovários policísticos (SOP)', 'sop-saude-mulher',
   array['sop','ovário policístico','anovulação','hiperandrogenismo','hirsutismo','resistência à insulina','rotterdam'],
   'Saúde da mulher', 'Endocrinologia ginecológica',
   'Melhorar a sensibilidade à insulina, reduzir o hiperandrogenismo e restabelecer a ovulação, com perda de pelo menos 5% do peso quando há sobrepeso.',
   'Principal endocrinopatia ginecológica da idade reprodutiva (6–10% das mulheres) e causa mais comum de infertilidade por anovulação. Diagnóstico por Rotterdam: 2 dos 3 critérios — anovulação crônica; sinais clínicos e/ou bioquímicos de hiperandrogenismo (alopecia androgênica, hirsutismo, acne); ovários policísticos à ultrassonografia. É diagnóstico de exclusão.

Fisiopatologia que orienta a conduta: hipersecreção de LH com FSH baixo ou no limite inferior leva à hiperatividade das células da teca e à produção aumentada de androgênios (sobretudo testosterona), sem conversão proporcional em estradiol. A insulina age sinergicamente ao LH nas células da teca e ainda reduz a produção hepática de SHBG — os dois efeitos somados elevam a testosterona livre. Por isso a resistência insulínica é o alvo nutricional central, presente com ou sem obesidade.

Conduta de primeira linha (FEBRASGO 2023): mudança de estilo de vida. 150 minutos de atividade física por semana (50 min, 3x). Após 6 meses de dieta e exercício, mulheres com SOP e obesidade tiveram redução de circunferência da cintura, melhora da sensibilidade à insulina, queda da insulina basal e do LH.

Padrão alimentar: mais fibras, menos carboidrato simples, gorduras poli e monoinsaturadas. Revisão sistemática (McGrice & Porter, Nutrients 2017) mostra efeito positivo de dietas pobres em carboidrato sobre hormônios e fertilidade, com ou sem déficit energético; o padrão mediterrâneo também tem resultado positivo. Amêndoas se associaram a melhora da obesidade e da hiperglicemia. Garantir fitoquímicos, fibras e amido resistente todos os dias (biomassa de banana verde, batata yacon, linhaça, cacau).

Sono: mulheres que dormem menos de 6 horas relatam mais irregularidade menstrual, insulina de jejum mais alta e maior prevalência de resistência insulínica — higiene do sono entra na prescrição.',
   '[{"nutriente":"Ômega-3","papel":"Reduz eicosanoides pró-inflamatórios; melhora a sensibilidade hepática à insulina em 38%, mantendo a inibição da produção hepática de glicose. Sempre acompanhado de uma vitamina antioxidante.","dose":"2–3 g/dia"},
     {"nutriente":"Mioinositol","papel":"Suprime a produção de LH e, com isso, a liberação de andrógenos — reduz testosterona livre.","dose":"conforme material: 300 mg a 1 g, 1–2x ao dia"},
     {"nutriente":"Cromo","papel":"Potencializa a ação da insulina ativando a tirosina quinase do receptor insulínico. Deficiência aumenta a vontade de açúcar; excesso de açúcar aumenta a excreção de cromo.","dose":"individualizar"},
     {"nutriente":"Vitamina D","papel":"A deficiência parece reduzir a atividade das células beta pancreáticas.","dose":"conforme sérico"},
     {"nutriente":"Vitamina B12 e ácido fólico","papel":"Manter níveis adequados em quem usa metformina (a droga depleta B12).","dose":"conforme sérico"},
     {"nutriente":"Canela (Cinnamomum zeylanicum)","papel":"Inativa a tirosina fosfatase e modifica a fosforilação da cascata do receptor de insulina.","dose":"conforme produto"},
     {"nutriente":"Chá verde (Camellia sinensis)","papel":"Epigalocatequinas: reduz estresse oxidativo, ação anti-inflamatória e termogênica.","dose":"conforme produto"},
     {"nutriente":"Gymnema sylvestre","papel":"Folhas, extrato seco 60% de ácidos gimnêmicos. Regeneração de células beta, inibição da absorção de glicose, estímulo da secreção de insulina.","dose":"100–200 mg/dia"},
     {"nutriente":"Fenogreco","papel":"Efeito hipoglicemiante pela 4-hidroxi-isoleucina: estimula a regulação da insulina nas células beta e inibe alfa-amilase e sacarase intestinais.","dose":"conforme produto"},
     {"nutriente":"Amido resistente e fibras","papel":"Biomassa de banana verde, batata yacon, linhaça, cacau — glicemia pós-prandial e microbiota.","dose":"diário, via alimentar"}]'::jsonb,
   array['glicemia-jejum','insulina-jejum','homa-ir','hba1c','triglicerideos','hdl','ldl','colesterol-total','vitamina-d','tsh','vitamina-b12','pcr-us'],
   array['Ciclos irregulares ou ausentes','Hirsutismo','Acne persistente','Alopecia androgênica','Acantose nigricans','Dificuldade para engravidar','Ganho de peso com predomínio central','Compulsão por carboidrato','Sono curto (menos de 6 horas)'],
   '[{"titulo":"SOP","tipo":"orientacao","detalhe":"Orientação da biblioteca para a paciente"},
     {"titulo":"Modelo de plano SOP / resistência à insulina","tipo":"habito","detalhe":"Modelo pronto no construtor de plano alimentar"},
     {"titulo":"150 min de atividade por semana","tipo":"habito","detalhe":"50 minutos, 3x na semana — recomendação usada nos estudos citados pela FEBRASGO"},
     {"titulo":"Meta de 5% do peso","tipo":"habito","detalhe":"Perda mínima que já melhora ovulação e perfil metabólico no sobrepeso"}]'::jsonb,
   '[{"fonte":"FEBRASGO — Manual SOP","ano":2023,"detalhe":"Mudança de estilo de vida como primeira linha; rastreio metabólico"},
     {"fonte":"McGRICE M, PORTER J. Nutrients 9(3):204","ano":2017,"detalhe":"Revisão sistemática: dietas pobres em carboidrato e hormônios da fertilidade em mulheres com sobrepeso e obesidade"},
     {"fonte":"SANTANA LF et al. Tratamento da infertilidade em mulheres com SOP. Rev Bras Ginecol Obstet","ano":2008,"detalhe":""},
     {"fonte":"Apostila Saúde da Mulher — Pós em Nutrição Clínica Funcional, Ortomolecular e Fitoterapia","ano":2024,"detalhe":"Alimentação, estilo de vida e suplementação na SOP"}]'::jsonb,
   'Diagnóstico da SOP é médico e de exclusão — pesquisar hiperplasia adrenal, tireoidopatia e hiperprolactinemia. Rastrear com o médico diabetes, hipertensão, dislipidemia e doença de tireoide. Contraceptivo oral é o tratamento inicial recomendado para irregularidade menstrual, hirsutismo e acne em quem não busca engravidar — prescrição médica. Metformina idem.',
   'Não prometer regularização do ciclo nem gravidez. Fitoterápicos hipoglicemiantes (gymnema, fenogreco, canela) somam efeito a antidiabéticos — em quem usa metformina ou insulina, alinhar com o médico pelo risco de hipoglicemia. Prescrição de fitoterápicos conforme Res. CFN 556/2015.'),

  -- ==========================================================
  --  ENDOMETRIOSE
  -- ==========================================================
  ('Endometriose', 'endometriose',
   array['endometriose','edt','dor pélvica','dismenorreia intensa','hiperestrogenismo'],
   'Saúde da mulher', 'Ginecologia',
   'Reduzir o perfil inflamatório e o estresse oxidativo, apoiar o manejo da dor e proteger a fertilidade, sem estimular a via estrogênica.',
   'Desordem crônica estrogênio-dependente: tecido endometrial funcionante fora da cavidade uterina (ovários, peritônio, ligamentos uterossacros, região retrocervical, septo retovaginal, bexiga, reto, sigmoide). Acomete 10–20% das mulheres em idade reprodutiva, e 30–50% das mulheres com endometriose são inférteis.

A teoria mais aceita é a menstruação retrógrada — o sangue menstrual segue para as trompas e a cavidade pélvica, e células endometriais aderem a outros órgãos. Muitas mulheres têm menstruação retrógrada sem desenvolver a doença, porque o sistema imunológico impede o crescimento ectópico — o que coloca imunidade e inflamação no centro do raciocínio nutricional.

Ponto que orienta toda a conduta: o HIPERESTROGENISMO participa da patogênese. Por isso, diferentemente do climatério, aqui o consumo de fitoestrógenos foi associado a AUMENTO do risco de endometriose na revisão citada — não é a mesma conduta da menopausa.

Alimentação e estilo de vida: carne vermelha e embutidos se associam a maior risco; alimentação rica em ômega-6 e o uso de álcool se relacionam a aumento da dor. Níveis adequados de vitamina D e suplementação de vitaminas A, C, E e complexo B se associam a menor risco. A deficiência de nutrientes leva a mudanças no metabolismo lipídico, estresse oxidativo e anormalidades epigenéticas envolvidas na gênese e na progressão da doença. Aumentar frutas, vegetais (de preferência orgânicos) e grãos integrais exerce proteção.

Exercício (FEBRASGO 2021): 2 horas de exercício aeróbico por semana têm efeito protetor na regulação do estradiol e reduzem citocinas inflamatórias.',
   '[{"nutriente":"Ômega-3","papel":"Efeito anti-inflamatório; contrapõe o excesso de ômega-6, que se relaciona a mais dor.","dose":"individualizar"},
     {"nutriente":"N-acetilcisteína (NAC)","papel":"Precursor da glutationa; suplementação associada a proteção e possível regressão da doença.","dose":"individualizar"},
     {"nutriente":"Vitamina D","papel":"Níveis adequados se associam a menor risco de endometriose.","dose":"conforme sérico"},
     {"nutriente":"Resveratrol","papel":"Estudado com resultados interessantes na redução da dor e do perfil inflamatório.","dose":"individualizar"},
     {"nutriente":"Pinus pinaster","papel":"Mesma linha do resveratrol: redução da dor e do perfil inflamatório.","dose":"individualizar"},
     {"nutriente":"Magnésio","papel":"Anti-inflamatório e relaxante natural — priorizar na alimentação destas pacientes.","dose":"200 mg/dia ou via alimentar"},
     {"nutriente":"Vitaminas A, C, E e complexo B","papel":"Menor risco de endometriose quando adequados; antioxidantes de membrana.","dose":"priorizar via alimentar, suplementar o que faltar"},
     {"nutriente":"Gengibre, cúrcuma e alho","papel":"Potencial anti-inflamatório culinário — incorporar na rotina de preparo.","dose":"uso culinário"}]'::jsonb,
   array['vitamina-d','pcr-us','hemoglobina','ferritina','magnesio'],
   array['Dismenorreia intensa e progressiva','Dor pélvica crônica','Dispareunia','Sangramento excessivo','Dor ao evacuar ou urinar no período menstrual','Dificuldade para engravidar','Fadiga','Distensão abdominal cíclica'],
   '[{"titulo":"Endometriose","tipo":"orientacao","detalhe":"Orientação da biblioteca para a paciente"},
     {"titulo":"2 h de aeróbico por semana","tipo":"habito","detalhe":"Recomendação do manual FEBRASGO 2021 — regulação do estradiol e redução de citocinas"},
     {"titulo":"Reduzir carne vermelha, embutidos e álcool","tipo":"habito","detalhe":"Associados a maior risco e a mais dor"}]'::jsonb,
   '[{"fonte":"FEBRASGO — Manual de endometriose","ano":2021,"detalhe":"Benefícios do exercício: 2 h de aeróbico por semana"},
     {"fonte":"Revisão em Am J Matern Child Nurs","ano":2017,"detalhe":"Dieta e estilo de vida na inflamação crônica da endometriose; carne vermelha, embutidos, ômega-6, álcool, vitamina D e fitoestrógenos"},
     {"fonte":"Apostila Saúde da Mulher — Pós em Nutrição Clínica Funcional, Ortomolecular e Fitoterapia","ano":2024,"detalhe":"Alimentação, estilo de vida e suplementação na EDT"}]'::jsonb,
   'Diagnóstico, estadiamento, tratamento hormonal e cirurgia são conduta médica (ginecologia). Dor que incapacita, piora progressiva, sangramento intenso com anemia, ou infertilidade: encaminhar. Suspeita de comprometimento intestinal ou urinário (dor ao evacuar/urinar no período menstrual): avaliação especializada.',
   'ATENÇÃO — ao contrário do climatério, NÃO estimular fitoestrógenos aqui: a revisão citada associa o consumo a aumento do risco de endometriose, e a doença é estrogênio-dependente. Cuidado ao aplicar nesta paciente uma conduta pensada para menopausa.'),

  -- ==========================================================
  --  CANDIDÍASE VULVOVAGINAL
  -- ==========================================================
  ('Candidíase vulvovaginal de repetição', 'candidiase-vulvovaginal',
   array['candidíase','cândida','corrimento','prurido vulvar','disbiose vaginal','fungo'],
   'Saúde da mulher', 'Microbiota e imunidade',
   'Reduzir o substrato para a proliferação fúngica, restaurar as microbiotas intestinal e vaginal e melhorar a resposta imune, diminuindo a recorrência.',
   'Infecção fúngica do trato geniturinário inferior, mais comumente por Candida albicans (mas com incidência crescente de não-albicans: C. glabrata, C. tropicalis, C. krusei). Quadro clássico: prurido vulvar intenso, corrimento esbranquiçado em grumos, dispareunia e disúria, com vulva e vagina edemaciadas e hiperemiadas. O diagnóstico é clínico + exame microscópico a fresco do conteúdo vaginal.

Fatores predisponentes que valem rastrear na anamnese: ambiente hiperestrogênico (gestação — sobretudo após a 28ª semana, anticoncepcional, terapia hormonal), porque o estrogênio estimula a produção de glicogênio pelo epitélio vaginal, que é alimento para o fungo, e favorece a adesão; diabetes descontrolada (controle glicêmico adequado reduz o risco); uso recorrente de antibiótico, anti-inflamatório, laxante e antiácido; alimentação pobre em fibras e disbiose intestinal; ambiente úmido e quente (roupa apertada); queda de imunidade (estresse, quimioterapia, trauma, sepse); HIV.

A microbiota intestinal controla a circulação de estrogênio pelo estroboloma, e o estrogênio circulante ajuda a definir a microbiota vaginal — os dois microbiomas se sobrepõem e, desequilibrados, sinalizam ao sistema imune e estimulam inflamação.

Alimentação: o principal substrato do fungo é a glicose. Na crise, excluir alimentos com alto teor de açúcar e carboidrato refinado, preferir integrais, evitar frutas secas e sucos concentrados (preferir fruta fresca). Cuidado com alimentos mais suscetíveis à contaminação fúngica: oleaginosas (amendoim, castanha de caju, pistache) e bebidas fermentadas (vinho, espumante). Evitar conservas — azeitona, picles, cogumelos (shitake, shimeji). A restrição de leite de vaca e derivados tem sido implicada nos casos recorrentes: lactose como substrato, potencial alergênico da proteína e possíveis traços de antibiótico que interferem na microbiota.',
   '[{"nutriente":"Probióticos (lactobacilos)","papel":"Barreira defensiva em três níveis: competem por nutrientes, bloqueiam receptores epiteliais impedindo a adesão do fungo e produzem bacteriocinas que inibem a germinação. Lactobacilos ingeridos aumentam a colonização vaginal já no primeiro mês, reduzindo prurido, dispareunia e disúria.","dose":"individualizar por cepa"},
     {"nutriente":"Prebióticos e fibras","papel":"Sustentam a microbiota; a alimentação pobre em fibra é fator predisponente.","dose":"via alimentar"},
     {"nutriente":"Ácido láurico e ácido caprílico","papel":"Ácidos graxos de cadeia média convertidos em monolaurina e monocaprina, que alteram a membrana lipídica do fungo, rompendo e inativando a célula. Óleo de coco extravirgem tem mais de 40% de láurico e 7% de caprílico.","dose":"via alimentar ou suplemento"},
     {"nutriente":"Alho (Allium sativum)","papel":"Alicina, com ação antifúngica e antibacteriana. Consumir logo após o preparo e de preferência cru — a aliina só vira alicina com o rompimento do dente.","dose":"uso culinário, cru"},
     {"nutriente":"Óleos essenciais de orégano, tomilho, canela e alecrim","papel":"Inibem a biossíntese do ergosterol, alteram a permeabilidade da membrana plasmática, inativam enzimas da produção de energia e alteram canais de cálcio, levando à ruptura celular do fungo. Incentivar no tempero da comida.","dose":"uso culinário"},
     {"nutriente":"Zinco, selênio, ferro, vitaminas A, C, E, biotina, betacaroteno e folato","papel":"Aporte adequado melhora a resposta imune, que é o que impede a recorrência.","dose":"individualizar"},
     {"nutriente":"Vitamina D","papel":"Imunidade de mucosa.","dose":"conforme sérico"}]'::jsonb,
   array['glicemia-jejum','hba1c','vitamina-d','zinco','selenio','ferritina','hemoglobina'],
   array['Prurido vulvar intenso','Corrimento branco em grumos','Dispareunia','Disúria','Vulva ou vagina edemaciada e hiperemiada','Episódios repetidos (4 ou mais por ano)','Uso recente de antibiótico','Consumo alto de açúcar e refinados'],
   '[{"titulo":"Candidíase de repetição","tipo":"orientacao","detalhe":"Orientação da biblioteca para a paciente — o que evitar na crise"},
     {"titulo":"Alimentos a evitar na crise","tipo":"habito","detalhe":"Açúcar, refinados, frutas secas, sucos concentrados, conservas, fermentados, leite e derivados"},
     {"titulo":"Controle glicêmico","tipo":"habito","detalhe":"Em diabética, o controle da glicemia reduz o risco de infecção por cândida"}]'::jsonb,
   '[{"fonte":"CHAITOW L. Candidíase recorrente: tratamento anticândida à base de suplementos e alimentação. KN Books","ano":2014,"detalhe":""},
     {"fonte":"Ceccarani C, Foschi C, Parolin C et al. Diversity of vaginal microbiome and metabolome during genital infections. Sci Rep 9:14095","ano":2019,"detalhe":""},
     {"fonte":"AMABEBE E, ANUMBA DOC. Female gut and genital tract microbiota-induced crosstalk and differential effects of short-chain fatty acids on immune sequelae","ano":2020,"detalhe":""},
     {"fonte":"Reed et al.; Horowitz et al.","ano":null,"detalhe":"Associação entre alta ingestão de açúcar e ocorrência de candidíase"},
     {"fonte":"Apostila Saúde da Mulher — Pós em Nutrição Clínica Funcional, Ortomolecular e Fitoterapia","ano":2024,"detalhe":"Alimentação e crescimento fúngico"}]'::jsonb,
   'Diagnóstico e antifúngico são do médico — fluconazol, miconazol, clotrimazol, itraconazol, cetoconazol, nistatina e anfotericina B são prescrição médica. Quatro ou mais episódios por ano (candidíase recorrente), espécie não-albicans, falha de tratamento, gestação, ou suspeita de diabetes ou imunossupressão: encaminhar. Corrimento com odor forte, febre ou dor pélvica: pode não ser cândida — avaliação ginecológica.',
   'A restrição alimentar da crise é temporária e ampla — não transformar em dieta restritiva crônica, sobretudo em paciente com histórico de transtorno alimentar. Óleos essenciais aqui são uso culinário; uso interno de óleo essencial não é conduta do nutricionista.'),

  -- ==========================================================
  --  CLIMATÉRIO E MENOPAUSA
  -- ==========================================================
  ('Climatério e menopausa', 'climaterio-menopausa',
   array['climatério','menopausa','perimenopausa','fogacho','ondas de calor','pós-menopausa','osteoporose'],
   'Saúde da mulher', 'Ciclo menstrual',
   'Proteger massa magra e óssea, controlar peso e gordura visceral, reduzir sintomas vasomotores e de humor e cuidar do risco cardiovascular que sobe com a queda do estrogênio.',
   'Climatério (Ministério da Saúde): processo biológico não patológico da passagem da fase reprodutiva para a não reprodutiva, dos ~40 aos 65 anos. Menopausa é o último ciclo menstrual, identificado retrospectivamente após 12 meses de amenorreia, em média entre 48 e 50 anos. Com expectativa de vida em torno de 75 anos no Brasil, um terço da vida da mulher acontece no climatério — e 33% delas terão pelo menos uma patologia nesse período (ITU de repetição, hipertensão, doença cardiovascular, diabetes).

O que muda no metabolismo e explica a conduta: o estradiol aumenta o metabolismo basal, aumenta a gliconeogênese hepática, melhora a sensibilidade à insulina no músculo e a função das células beta, e suprime a fome via receptores alfa no SNC. Com a queda, o gasto energético cai 250–300 kcal por dia, a ingestão calórica tende a subir e a gordura se redistribui para o compartimento visceral. Adipócitos maiores recrutam células imunes e geram inflamação sistêmica de baixo grau, que acelera o dano vascular. O estrogênio também protegia o perfil lipídico — sua queda reduz HDL e aumenta triglicerídeos, LDL e resistência à insulina. Daí a atenção cardiovascular preventiva.

Fogachos: sintomas vasomotores de origem hipotalâmica, percebidos em 80% das mulheres no climatério, associados a aumento do fluxo sanguíneo e da frequência cardíaca.

Padrão alimentar: a dieta de perfil MEDITERRÂNEO é a mais estudada e apontada como a que garante melhor perfil lipídico, saúde cardiovascular, melhora da dor articular e redução de gordura visceral. Priorizar in natura e minimamente processados; reduzir processados; evitar ultraprocessados (excesso de calorias, sódio e glutamato monossódico, que provocam retenção e agravam sintomas). Monoinsaturadas e ômega-3 no plano; reduzir saturada e trans.

Emagrecimento nesta fase: perda de 0,5–1 kg por semana, à custa de massa gorda. Ingestão 15–30% (500–1000 kcal) abaixo da necessidade atual, em torno de 25 kcal/kg/dia sobre o peso atual. Proteína 1–1,2 g/kg (20% da energia) com treino resistido para preservar massa magra — dieta hiperproteica só emagrece se a energia for baixa. A perda costuma desacelerar após 12 semanas: aí o objetivo passa a ser manutenção, em ciclos, mirando 5–10% do peso.

Hidratação: 33 ml/kg/dia distribuídos ao longo do dia — as alterações hormonais afetam a sede e a ingestão cai. Sal o mais próximo possível de 5 g/dia, com ervas no lugar. Frutas e vegetais: 5 porções (500 g/dia; 300–400 g de vegetais e 100–200 g de frutas).

Osso: garantir cálcio, vitamina D3, boro, vitamina C, magnésio, vitamina K e colágeno. Evitar cafeína, refrigerante, dieta hiperproteica e álcool — todos relacionados a maior perda óssea.',
   '[{"nutriente":"Cálcio e vitamina D3","papel":"Massa óssea, que sofre grande impacto com a queda hormonal.","dose":"conforme ingestão e sérico"},
     {"nutriente":"Vitamina K, boro, vitamina C, magnésio e colágeno","papel":"Demais nutrientes da saúde óssea e articular — avaliar sempre em conjunto com cálcio e D.","dose":"individualizar"},
     {"nutriente":"Creatina","papel":"Estimula diferenciação e desenvolvimento de osteoblastos e favorece força muscular; segura, de baixo custo, com eficácia em osteosarcopenia. Potencializa o controle glicêmico em mulheres saudáveis e diabéticas tipo 2 e parece benéfica na hipercolesterolemia. Também melhora cognição.","dose":"3–5 g/dia"},
     {"nutriente":"Proteína","papel":"Preservar massa magra durante o déficit, junto de treino resistido.","dose":"1–1,2 g/kg/dia (20% da energia)"},
     {"nutriente":"Ômega-3 e monoinsaturadas","papel":"Perfil lipídico e inflamação de baixo grau.","dose":"via alimentar + suplemento se necessário"},
     {"nutriente":"Complexo B e coenzima Q10","papel":"Reduzem a queixa de fadiga por via da energia mitocondrial.","dose":"individualizar"},
     {"nutriente":"Antioxidantes (vitamina C, betacaroteno, selênio, zinco, vitamina E, resveratrol, catequinas, cúrcuma longa)","papel":"O envelhecimento em si é uma condição inflamatória — abordagem antioxidante e anti-inflamatória é obrigatória nesta fase.","dose":"priorizar via alimentar"},
     {"nutriente":"Rhodiola rosea (ESP 5% rosavinas, raiz)","papel":"Adaptógeno para fadiga e resposta ao estresse.","dose":"100–300 mg"},
     {"nutriente":"Ashwagandha (Withania somnifera, raiz)","papel":"Adaptógeno; energia e sono.","dose":"300–500 mg"},
     {"nutriente":"Alcaçuz chinês (Glycyrrhiza uralensis, raiz)","papel":"Adaptógeno.","dose":"100–450 mg"},
     {"nutriente":"Glycine max (soja)","papel":"Fitoestrógeno para fogachos e queixas do climatério.","dose":"40–60 mg"},
     {"nutriente":"Morus nigra (amora)","papel":"Fogachos, insônia, nervosismo e fadiga.","dose":"tintura 10–20 ml/dia, em 2–3 tomadas"},
     {"nutriente":"Lepidium meyenii (maca peruana)","papel":"Libido e energia.","dose":"100–500 mg"},
     {"nutriente":"Vitex agnus-castus (agnocasto)","papel":"Humor e sintomas da transição.","dose":"tintura 20–40 ml/dia"},
     {"nutriente":"L-triptofano, B6, cálcio e magnésio","papel":"Ansiedade e humor: a oscilação de neurotransmissores aqui é muito parecida com a da SPM — ver o protocolo de SPM.","dose":"ver protocolo de SPM"}]'::jsonb,
   array['glicemia-jejum','insulina-jejum','hba1c','colesterol-total','hdl','ldl','triglicerideos','vitamina-d','calcio','pth','tsh','t4-livre','vitamina-b12','ferritina','hemoglobina','creatinina-tfg','tgo-ast','tgp-alt','magnesio'],
   array['Fogachos e sudorese','Irregularidade menstrual na perimenopausa','Ganho de peso e aumento da gordura visceral','Perda de massa magra e de força','Insônia','Ansiedade, irritabilidade e humor deprimido','Dor articular','Ressecamento de pele e mucosas','Queda de libido','Fadiga','Infecção urinária de repetição'],
   '[{"titulo":"Menopausa","tipo":"orientacao","detalhe":"Orientação da biblioteca para a paciente"},
     {"titulo":"Modelo de plano mediterrâneo do climatério","tipo":"habito","detalhe":"Modelo pronto no construtor de plano alimentar"},
     {"titulo":"Treino de força","tipo":"habito","detalhe":"Exercício resistido é o que preserva massa magra e óssea nesta fase — combinar com o educador físico"},
     {"titulo":"33 ml/kg/dia de líquido","tipo":"habito","detalhe":"A sede diminui na menopausa; distribuir ao longo do dia"}]'::jsonb,
   '[{"fonte":"Ministério da Saúde","ano":null,"detalhe":"Definição de climatério: dos 40 aos 65 anos"},
     {"fonte":"STRAW — Stages of Reproductive Aging Workshop","ano":null,"detalhe":"Classificação do envelhecimento reprodutivo em idade reprodutiva, transição menopausal e menopausal"},
     {"fonte":"FERNANDES CE, POMPEI LM. Endocrinologia feminina. Manole","ano":2016,"detalhe":""},
     {"fonte":"VITOLO MR. Nutrição da gestação ao envelhecimento, 2ª ed.","ano":2014,"detalhe":""},
     {"fonte":"RAMOS et al. Nutrição funcional na saúde da mulher. Atheneu","ano":2018,"detalhe":""},
     {"fonte":"Apostila Saúde da Mulher — Pós em Nutrição Clínica Funcional, Ortomolecular e Fitoterapia","ano":2024,"detalhe":"Nutrientes e alimentos na menopausa; creatina e menopausa"}]'::jsonb,
   'Terapia hormonal é decisão médica e individualizada — apresentar como uma opção a discutir com o ginecologista, nunca desestimular. Sangramento após 12 meses de amenorreia: investigação ginecológica imediata. Exames sugeridos pelo material para acompanhamento (FSH, LH, estradiol, testosterona, androstenediona, DHEA, PTH) devem ser pedidos e lidos dentro do escopo profissional — o que passar disso, encaminhar. Osteoporose diagnosticada, fratura por fragilidade, dor torácica ou hipertensão não controlada: médico.',
   'Fitoestrógeno não é reposição hormonal e não pode ser apresentado como equivalente. Cimicífuga: cautela em hepatopatia. Vitex e Hypericum têm interações relevantes (contraceptivo, anticoagulante, antidepressivo). Alcaçuz em uso prolongado pode elevar a pressão e reduzir potássio — cuidado em hipertensa. Prescrição de fitoterápicos conforme Res. CFN 556/2015; suplementação conforme Res. CFN 656/2020.');

  insert into public.ic_protocolos
    (nutricionista_id, nome, slug, sinonimos, eixo, grupo, objetivo_clinico, estrategia,
     nutrientes, exames_slugs, sinais_sintomas, materiais_apoio, referencias,
     quando_encaminhar, atencao)
  select v_ana, nome, slug, sinonimos, eixo, grupo, objetivo_clinico, estrategia,
         nutrientes, exames_slugs, sinais_sintomas, materiais_apoio, referencias,
         quando_encaminhar, atencao
    from _p
  on conflict (nutricionista_id, slug) where nutricionista_id is not null
  do update set
    nome = excluded.nome, sinonimos = excluded.sinonimos, eixo = excluded.eixo,
    grupo = excluded.grupo, objetivo_clinico = excluded.objetivo_clinico,
    estrategia = excluded.estrategia, nutrientes = excluded.nutrientes,
    exames_slugs = excluded.exames_slugs, sinais_sintomas = excluded.sinais_sintomas,
    materiais_apoio = excluded.materiais_apoio, referencias = excluded.referencias,
    quando_encaminhar = excluded.quando_encaminhar, atencao = excluded.atencao,
    ativo = true, updated_at = now();

  raise notice 'Protocolos de saúde da mulher gravados para %', v_ana;
end $$;

notify pgrst, 'reload schema';
