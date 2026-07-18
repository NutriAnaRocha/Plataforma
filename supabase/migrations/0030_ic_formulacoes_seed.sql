-- ============================================================
--  Plataforma Nutri — Migração 0030
--  Semente do Banco de Formulações (conteúdo AUTORAL).
--
--  Base curada: nutricionista_id = NULL. Faixas de dose de APOIO à
--  decisão, com referência institucional e limite de escopo por item.
--  Reexecutável (upsert por slug base).
-- ============================================================

insert into public.ic_formulacoes
  (nutricionista_id, nome, slug, sinonimos, categoria, eixo, grupo, indicacao, formulas, observacoes, interacoes, quando_encaminhar, atencao, referencias)
values
(null, 'Ansiedade leve — fitoterápico', 'form-ansiedade', array['ansiedade','passiflora','melissa'], 'fitoterapia', 'Saúde mental', 'Fitoterapia',
 'Apoio à ansiedade leve, associado a mudanças de estilo de vida.',
 '[{"titulo":"Passiflora + Melissa","componentes":[{"ativo":"Passiflora incarnata (extrato seco padronizado)","dose":"200–400 mg/dia","obs":""},{"ativo":"Melissa officinalis (extrato seco)","dose":"300–600 mg/dia","obs":""}],"posologia":"1–2 tomadas ao dia, com reforço à noite","duracao":"4–8 semanas, reavaliar","via":"oral"}]'::jsonb,
 'Combinar com higiene do sono, atividade física e redução de cafeína.',
 'Pode potencializar sedativos e ansiolíticos; cautela com álcool e ao dirigir.',
 'Ansiedade intensa, ataques de pânico ou prejuízo funcional: encaminhar a médico/psicólogo.',
 'Faixas de apoio — individualizar. Prescrição de fitoterápicos dentro do escopo do CFN.',
 '[{"fonte":"ANVISA — Formulário de Fitoterápicos da Farmacopeia Brasileira","ano":2021,"detalhe":"Passiflora e Melissa"},{"fonte":"Cochrane","ano":2007,"detalhe":"Passiflora para ansiedade — evidência limitada"}]'::jsonb),

(null, 'Insônia — fitoterápico', 'form-insonia', array['insonia','sono','valeriana'], 'fitoterapia', 'Saúde mental', 'Fitoterapia',
 'Dificuldade para iniciar o sono, quadro leve e recente.',
 '[{"titulo":"Valeriana","componentes":[{"ativo":"Valeriana officinalis (extrato seco)","dose":"300–600 mg","obs":"30–60 min antes de deitar"}],"posologia":"1x à noite","duracao":"2–4 semanas","via":"oral"}]'::jsonb,
 'Reforçar higiene do sono; evitar cafeína e telas à noite.',
 'Potencializa sedativos; evitar com álcool.',
 'Insônia crônica, suspeita de apneia ou sonolência diurna importante: avaliação médica.',
 'Faixas de apoio — individualizar. Dentro do escopo do CFN.',
 '[{"fonte":"ANVISA — Formulário de Fitoterápicos","ano":2021,"detalhe":"Valeriana officinalis"}]'::jsonb),

(null, 'TPM — nutricional e fitoterápico', 'form-tpm', array['tpm','pre-menstrual','magnesio','b6','vitex'], 'suplementacao', 'Saúde da mulher', 'Ciclo',
 'Sintomas de tensão pré-menstrual (humor, inchaço, cólica).',
 '[{"titulo":"Nutricional","componentes":[{"ativo":"Magnésio (glicinato ou dimalato)","dose":"200–300 mg/dia","obs":"à noite"},{"ativo":"Vitamina B6 (piridoxina)","dose":"50–100 mg/dia","obs":"não exceder de forma crônica"},{"ativo":"Cálcio","dose":"1000 mg/dia (dieta + suplemento se preciso)","obs":""}],"posologia":"Contínuo ou na 2ª fase do ciclo","duracao":"2–3 ciclos, reavaliar","via":"oral"},{"titulo":"Fitoterápico — Vitex","componentes":[{"ativo":"Vitex agnus-castus (extrato seco padronizado)","dose":"20–40 mg/dia","obs":"pela manhã"}],"posologia":"1x ao dia","duracao":"3 ciclos","via":"oral"}]'::jsonb,
 'Reduzir sal e ultraprocessados na semana pré-menstrual; manter atividade física.',
 'Vitex pode interferir em contraceptivos hormonais e agonistas dopaminérgicos. B6 em dose alta e prolongada: risco de neuropatia.',
 'Forma grave (TDPM) ou suspeita de outra causa hormonal: ginecologia.',
 'Faixas de apoio — individualizar. Não usar B6 em dose alta por tempo prolongado.',
 '[{"fonte":"ACOG (American College of Obstetricians and Gynecologists)","ano":2023,"detalhe":"Manejo da SPM/TDPM"},{"fonte":"Cochrane","ano":2017,"detalhe":"Magnésio e B6 na SPM"}]'::jsonb),

(null, 'Climatério — fitoterápico', 'form-menopausa', array['menopausa','climaterio','fogacho','cimicifuga'], 'fitoterapia', 'Saúde da mulher', 'Ciclo',
 'Fogachos e sintomas do climatério (apoio).',
 '[{"titulo":"Cimicifuga","componentes":[{"ativo":"Cimicifuga racemosa (extrato seco padronizado)","dose":"20–40 mg/dia","obs":"evidência controversa"}],"posologia":"1x ao dia","duracao":"até 6 meses, reavaliar","via":"oral"}]'::jsonb,
 'Base do cuidado: proteína adequada, cálcio, vitamina D e treino de força.',
 'Cautela em hepatopatas; relatos raros de hepatotoxicidade.',
 'Sangramento pós-menopausa ou sintomas intensos: ginecologia (avaliar terapia hormonal).',
 'Eficácia da Cimicifuga é debatida — apresentar como opção, não como certeza.',
 '[{"fonte":"The North American Menopause Society","ano":2022,"detalhe":"Terapias não hormonais para fogachos"}]'::jsonb),

(null, 'Constipação — fibra', 'form-constipacao', array['constipacao','intestino preso','psyllium','fibra'], 'suplementacao', 'Saúde intestinal', 'Funcional',
 'Constipação funcional, como apoio à dieta.',
 '[{"titulo":"Psyllium","componentes":[{"ativo":"Psyllium (Plantago ovata)","dose":"5–10 g/dia","obs":"sempre com bastante água"}],"posologia":"1–2x ao dia, aumentar gradualmente","duracao":"contínuo","via":"oral"}]'::jsonb,
 'Aumentar fibras da dieta e hidratação em paralelo; atividade física ajuda.',
 'Distanciar de medicamentos (interfere na absorção). Sem água suficiente há risco de obstrução.',
 'Mudança súbita do hábito intestinal, sangue nas fezes ou emagrecimento: investigar.',
 'Faixas de apoio — individualizar.',
 '[{"fonte":"World Gastroenterology Organisation","ano":2022,"detalhe":"Fibras na constipação"}]'::jsonb),

(null, 'Gastrite e digestão — fitoterápico', 'form-gastrite', array['gastrite','digestao','espinheira-santa','camomila'], 'fitoterapia', 'Saúde intestinal', 'Funcional',
 'Desconforto gástrico e dispepsia leve (apoio).',
 '[{"titulo":"Espinheira-santa + camomila","componentes":[{"ativo":"Espinheira-santa (Maytenus ilicifolia, extrato seco)","dose":"380–425 mg","obs":"3x ao dia, antes das refeições"},{"ativo":"Camomila (Matricaria chamomilla) — infusão","dose":"1 xícara","obs":"após as refeições"}],"posologia":"Ver componentes","duracao":"2–4 semanas","via":"oral"}]'::jsonb,
 'Associar às orientações de hábito (porções menores, não deitar após comer).',
 'Espinheira-santa: cautela na gravidez/amamentação.',
 'Dor intensa, sinais de alarme ou suspeita de H. pylori: conduta médica.',
 'Faixas de apoio — individualizar. Dentro do escopo do CFN.',
 '[{"fonte":"ANVISA — Formulário de Fitoterápicos","ano":2021,"detalhe":"Maytenus ilicifolia"}]'::jsonb),

(null, 'Resistência à insulina / SOP — inositóis', 'form-sop-inositol', array['sop','resistencia insulina','inositol','mio-inositol'], 'suplementacao', 'Saúde da mulher', 'Metabolismo',
 'Apoio à sensibilidade à insulina na SOP.',
 '[{"titulo":"Inositóis","componentes":[{"ativo":"Mio-inositol","dose":"2 g, 2x ao dia (4 g/dia)","obs":""},{"ativo":"D-chiro-inositol","dose":"proporção 40:1 com o mio-inositol","obs":""},{"ativo":"Magnésio","dose":"200–300 mg/dia","obs":"opcional"}],"posologia":"2 tomadas ao dia","duracao":"3–6 meses, reavaliar","via":"oral"}]'::jsonb,
 'Combinar com dieta de baixo índice glicêmico, perda de peso quando indicada e atividade física.',
 'Geralmente bem tolerado; doses altas podem causar desconforto gastrointestinal.',
 'Diagnóstico e manejo hormonal da SOP: médico/endocrinologista.',
 'Faixas de apoio — individualizar.',
 '[{"fonte":"Endocrine Society","ano":2023,"detalhe":"Manejo da SOP"},{"fonte":"Cochrane","ano":2018,"detalhe":"Inositol na SOP"}]'::jsonb),

(null, 'Suporte ao humor — nutricional', 'form-humor', array['humor','depressao','omega-3','epa'], 'suplementacao', 'Saúde mental', 'Nutrientes',
 'Adjuvante nutricional ao tratamento do humor.',
 '[{"titulo":"Nutricional","componentes":[{"ativo":"Ômega-3 (EPA predominante)","dose":"1–2 g de EPA+DHA/dia","obs":"proporção com mais EPA"},{"ativo":"Magnésio","dose":"200–400 mg/dia","obs":""},{"ativo":"Vitamina D","dose":"conforme dosagem sérica","obs":"corrigir deficiência"}],"posologia":"Com as refeições","duracao":"reavaliar em 8–12 semanas","via":"oral"}]'::jsonb,
 'É adjuvante — não substitui o tratamento de saúde mental.',
 'Ômega-3 em dose alta: cautela com anticoagulantes.',
 'Depressão moderada/grave ou risco: equipe de saúde mental, com prioridade.',
 'Faixas de apoio — individualizar. Vitamina D idealmente guiada por exame.',
 '[{"fonte":"World Federation of Societies of Biological Psychiatry","ano":2015,"detalhe":"Ômega-3 como adjuvante no humor"}]'::jsonb),

(null, 'Saúde intestinal — mucosa e microbiota', 'form-intestino', array['intestino','probiotico','glutamina','microbiota'], 'suplementacao', 'Saúde intestinal', 'Funcional',
 'Apoio à mucosa e à microbiota intestinal.',
 '[{"titulo":"Suporte","componentes":[{"ativo":"Probiótico multi-cepas","dose":"conforme rótulo (ex.: 10^9–10^10 UFC)","obs":""},{"ativo":"L-glutamina","dose":"5 g/dia","obs":"suporte de mucosa"},{"ativo":"Prebióticos (FOS/inulina)","dose":"iniciar baixo","obs":"aumentar conforme tolerância"}],"posologia":"1x ao dia","duracao":"4–8 semanas","via":"oral"}]'::jsonb,
 'Personalizar conforme o quadro; nem todo intestino se beneficia de prebiótico.',
 'Em SII, prebióticos fermentáveis podem piorar gases — introduzir com cautela.',
 'Sinais de alarme digestivos (sangue, emagrecimento, anemia): investigar.',
 'Faixas de apoio — individualizar.',
 '[{"fonte":"World Gastroenterology Organisation","ano":2023,"detalhe":"Probióticos e prebióticos"}]'::jsonb),

(null, 'Suporte imunológico — nutricional', 'form-imunidade', array['imunidade','vitamina d','zinco','vitamina c'], 'suplementacao', 'Imunidade', 'Nutrientes',
 'Suporte nutricional à imunidade, priorizando correção de deficiências.',
 '[{"titulo":"Nutricional","componentes":[{"ativo":"Vitamina D","dose":"conforme dosagem sérica","obs":"corrigir deficiência"},{"ativo":"Zinco","dose":"8–11 mg/dia (RDA); doses maiores só por curto período","obs":"não usar alto de forma crônica"},{"ativo":"Vitamina C","dose":"200 mg–1 g/dia","obs":""}],"posologia":"Com as refeições","duracao":"reavaliar","via":"oral"}]'::jsonb,
 'A base é alimentação variada, sono e atividade física; suplemento corrige lacunas.',
 'Zinco crônico em dose alta compete com o cobre. Vitamina C alta pode dar desconforto gastrointestinal.',
 'Infecções de repetição ou sinais sistêmicos: investigação médica.',
 'Faixas de apoio — individualizar; idealmente guiado por exames.',
 '[{"fonte":"Institute of Medicine (IOM)","ano":2011,"detalhe":"DRIs de zinco, vitamina C e vitamina D"}]'::jsonb)

on conflict (slug) where (nutricionista_id is null)
do update set
  nome = excluded.nome, sinonimos = excluded.sinonimos, categoria = excluded.categoria,
  eixo = excluded.eixo, grupo = excluded.grupo, indicacao = excluded.indicacao,
  formulas = excluded.formulas, observacoes = excluded.observacoes,
  interacoes = excluded.interacoes, quando_encaminhar = excluded.quando_encaminhar,
  atencao = excluded.atencao, referencias = excluded.referencias, updated_at = now();

notify pgrst, 'reload schema';
