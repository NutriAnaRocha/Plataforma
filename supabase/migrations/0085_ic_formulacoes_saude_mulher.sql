-- ============================================================
--  Plataforma Nutri — Migração 0085
--  FORMULAÇÕES DE SAÚDE DA MULHER — doses da apostila da pós.
--
--  Fonte: apostila "Saúde da Mulher" (Profa. Bianca Innocencio) — faixas de
--  dose que o próprio material traz para cada nutriente e fitoterápico.
--  Acervo PESSOAL da Ana. Ligadas aos protocolos da migração 0083.
--
--  Slug prefixado com "am-" (apostila mulher) para não colidir com as
--  formulações da base curada (form-tpm, form-menopausa) nem com as da
--  Raiz Magistral (rm-*).
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

  create temp table _f (
    nome text, slug text, sinonimos text[], categoria text, eixo text, grupo text,
    indicacao text, formulas jsonb, observacoes text, interacoes text,
    quando_encaminhar text, atencao text, referencias jsonb
  ) on commit drop;

  insert into _f values

  ('SPM — suporte serotoninérgico e antiedema', 'am-spm',
   array['spm','tpm','triptofano','b6','magnésio','cálcio','mastalgia','prímula'],
   'suplementacao', 'Saúde da mulher', 'Apostila da pós',
   'Sintomas de tensão pré-menstrual na fase lútea, montados pelo tipo predominante (ansiedade, craving, edema ou humor deprimido).',
   '[{"titulo":"Base nutricional (todos os tipos)","componentes":[
        {"ativo":"L-triptofano","dose":"50–150 mg","obs":"dividir em 3 tomadas; ofertar junto de carboidrato"},
        {"ativo":"Vitamina B6 (piridoxina)","dose":"40–100 mg/dia","obs":"cofator da conversão em serotonina e dopamina"},
        {"ativo":"Magnésio","dose":"200 mg/dia","obs":"com 50 mg de B6 reduziu tensão, humor e irritabilidade na fase lútea"},
        {"ativo":"Cálcio","dose":"500 mg 2x/dia (ou quelado 200 mg 2x/dia)","obs":""}],
      "posologia":"Contínuo ou a partir da ovulação","duracao":"3 ciclos, reavaliar","via":"oral"},
     {"titulo":"Mastalgia (dor nas mamas)","componentes":[
        {"ativo":"Óleo de prímula (Oenothera biennis)","dose":"conforme produto","obs":"10% de GLA, precursor da PGE1 anti-inflamatória"},
        {"ativo":"Óleo de borragem (Borago officinalis)","dose":"conforme produto","obs":"20% de GLA — alternativa à prímula"},
        {"ativo":"Vitamina E","dose":"avaliar consumo alimentar","obs":"antioxidante de membrana, modula prostaglandinas"},
        {"ativo":"Vitex agnus-castus","dose":"100–370 mg/dia","obs":"dopaminérgico, suprime prolactina"}],
      "posologia":"1x ao dia","duracao":"2–3 ciclos","via":"oral"},
     {"titulo":"Cólica e cefaleia","componentes":[
        {"ativo":"Gengibre (Zingiber officinale)","dose":"250 mg/dia","obs":"inibe COX e LOX, reduz prostaglandinas pró-inflamatórias"},
        {"ativo":"Magnésio","dose":"200 mg/dia","obs":"antagonista NMDA — dor e cefaleia"},
        {"ativo":"Isoflavonas","dose":"40 mg/dia","obs":"reduziu enxaqueca pré-menstrual; avaliar individualmente"}],
      "posologia":"Da ovulação até o fim do fluxo","duracao":"2–3 ciclos","via":"oral"},
     {"titulo":"Ansiedade e insônia do período","componentes":[
        {"ativo":"Passiflora incarnata","dose":"conforme produto","obs":""},
        {"ativo":"Angelica sinensis","dose":"conforme produto","obs":""}],
      "posologia":"À noite","duracao":"2–3 ciclos","via":"oral"}]'::jsonb,
   'Montar pelo tipo de SPM (Hargrove e Abraham): tipo A ansiedade, tipo C craving e cefaleia, tipo H edema, tipo D depressão. Pedir diário de sintomas por 3 ciclos antes e depois — é o que mede o resultado.',
   'B6 em dose alta e prolongada: risco de neuropatia periférica. Vitex interfere em contraceptivo hormonal e agonistas dopaminérgicos. Triptofano não deve ser associado a ISRS/IMAO sem alinhamento médico. Isoflavona: avaliar histórico de câncer hormônio-dependente.',
   'TDPM ou sintomas incapacitantes: equipe multidisciplinar com psiquiatria. Sintomas que não regridem com o fluxo: o diagnóstico é outro.',
   'Doses da apostila da pós — apoio à decisão, individualizar. Dentro dos limites da Res. CFN 656/2020 e, para fitoterápicos, da Res. CFN 556/2015.',
   '[{"fonte":"Apostila Saúde da Mulher — Pós em Nutrição Clínica Funcional, Ortomolecular e Fitoterapia","ano":2024,"detalhe":"Abordagem nutricional para SPM"},
     {"fonte":"ACOG","ano":null,"detalhe":"Critério diagnóstico da SPM"},
     {"fonte":"NAVES A. Nutrição clínica funcional: modulação hormonal","ano":2010,"detalhe":""}]'::jsonb),

  ('SOP — sensibilidade à insulina', 'am-sop',
   array['sop','ovário policístico','mioinositol','cromo','gymnema','fenogreco','canela','resistência à insulina'],
   'suplementacao', 'Saúde da mulher', 'Apostila da pós',
   'Síndrome dos ovários policísticos com resistência à insulina e hiperandrogenismo.',
   '[{"titulo":"Base metabólica","componentes":[
        {"ativo":"Mioinositol","dose":"300 mg a 1 g, 1–2x ao dia","obs":"suprime LH e reduz testosterona livre"},
        {"ativo":"Ômega-3","dose":"2–3 g/dia","obs":"sempre com uma vitamina antioxidante; melhora 38% da sensibilidade hepática à insulina"},
        {"ativo":"Cromo (picolinato)","dose":"individualizar","obs":"ativa a tirosina quinase do receptor insulínico"},
        {"ativo":"Vitamina D","dose":"conforme sérico","obs":"deficiência reduz a atividade das células beta"}],
      "posologia":"Contínuo","duracao":"3–6 meses, reavaliar","via":"oral"},
     {"titulo":"Fitoterápicos hipoglicemiantes","componentes":[
        {"ativo":"Gymnema sylvestre (ESP 60% ácidos gimnêmicos, folhas)","dose":"100–200 mg/dia","obs":"regenera células beta, inibe absorção de glicose"},
        {"ativo":"Canela (Cinnamomum zeylanicum)","dose":"conforme produto","obs":"inativa a tirosina fosfatase"},
        {"ativo":"Fenogreco","dose":"conforme produto","obs":"4-hidroxi-isoleucina; inibe alfa-amilase e sacarase"},
        {"ativo":"Chá verde (Camellia sinensis)","dose":"conforme produto","obs":"epigalocatequinas — antioxidante e termogênico"}],
      "posologia":"Antes das refeições principais","duracao":"3 meses, reavaliar","via":"oral"},
     {"titulo":"Em uso de metformina","componentes":[
        {"ativo":"Vitamina B12 (metilcobalamina)","dose":"conforme sérico","obs":"a metformina depleta B12"},
        {"ativo":"Ácido fólico","dose":"conforme sérico","obs":""}],
      "posologia":"Contínuo enquanto usar o fármaco","duracao":"reavaliar a cada 6 meses","via":"oral"}]'::jsonb,
   'A suplementação é adjuvante — a primeira linha na SOP é estilo de vida: 150 min de atividade por semana (50 min, 3x), padrão mediterrâneo ou com menos carboidrato, fibras e amido resistente diários, e meta de perda de pelo menos 5% do peso no sobrepeso. Dormir menos de 6 h piora a insulina de jejum.',
   'Gymnema, fenogreco e canela somam efeito hipoglicemiante a metformina e insulina — risco de hipoglicemia; alinhar com o médico. Cromo pode alterar a glicemia de quem já usa antidiabético. Chá verde em extrato: cautela em hepatopatia.',
   'Diagnóstico é médico e de exclusão (Rotterdam). Rastrear com o médico diabetes, hipertensão, dislipidemia, tireoide e hiperplasia adrenal. Contraceptivo e metformina são prescrição médica.',
   'Doses da apostila da pós — individualizar. Não prometer regularização do ciclo nem gravidez.',
   '[{"fonte":"FEBRASGO — Manual SOP","ano":2023,"detalhe":"Estilo de vida como primeira linha"},
     {"fonte":"McGRICE M, PORTER J. Nutrients 9(3):204","ano":2017,"detalhe":"Dietas pobres em carboidrato, hormônios e fertilidade"},
     {"fonte":"Apostila Saúde da Mulher — Pós em Nutrição Clínica Funcional, Ortomolecular e Fitoterapia","ano":2024,"detalhe":"Suplementação na SOP"}]'::jsonb),

  ('Endometriose — anti-inflamatório e antioxidante', 'am-endometriose',
   array['endometriose','nac','resveratrol','pinus','ômega-3','dor pélvica'],
   'suplementacao', 'Saúde da mulher', 'Apostila da pós',
   'Endometriose: apoio à dor e ao perfil inflamatório, sem estimular a via estrogênica.',
   '[{"titulo":"Base anti-inflamatória","componentes":[
        {"ativo":"Ômega-3","dose":"individualizar","obs":"contrapõe o excesso de ômega-6, que se relaciona a mais dor"},
        {"ativo":"N-acetilcisteína (NAC)","dose":"individualizar","obs":"precursor da glutationa; associada a proteção e possível regressão"},
        {"ativo":"Vitamina D","dose":"conforme sérico","obs":"níveis adequados se associam a menor risco"},
        {"ativo":"Magnésio","dose":"200 mg/dia","obs":"anti-inflamatório e relaxante"}],
      "posologia":"Contínuo","duracao":"3–6 meses, reavaliar","via":"oral"},
     {"titulo":"Apoio à dor","componentes":[
        {"ativo":"Resveratrol","dose":"individualizar","obs":"redução da dor e do perfil inflamatório"},
        {"ativo":"Pinus pinaster","dose":"individualizar","obs":"mesma linha do resveratrol"}],
      "posologia":"1–2x ao dia","duracao":"3 meses, reavaliar","via":"oral"},
     {"titulo":"Antioxidantes de base","componentes":[
        {"ativo":"Vitaminas A, C e E","dose":"priorizar via alimentar; suplementar o que faltar","obs":"menor risco quando adequadas"},
        {"ativo":"Complexo B","dose":"individualizar","obs":""}],
      "posologia":"Conforme necessidade","duracao":"reavaliar","via":"oral"}]'::jsonb,
   'Gengibre, cúrcuma e alho entram pelo tempero, não só pela cápsula. Exercício aeróbico de 2 h por semana faz parte do protocolo (FEBRASGO 2021).',
   'Resveratrol e NAC podem interferir em anticoagulantes. NAC: cautela em asma brônquica instável.',
   'Diagnóstico, hormonioterapia e cirurgia são do ginecologista. Dor incapacitante, sangramento com anemia, infertilidade ou sintomas intestinais e urinários cíclicos: encaminhar.',
   'NÃO indicar fitoestrógenos nesta paciente: a doença é estrogênio-dependente e o consumo foi associado a aumento do risco. Não confundir com a conduta de menopausa. Doses da apostila — individualizar.',
   '[{"fonte":"FEBRASGO — Manual de endometriose","ano":2021,"detalhe":""},
     {"fonte":"Revisão em Am J Matern Child Nurs","ano":2017,"detalhe":"Nutrientes, fitoestrógenos e risco de endometriose"},
     {"fonte":"Apostila Saúde da Mulher — Pós em Nutrição Clínica Funcional, Ortomolecular e Fitoterapia","ano":2024,"detalhe":""}]'::jsonb),

  ('Candidíase de repetição — microbiota e imunidade', 'am-candidiase',
   array['candidíase','cândida','probiótico','caprílico','láurico','alho','óleo de coco'],
   'suplementacao', 'Saúde da mulher', 'Apostila da pós',
   'Candidíase vulvovaginal de repetição: reduzir substrato, restaurar microbiota e melhorar imunidade.',
   '[{"titulo":"Microbiota","componentes":[
        {"ativo":"Probióticos (lactobacilos)","dose":"individualizar por cepa","obs":"competem por nutrientes, bloqueiam a adesão ao epitélio e produzem bacteriocinas; aumentam a colonização vaginal já no 1º mês"},
        {"ativo":"Prebióticos e fibras","dose":"via alimentar","obs":"alimentação pobre em fibra é fator predisponente"}],
      "posologia":"1x ao dia","duracao":"no mínimo 1–3 meses","via":"oral"},
     {"titulo":"Ação antifúngica","componentes":[
        {"ativo":"Ácido caprílico","dose":"conforme produto","obs":"vira monocaprina; rompe a membrana do fungo"},
        {"ativo":"Ácido láurico","dose":"conforme produto","obs":"vira monolaurina; óleo de coco extravirgem tem mais de 40%"},
        {"ativo":"Alho (Allium sativum)","dose":"uso culinário, cru","obs":"alicina — consumir logo após amassar"},
        {"ativo":"Orégano, tomilho, canela e alecrim","dose":"uso culinário","obs":"óleos essenciais inibem a biossíntese do ergosterol"}],
      "posologia":"Diário, durante a crise e na manutenção","duracao":"reavaliar","via":"oral"},
     {"titulo":"Imunidade","componentes":[
        {"ativo":"Zinco","dose":"individualizar","obs":""},
        {"ativo":"Selênio","dose":"individualizar","obs":""},
        {"ativo":"Vitaminas A, C e E","dose":"individualizar","obs":""},
        {"ativo":"Biotina e betacaroteno","dose":"individualizar","obs":""},
        {"ativo":"Ferro","dose":"conforme ferritina","obs":""},
        {"ativo":"Ácido fólico","dose":"individualizar","obs":""},
        {"ativo":"Vitamina D","dose":"conforme sérico","obs":"imunidade de mucosa"}],
      "posologia":"Contínuo","duracao":"reavaliar em 3 meses","via":"oral"}]'::jsonb,
   'Sem a parte alimentar a suplementação não resolve: na crise, cortar açúcar e refinados, frutas secas, sucos concentrados, conservas, fermentados e oleaginosas, e avaliar retirada temporária de leite e derivados. Rastrear na anamnese antibiótico recorrente, anticoncepcional, gestação, diabetes e roupa apertada.',
   'S. boulardii e probióticos em geral: cautela em imunossuprimida ou com cateter venoso central. Óleos essenciais aqui são uso culinário — uso interno não é conduta do nutricionista.',
   'Antifúngico é prescrição médica. Quatro ou mais episódios por ano, espécie não-albicans, falha de tratamento, gestação, ou suspeita de diabetes ou imunossupressão: encaminhar.',
   'A restrição é da fase de crise — reintroduzir depois. Cuidado redobrado em paciente com histórico de transtorno alimentar. Doses da apostila — individualizar.',
   '[{"fonte":"CHAITOW L. Candidíase recorrente. KN Books","ano":2014,"detalhe":""},
     {"fonte":"AMABEBE E, ANUMBA DOC","ano":2020,"detalhe":"Microbiota intestinal e genital e ácidos graxos de cadeia curta"},
     {"fonte":"Apostila Saúde da Mulher — Pós em Nutrição Clínica Funcional, Ortomolecular e Fitoterapia","ano":2024,"detalhe":"Alimentos e nutrientes que inibem o crescimento fúngico"}]'::jsonb),

  ('Pré-concepcional — preparo de 3 a 6 meses', 'am-preconcepcional',
   array['fertilidade','pré-concepcional','engravidar','metilfolato','coq10','anticoncepcional'],
   'suplementacao', 'Saúde da mulher', 'Apostila da pós',
   'Preparo nutricional nos 3 a 6 meses antes da concepção, com atenção às depleções do anticoncepcional oral.',
   '[{"titulo":"Reposição pós-anticoncepcional","componentes":[
        {"ativo":"Metilfolato (B9)","dose":"conforme protocolo pré-concepcional","obs":"depletado proporcionalmente ao tempo de uso"},
        {"ativo":"Metilcobalamina (B12)","dose":"conforme sérico e homocisteína","obs":""},
        {"ativo":"Vitamina B6","dose":"individualizar","obs":""},
        {"ativo":"Zinco","dose":"individualizar","obs":""},
        {"ativo":"Selênio","dose":"individualizar","obs":""},
        {"ativo":"Magnésio","dose":"individualizar","obs":""}],
      "posologia":"Contínuo","duracao":"3–6 meses antes de tentar","via":"oral"},
     {"titulo":"Antioxidantes e mitocôndria","componentes":[
        {"ativo":"Coenzima Q10","dose":"individualizar","obs":"bioenergética do oócito; relevante em dieta restritiva e idade materna avançada"},
        {"ativo":"Vitaminas A, C e E","dose":"individualizar","obs":"protegem oócito, embrião e endométrio do estresse oxidativo"},
        {"ativo":"Ômega-3","dose":"individualizar","obs":"perfil anti-inflamatório"}],
      "posologia":"Contínuo","duracao":"3–6 meses","via":"oral"},
     {"titulo":"Reservas e intestino","componentes":[
        {"ativo":"Ferro","dose":"conforme ferritina","obs":"avaliar ferritina, não só hemoglobina"},
        {"ativo":"Vitamina D","dose":"conforme sérico","obs":"função ovariana e implantação"},
        {"ativo":"Glutamina","dose":"individualizar","obs":"reparo de mucosa quando há doença intestinal associada"},
        {"ativo":"Probióticos","dose":"individualizar","obs":""}],
      "posologia":"Contínuo","duracao":"3–6 meses","via":"oral"}]'::jsonb,
   'Rastrear antes: tempo de uso de anticoncepcional, dietas restritivas, variações de peso, sintomas gastrointestinais, exposição a agrotóxicos e plásticos, cafeína (menos de 100 ml/dia) e tabagismo ativo ou passivo. Doença celíaca aparece em 4–8% da infertilidade inexplicada.',
   'Vitamina A em dose alta é teratogênica — atenção especial na mulher que pode engravidar. Ferro reduz a absorção de zinco e de levotiroxina; distanciar. CoQ10 pode interferir em varfarina.',
   'Após 12 meses de tentativas (ou 6 meses acima dos 35 anos), a investigação é médica e o casal vai junto. FSH, LH e hormônio anti-mülleriano para reserva ovariana são conduta médica. Suspeita de doença celíaca: confirmar com o médico ANTES de retirar o glúten — a retirada invalida sorologia e biópsia.',
   'Não prometer gravidez — promessa de resultado fere o Código de Ética. Doses conforme Res. CFN 656/2020; o que passar disso é prescrição médica.',
   '[{"fonte":"PALMERY M et al. Eur Rev Med Pharmacol Sci","ano":2013,"detalhe":"Anticoncepcional oral e necessidades nutricionais"},
     {"fonte":"SILVESTRIS E et al. Front Endocrinol","ano":2019,"detalhe":"Nutrição e fertilidade feminina"},
     {"fonte":"FEBRASGO — Manual de reprodução humana","ano":2023,"detalhe":""},
     {"fonte":"Apostila Saúde da Mulher — Pós em Nutrição Clínica Funcional, Ortomolecular e Fitoterapia","ano":2024,"detalhe":"Aporte nutricional e fertilidade"}]'::jsonb),

  ('Climatério e menopausa — osso, massa magra e fogacho', 'am-climaterio',
   array['menopausa','climatério','creatina','cálcio','vitamina d','fogacho','amora','maca','adaptógeno'],
   'suplementacao', 'Saúde da mulher', 'Apostila da pós',
   'Climatério e menopausa: proteção óssea e muscular, fadiga, humor e sintomas vasomotores.',
   '[{"titulo":"Osso e massa magra","componentes":[
        {"ativo":"Cálcio","dose":"conforme ingestão","obs":""},
        {"ativo":"Vitamina D3","dose":"conforme sérico","obs":""},
        {"ativo":"Vitamina K","dose":"individualizar","obs":""},
        {"ativo":"Boro","dose":"individualizar","obs":""},
        {"ativo":"Magnésio","dose":"individualizar","obs":""},
        {"ativo":"Vitamina C","dose":"individualizar","obs":"síntese de colágeno"},
        {"ativo":"Colágeno","dose":"conforme produto","obs":""},
        {"ativo":"Creatina","dose":"3–5 g/dia","obs":"osteoblastos, força, controle glicêmico e cognição; segura e de baixo custo"}],
      "posologia":"Diário","duracao":"contínuo","via":"oral"},
     {"titulo":"Fadiga e energia","componentes":[
        {"ativo":"Complexo B","dose":"individualizar","obs":""},
        {"ativo":"Coenzima Q10","dose":"individualizar","obs":"energia mitocondrial"},
        {"ativo":"Rhodiola rosea (raiz, ESP 5% rosavinas)","dose":"100–300 mg","obs":"adaptógeno"},
        {"ativo":"Ashwagandha (Withania somnifera, raiz)","dose":"300–500 mg","obs":"adaptógeno"},
        {"ativo":"Alcaçuz chinês (Glycyrrhiza uralensis, raiz)","dose":"100–450 mg","obs":"adaptógeno — ver Interações"}],
      "posologia":"Pela manhã","duracao":"reavaliar em 3 meses","via":"oral"},
     {"titulo":"Fogachos e queixas do climatério","componentes":[
        {"ativo":"Glycine max (soja)","dose":"40–60 mg","obs":"fitoestrógeno"},
        {"ativo":"Morus nigra (amora)","dose":"tintura 10–20 ml/dia, em 2–3 tomadas","obs":""},
        {"ativo":"Lepidium meyenii (maca peruana)","dose":"100–500 mg","obs":"libido e energia"},
        {"ativo":"Vitex agnus-castus (agnocasto)","dose":"tintura 20–40 ml/dia","obs":""}],
      "posologia":"Conforme o fitoterápico","duracao":"reavaliar em 3 meses","via":"oral"},
     {"titulo":"Ansiedade e humor","componentes":[
        {"ativo":"L-triptofano","dose":"50–150 mg","obs":"mesma lógica da SPM — a oscilação de neurotransmissores é parecida"},
        {"ativo":"Vitamina B6","dose":"40–100 mg/dia","obs":""},
        {"ativo":"Cálcio","dose":"conforme ingestão","obs":""},
        {"ativo":"Magnésio","dose":"200 mg/dia","obs":""}],
      "posologia":"Conforme o sintoma","duracao":"reavaliar","via":"oral"},
     {"titulo":"Antioxidantes de base","componentes":[
        {"ativo":"Vitamina C, betacaroteno, selênio, zinco e vitamina E","dose":"priorizar via alimentar","obs":""},
        {"ativo":"Resveratrol, catequinas e cúrcuma longa","dose":"individualizar","obs":"o envelhecimento em si é uma condição inflamatória"}],
      "posologia":"Diário","duracao":"contínuo","via":"oral"}]'::jsonb,
   'A base é o padrão mediterrâneo com treino de força — a suplementação sozinha não segura massa magra nem osso. Evitar cafeína, refrigerante, dieta hiperproteica e álcool, todos ligados a maior perda óssea. Hidratação de 33 ml/kg/dia e sal próximo de 5 g/dia.',
   'Alcaçuz em uso prolongado eleva a pressão e reduz potássio — cuidado em hipertensa. Vitex interfere em contraceptivo e agonistas dopaminérgicos. Fitoestrógenos: avaliar histórico de câncer hormônio-dependente e uso de tamoxifeno. Creatina: garantir hidratação.',
   'Terapia hormonal é decisão médica — apresentar como opção a discutir com o ginecologista, nunca desestimular. Sangramento após 12 meses de amenorreia: investigação imediata. Osteoporose diagnosticada, fratura por fragilidade ou hipertensão não controlada: médico.',
   'Fitoestrógeno não é reposição hormonal e não pode ser apresentado como equivalente. Doses da apostila da pós — individualizar. Prescrição de fitoterápicos conforme Res. CFN 556/2015.',
   '[{"fonte":"Apostila Saúde da Mulher — Pós em Nutrição Clínica Funcional, Ortomolecular e Fitoterapia","ano":2024,"detalhe":"Nutrientes e alimentos na menopausa; fitoterápicos para fogachos; creatina e menopausa"},
     {"fonte":"FERNANDES CE, POMPEI LM. Endocrinologia feminina. Manole","ano":2016,"detalhe":""},
     {"fonte":"VITOLO MR. Nutrição da gestação ao envelhecimento","ano":2014,"detalhe":""}]'::jsonb);

  insert into public.ic_formulacoes
    (nutricionista_id, nome, slug, sinonimos, categoria, eixo, grupo, indicacao,
     formulas, observacoes, interacoes, quando_encaminhar, atencao, referencias)
  select v_ana, nome, slug, sinonimos, categoria, eixo, grupo, indicacao,
         formulas, observacoes, interacoes, quando_encaminhar, atencao, referencias
    from _f
  on conflict (nutricionista_id, slug) where nutricionista_id is not null
  do update set
    nome = excluded.nome, sinonimos = excluded.sinonimos, categoria = excluded.categoria,
    eixo = excluded.eixo, grupo = excluded.grupo, indicacao = excluded.indicacao,
    formulas = excluded.formulas, observacoes = excluded.observacoes,
    interacoes = excluded.interacoes, quando_encaminhar = excluded.quando_encaminhar,
    atencao = excluded.atencao, referencias = excluded.referencias,
    ativo = true, updated_at = now();

  raise notice 'Formulações de saúde da mulher gravadas para %', v_ana;
end $$;

notify pgrst, 'reload schema';
