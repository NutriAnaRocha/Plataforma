-- ============================================================
--  Plataforma Nutri — Migração 0082
--  Formulações dos materiais da Raiz Magistral, no acervo PESSOAL da Ana.
--
--  Não entram na base curada (nutricionista_id = null): são material de
--  terceiro (farmácia de manipulação), então ficam só no login dela,
--  editáveis e privados pela RLS já existente em ic_formulacoes.
--
--  Fonte: 5 materiais técnicos da Raiz Magistral —
--    Modulação da ansiedade; Suplementos para memória, foco e concentração;
--    Sono restaurador; Modulação hormonal feminina com fitoestrógenos;
--    Tratamento em cada fase do uso de análogos de GLP-1/GIP.
--
--  As doses são as sugestões do material do fabricante — apoio à decisão,
--  não protocolo fechado. Cada item traz limite de escopo (CFN) explícito.
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

  -- ==========================================================
  --  1) MODULAÇÃO DA ANSIEDADE
  -- ==========================================================
  ('Ansiedade mental — pensamentos acelerados', 'rm-ansiedade-mental',
   array['ansiedade','5-htp','saffrin','rhodiola','ansiless','zembrin','compulsão'],
   'magistral', 'Saúde mental', 'Raiz Magistral',
   'Ansiedade de padrão serotoninérgico: preocupação excessiva, humor deprimido, irritabilidade e compulsão alimentar.',
   '[
     {"titulo":"Fórmula Serenidade","componentes":[
        {"ativo":"5-HTP","dose":"100 mg","obs":"precursor direto da serotonina"},
        {"ativo":"Saffrin® (Crocus sativus)","dose":"30 mg","obs":"inibe recaptação de serotonina"},
        {"ativo":"Rhodiola rosea","dose":"250 mg","obs":"adaptógeno, modula o eixo HPA"},
        {"ativo":"Excipiente","dose":"qsp 1 cápsula","obs":""}],
      "posologia":"1 dose ao dia, pela manhã","duracao":"Fazer 30 doses","via":"oral"},
     {"titulo":"Cápsulas naturais redutoras da ansiedade","componentes":[
        {"ativo":"Ansiless® (Scutellaria lateriflora)","dose":"250 mg","obs":"flavonoides com ação em 5-HT7 e sítios benzodiazepínicos"},
        {"ativo":"Excipiente","dose":"qsp 1 cápsula","obs":""}],
      "posologia":"1 dose 2x ao dia, pela manhã","duracao":"Fazer 60 doses","via":"oral"},
     {"titulo":"Compulsão alimentar associada à ansiedade","componentes":[
        {"ativo":"Zembrin® (Sceletium tortuosum)","dose":"25 mg","obs":"inibição seletiva da fosfodiesterase-4"},
        {"ativo":"Excipiente","dose":"qsp 1 cápsula","obs":""}],
      "posologia":"1 dose ao dia, pela manhã","duracao":"Fazer 30 doses","via":"oral"}
   ]'::jsonb,
   'As três são alternativas entre si (OU), escolhidas pelo padrão predominante: Serenidade para o quadro serotoninérgico clássico, Ansiless para ansiedade difusa, Zembrin quando a compulsão alimentar domina.',
   '5-HTP não deve ser associado a ISRS, IMAO, tramadol ou triptanos — risco de síndrome serotoninérgica. Rhodiola pode interferir em antidepressivos e ser estimulante à noite. Zembrin: evitar com ISRS.',
   'Ansiedade intensa, crises de pânico, ideação suicida ou prejuízo funcional: encaminhar a psiquiatria/psicologia. Paciente em uso de psicotrópico: alinhar com o médico antes de qualquer associação.',
   'Doses do material do fabricante — individualizar. Fitoterápicos e nutracêuticos dentro do escopo do CFN (Res. 556/2015 para fitoterapia, 656/2020 para suplementação).',
   '[{"fonte":"Li et al., Nutrients","ano":2025,"detalhe":"5-HTP 100 mg/dia por 12 semanas: aumento de serotonina sérica e melhora de humor e ansiedade"},
     {"fonte":"Ensaio randomizado duplo-cego — Crocus sativus","ano":null,"detalhe":"30 mg/dia com eficácia semelhante à imipramina 100 mg/dia em 6 semanas, menos efeitos adversos"},
     {"fonte":"Estudo clínico — Rhodiola rosea","ano":null,"detalhe":"200 mg 2x/dia por 4 semanas: redução de estresse e fadiga já nos 3 primeiros dias"},
     {"fonte":"Raiz Magistral — Modulação da ansiedade","ano":2025,"detalhe":"material técnico do fabricante"}]'::jsonb),

  ('Ansiedade física — tensão corporal', 'rm-ansiedade-fisica',
   array['ansiedade','gaba','teanina','magnésio','tensão muscular','relax'],
   'magistral', 'Saúde mental', 'Raiz Magistral',
   'Ansiedade com predominância somática: tensão muscular, inquietação e hiperexcitabilidade neuronal.',
   '[{"titulo":"Cápsulas Relax","componentes":[
        {"ativo":"GABA","dose":"300 mg","obs":"reduz a excitabilidade neuronal"},
        {"ativo":"Magnésio inositol","dose":"200 mg","obs":""},
        {"ativo":"L-teanina","dose":"100 mg","obs":"aumenta a atividade GABAérgica"},
        {"ativo":"Excipiente","dose":"qsp 1 cápsula","obs":""}],
      "posologia":"1 dose ao dia","duracao":"Fazer 30 doses","via":"oral"}]'::jsonb,
   'Combinar com respiração diafragmática, atividade física e redução de cafeína.',
   'Pode somar-se ao efeito de sedativos e ansiolíticos. Magnésio em dose alta: efeito laxativo; ajustar em doença renal.',
   'Tensão com dor crônica, tremor ou sintomas neurológicos: avaliação médica.',
   'Doses do material do fabricante — individualizar. Dentro do escopo do CFN.',
   '[{"fonte":"Ensaio randomizado triplo-cego — L-teanina","ano":null,"detalhe":"200 mg reduziram ansiedade e cortisol salivar após indução de estresse"},
     {"fonte":"Revisões clínicas — magnésio","ano":null,"detalhe":"redução de sintomas de ansiedade leve e melhora do sono, sobretudo em níveis baixos do mineral"},
     {"fonte":"Raiz Magistral — Modulação da ansiedade","ano":2025,"detalhe":"material técnico do fabricante"}]'::jsonb),

  ('Ansiedade por estresse crônico — eixo HPA', 'rm-ansiedade-estresse-cronico',
   array['estresse','cortisol','ashwagandha','fosfatidilserina','serenzo','fadiga adrenal'],
   'magistral', 'Saúde mental', 'Raiz Magistral',
   'Ansiedade ligada à hiperativação do eixo hipotálamo-hipófise-adrenal: estresse crônico, fadiga e baixa resiliência.',
   '[{"titulo":"Cápsulas Stress Control","componentes":[
        {"ativo":"Ashwagandha (Withania somnifera)","dose":"200 mg","obs":"adaptógeno, auxilia na redução do cortisol"},
        {"ativo":"Fosfatidilserina","dose":"100 mg","obs":"modula a resposta ao estresse"},
        {"ativo":"Serenzo® (Citrus sinensis)","dose":"200 mg","obs":""},
        {"ativo":"Excipiente","dose":"qsp 1 cápsula","obs":""}],
      "posologia":"1 dose 2x ao dia","duracao":"Fazer 60 doses","via":"oral"}]'::jsonb,
   'Reforçar sono, pausas e carga de treino compatível — adaptógeno não substitui recuperação.',
   'Ashwagandha: evitar na gestação e lactação; cautela em hipertireoidismo e doenças autoimunes; relatos raros de hepatotoxicidade. Pode potencializar sedativos e alterar dose de levotiroxina.',
   'Fadiga persistente, perda de peso ou alteração de tireoide/cortisol suspeitas: investigação médica antes de adaptógeno.',
   'Doses do material do fabricante — individualizar. Dentro do escopo do CFN.',
   '[{"fonte":"Raiz Magistral — Modulação da ansiedade","ano":2025,"detalhe":"material técnico do fabricante"}]'::jsonb),

  ('Ansiedade com insônia — Neurosleep', 'rm-ansiedade-insonia-neurosleep',
   array['ansiedade','insônia','passiflora','mulungu','melissa','neurosleep'],
   'magistral', 'Saúde mental', 'Raiz Magistral',
   'Ansiedade noturna: mente hiperativa à noite, dificuldade de iniciar o sono e despertares.',
   '[{"titulo":"Neurosleep","componentes":[
        {"ativo":"Passiflora incarnata","dose":"200 mg","obs":"ansiolítico natural, atua em receptores GABA"},
        {"ativo":"Mulungu (Erythrina spp.)","dose":"200 mg","obs":"ansiolítico e sedativo suave"},
        {"ativo":"L-teanina","dose":"150 mg","obs":"promove ondas alfa sem sedação"},
        {"ativo":"Magnésio inositol","dose":"150 mg","obs":""},
        {"ativo":"Melissa officinalis","dose":"200 mg","obs":""},
        {"ativo":"Melatonina (opcional)","dose":"0,21 mg","obs":"opcional, conforme o material"},
        {"ativo":"Excipiente","dose":"qsp 1 cápsula","obs":""}],
      "posologia":"1 dose ao dia, 30 minutos antes de deitar","duracao":"Fazer 30 doses","via":"oral"}]'::jsonb,
   'Mesma fórmula aparece no material de sono como "Indução natural do sono com foco em ansiedade". Associar à higiene do sono: horário fixo, sem telas e sem cafeína à tarde.',
   'Soma-se a sedativos, ansiolíticos e álcool. Evitar dirigir logo após a dose.',
   'Insônia crônica, ronco com pausas respiratórias ou sonolência diurna importante: avaliação médica (polissonografia).',
   'Melatonina em suplemento alimentar é limitada a 0,21 mg/dia (Anvisa) e permitida para maiores de 19 anos. Doses do material do fabricante — individualizar.',
   '[{"fonte":"Raiz Magistral — Modulação da ansiedade / Sono restaurador","ano":2025,"detalhe":"material técnico do fabricante"}]'::jsonb),

  -- ==========================================================
  --  2) MEMÓRIA, FOCO E CONCENTRAÇÃO
  -- ==========================================================
  ('Memória, foco e concentração', 'rm-memoria-foco',
   array['memória','foco','cognição','ginkgo','teacrine','panax','cognimag'],
   'magistral', 'Saúde mental', 'Raiz Magistral',
   'Melhora do desempenho mental, da memória, da concentração e do aprendizado.',
   '[{"titulo":"Suporte cognitivo","componentes":[
        {"ativo":"Ginkgo biloba","dose":"100 mg","obs":"aumenta acetilcolina, dopamina e GABA"},
        {"ativo":"Teacrine®","dose":"40 mg","obs":""},
        {"ativo":"Panax ginseng","dose":"250 mg","obs":""},
        {"ativo":"Excipiente","dose":"qsp 1 cápsula","obs":""}],
      "posologia":"1 cápsula 2x ao dia, manhã e tarde","duracao":"Fazer 60 doses","via":"oral"},
     {"titulo":"Cognimag","componentes":[
        {"ativo":"Rhodiola rosea","dose":"100 mg","obs":"adaptógeno"},
        {"ativo":"L-teanina","dose":"200 mg","obs":"relaxante, melhora concentração"},
        {"ativo":"Fosfatidilcolina","dose":"100 mg","obs":"fosfolipídeo de membrana"},
        {"ativo":"Magnésio","dose":"200 mg","obs":"combate a fadiga neuromuscular"},
        {"ativo":"Excipiente","dose":"qsp 1 cápsula","obs":""}],
      "posologia":"1 cápsula 2x ao dia, manhã e tarde","duracao":"Fazer 60 doses","via":"oral"}]'::jsonb,
   'Duas opções para o mesmo objetivo: Suporte cognitivo é mais estimulante (Teacrine/ginseng), Cognimag é calmo-focado — melhor para quem já está tenso.',
   'Ginkgo biloba tem efeito antiagregante: suspender 7–14 dias antes de cirurgia e evitar com anticoagulantes/antiagregantes. Teacrine e ginseng podem atrapalhar o sono se usados à tarde.',
   'Queixa de memória com perda funcional, desorientação ou piora rápida: avaliação neurológica.',
   'Doses do material do fabricante — individualizar. Dentro do escopo do CFN.',
   '[{"fonte":"Ensaio clínico — Ginkgo biloba + teacrina","ano":null,"detalhe":"240 mg/dia de Ginkgo + 40 mg de teacrina: aumento da atividade alfa no EEG em demência senil"},
     {"fonte":"Olsson EM, von Schéele B, Panossian AG. Planta Med","ano":2009,"detalhe":"extrato SHR-5 de Rhodiola rosea na fadiga relacionada ao estresse"},
     {"fonte":"Raiz Magistral — Suplementos para memória","ano":2025,"detalhe":"material técnico do fabricante"}]'::jsonb),

  ('Foco e desempenho nos estudos', 'rm-foco-estudos',
   array['foco','estudos','produtividade','rhodiola','ashwagandha','taurina'],
   'magistral', 'Saúde mental', 'Raiz Magistral',
   'Aumento do foco e do desempenho em estudo/trabalho, com controle do estresse.',
   '[{"titulo":"Foco e desempenho","componentes":[
        {"ativo":"Rhodiola rosea","dose":"250 mg","obs":"adaptógeno"},
        {"ativo":"Ashwagandha","dose":"250 mg","obs":"cognição, memória e energia"},
        {"ativo":"Vitamina C","dose":"150 mg","obs":""},
        {"ativo":"Excipiente","dose":"qsp 1 cápsula","obs":""}],
      "posologia":"1 cápsula ao dia, pela manhã","duracao":"Fazer 30 doses","via":"oral"},
     {"titulo":"Relaxamento e foco (sublingual)","componentes":[
        {"ativo":"Taurina","dose":"75 mg","obs":"estrutura semelhante ao GABA"},
        {"ativo":"Coenzima Q10","dose":"50 mg","obs":""},
        {"ativo":"Excipiente","dose":"qsp 1 pastilha sublingual","obs":""}],
      "posologia":"1 pastilha sob a língua 2x ao dia, manhã e tarde","duracao":"Fazer 60 pastilhas","via":"sublingual"}]'::jsonb,
   'A primeira é diurna e adaptogênica; a sublingual serve como apoio pontual em dias de carga alta.',
   'Ashwagandha: evitar na gestação/lactação, cautela em autoimunes e tireoidopatias. Rhodiola pode causar insônia se tomada tarde.',
   'Suspeita de TDAH, depressão ou burnout: avaliação médica/psicológica — suplementação não substitui o diagnóstico.',
   'Doses do material do fabricante — individualizar. Dentro do escopo do CFN.',
   '[{"fonte":"Kelly GS. Altern Med Rev","ano":2001,"detalhe":"Rhodiola rosea como adaptógeno"},
     {"fonte":"Bhattacharya SK et al. Indian J Exp Biol","ano":1997,"detalhe":"atividade antioxidante dos glicowitanolídeos de Withania somnifera"},
     {"fonte":"Raiz Magistral — Suplementos para memória","ano":2025,"detalhe":"material técnico do fabricante"}]'::jsonb),

  ('Neuroproteção e biogênese mitocondrial', 'rm-neuroprotecao-mitocondrial',
   array['neuroproteção','mitocôndria','creatina','resveratrol','coq10','ômega-3','dha'],
   'magistral', 'Saúde mental', 'Raiz Magistral',
   'Suporte energético neuronal e neuroproteção em quadros de alta demanda cognitiva.',
   '[{"titulo":"Sachê neuroproteção","componentes":[
        {"ativo":"Creatina","dose":"2 g","obs":""},
        {"ativo":"Taurina","dose":"500 mg","obs":""},
        {"ativo":"Resveratrol","dose":"100 mg","obs":""},
        {"ativo":"Coenzima Q10 (ou sulbutiamina)","dose":"100 mg","obs":""},
        {"ativo":"Tiamina","dose":"100 mg","obs":""},
        {"ativo":"Vitamina B1","dose":"20 mg","obs":""},
        {"ativo":"Vitamina C","dose":"200 mg","obs":""},
        {"ativo":"Ácido fólico","dose":"5 mg","obs":"dose alta — ver Atenção"},
        {"ativo":"Excipiente","dose":"qsp 1 sachê","obs":""}],
      "posologia":"1 sachê ao dia, pela manhã","duracao":"Fazer 30 sachês","via":"oral"},
     {"titulo":"Ômega-3 (associado)","componentes":[
        {"ativo":"Ômega-3 (EPA/DHA)","dose":"conforme necessidade","obs":"DHA com evidência em memória e desenvolvimento cognitivo"}],
      "posologia":"Conforme orientação","duracao":"","via":"oral"}]'::jsonb,
   'A creatina em dose de 2 g é abaixo da dose ergogênica usual (3–5 g/dia); avaliar se o objetivo é também muscular.',
   'Ácido fólico 5 mg é dose de medicamento: pode mascarar deficiência de B12 e não é dose de suplemento alimentar. Resveratrol tem efeito antiagregante. Creatina: garantir hidratação.',
   'Alteração cognitiva progressiva ou deficiência de B12 suspeita: investigação médica.',
   'Reduzir o ácido fólico para faixa de suplemento (até 1 mg) ou pedir prescrição médica para os 5 mg — fora dos limites da Res. CFN 656/2020. Demais doses do material do fabricante.',
   '[{"fonte":"Raiz Magistral — Suplementos para memória","ano":2025,"detalhe":"material técnico do fabricante"}]'::jsonb),

  -- ==========================================================
  --  3) SONO RESTAURADOR
  -- ==========================================================
  ('Indução do sono com foco em redução do estresse', 'rm-sono-inducao-estresse',
   array['sono','insônia','inositol','glicina','triptofano','fosfatidilserina'],
   'magistral', 'Saúde mental', 'Raiz Magistral',
   'Sono fragmentado, estresse noturno e baixa recuperação mental ao despertar.',
   '[{"titulo":"Sachê indução do sono","componentes":[
        {"ativo":"Inositol","dose":"2000 mg","obs":"melhora ansiedade leve e sono REM"},
        {"ativo":"Glicina","dose":"1000 mg","obs":"favorece sono profundo e relaxamento"},
        {"ativo":"L-teanina","dose":"100 mg","obs":"reduz atividade mental noturna sem sedar"},
        {"ativo":"Triptofano","dose":"200 mg","obs":"indução e manutenção do sono"},
        {"ativo":"Fosfatidilserina","dose":"100 mg","obs":"reduz cortisol"},
        {"ativo":"Excipiente","dose":"qsp 1 sachê","obs":""}],
      "posologia":"1 dose ao dia, 30 minutos antes de deitar","duracao":"Fazer 30 doses","via":"oral"}]'::jsonb,
   'Boa opção quando o problema não é adormecer, e sim acordar cansado. Associar à higiene do sono.',
   'Triptofano: não associar a ISRS/IMAO sem alinhamento médico (risco serotoninérgico). Inositol em dose alta pode dar desconforto gastrointestinal.',
   'Insônia crônica ou suspeita de apneia do sono: avaliação médica.',
   'Doses do material do fabricante — individualizar. Dentro do escopo do CFN.',
   '[{"fonte":"Estudos clínicos com glicina pré-sono","ano":null,"detalhe":"melhora da qualidade subjetiva e da eficiência do sono"},
     {"fonte":"Raiz Magistral — Sono restaurador","ano":2025,"detalhe":"material técnico do fabricante"}]'::jsonb),

  ('Sono reparador — arquitetura e sono profundo', 'rm-sono-reparador',
   array['sono profundo','magnésio treonato','pqq','ashwagandha','melatonina','herbatonin'],
   'magistral', 'Saúde mental', 'Raiz Magistral',
   'Sono não reparador: má qualidade das fases profunda e REM, com impacto em GH, cortisol e recuperação.',
   '[{"titulo":"Sono reparador","componentes":[
        {"ativo":"Melatonina (ou Herbatonin® 50 mg — melatonina vegetal)","dose":"0,21 mg","obs":""},
        {"ativo":"Magnésio treonato","dose":"200 mg","obs":"atravessa a barreira hematoencefálica"},
        {"ativo":"PQQ (pirroloquinolina quinona)","dose":"20 mg","obs":""},
        {"ativo":"Ashwagandha","dose":"300 mg","obs":""},
        {"ativo":"Excipiente","dose":"qsp 1 cápsula","obs":""}],
      "posologia":"1 dose ao dia, 30 minutos antes de deitar","duracao":"Fazer 30 doses","via":"oral"},
     {"titulo":"Potencializador — ProSleep™ (associável)","componentes":[
        {"ativo":"ProSleep™","dose":"130–260 mg/dia","obs":"1 hora antes de deitar; pode ser associado a qualquer fórmula deste material"}],
      "posologia":"1x à noite","duracao":"","via":"oral"}]'::jsonb,
   'O material posiciona o ProSleep™ como potencializador associável a qualquer uma das fórmulas de sono.',
   'Ashwagandha: evitar na gestação/lactação e cautela em autoimunes/tireoide. Melatonina pode somar-se a sedativos. Magnésio: ajustar em doença renal.',
   'Insônia crônica, apneia suspeita ou uso contínuo de hipnótico: avaliação médica.',
   'Melatonina como suplemento alimentar: limite de 0,21 mg/dia (Anvisa), maiores de 19 anos, contraindicada na gestação e lactação. Doses do material do fabricante.',
   '[{"fonte":"Estudo duplo-cego — magnésio L-treonato","ano":null,"detalhe":"80 adultos (35–55 anos), 21 dias: melhora do sono profundo e REM, humor e energia diurna"},
     {"fonte":"Revisão sistemática, PLOS ONE — ashwagandha","ano":null,"detalhe":"400 participantes: melhora da qualidade do sono e redução da latência"},
     {"fonte":"Estudo clínico japonês — PQQ","ano":null,"detalhe":"20 mg/dia por 8 semanas em 17 adultos: melhora de duração e latência do sono"},
     {"fonte":"Raiz Magistral — Sono restaurador","ano":2025,"detalhe":"material técnico do fabricante"}]'::jsonb),

  ('Apoio no desmame de benzodiazepínicos', 'rm-sono-desmame-benzo',
   array['benzodiazepínico','desmame','gaba','taurina','b6','magnésio treonato'],
   'magistral', 'Saúde mental', 'Raiz Magistral',
   'Suporte nutricional ao sono durante o desmame de benzodiazepínicos conduzido pelo médico.',
   '[{"titulo":"Fórmula desmame","componentes":[
        {"ativo":"L-teanina","dose":"150 mg","obs":""},
        {"ativo":"Magnésio treonato","dose":"150 mg","obs":""},
        {"ativo":"GABA","dose":"200 mg","obs":""},
        {"ativo":"Melatonina (ou Herbatonin® 50 mg)","dose":"0,21 mg","obs":""},
        {"ativo":"Vitamina B6","dose":"25 mg","obs":""},
        {"ativo":"Taurina","dose":"300 mg","obs":""},
        {"ativo":"Excipiente","dose":"qsp 1 cápsula","obs":""}],
      "posologia":"1 dose ao dia, 30 minutos antes de deitar","duracao":"Fazer 30 doses","via":"oral"}]'::jsonb,
   'A fórmula é apoio: quem reduz a dose do benzodiazepínico é o médico. Registrar no prontuário que a retirada está sendo conduzida por ele.',
   'Não interromper benzodiazepínico por conta própria — risco de rebote, convulsão e síndrome de abstinência. B6 em dose alta e prolongada: risco de neuropatia periférica.',
   'Desmame é conduta médica. Encaminhar e acompanhar em conjunto; abstinência com tremor, confusão ou convulsão é emergência.',
   'Fórmula de apoio, nunca substituto do fármaco nem da conduta médica. Doses do material do fabricante — individualizar.',
   '[{"fonte":"Raiz Magistral — Sono restaurador","ano":2025,"detalhe":"material técnico do fabricante"}]'::jsonb),

  -- ==========================================================
  --  4) MODULAÇÃO HORMONAL FEMININA COM FITOESTRÓGENOS
  -- ==========================================================
  ('Perimenopausa — preservação da saúde ovariana', 'rm-perimenopausa-ormona',
   array['perimenopausa','ormona','geranilgeraniol','tocotrienol','saúde ovariana'],
   'magistral', 'Saúde da mulher', 'Raiz Magistral',
   'Perimenopausa: transição hormonal a partir dos 40 anos, com objetivo de prolongar a saúde ovariana.',
   '[{"titulo":"Ormona®","componentes":[
        {"ativo":"Ormona® (geranilgeraniol, delta-tocotrienol, daidzeína, genisteína, cianidina e ácido gálico)","dose":"500 mg","obs":"anti-inflamatório, antioxidante e modulador hormonal"},
        {"ativo":"Excipiente","dose":"qsp 1 cápsula","obs":""}],
      "posologia":"1 dose ao dia","duracao":"Fazer 30 doses","via":"oral"}]'::jsonb,
   'O material sugere dosar FSH e LH regularmente a partir dos 40 anos e acompanhar sintomas — o pedido e a leitura desses exames devem respeitar o escopo profissional.',
   'Contém fitoestrógenos (daidzeína, genisteína): avaliar histórico de câncer hormônio-dependente e uso de tamoxifeno antes de indicar.',
   'História pessoal ou familiar de câncer de mama/endométrio, sangramento uterino anormal ou desejo de terapia hormonal: ginecologia.',
   'Suplementação dentro do escopo do CFN (Res. 656/2020). Fitoestrógeno não é reposição hormonal e não deve ser apresentado como tal.',
   '[{"fonte":"Raiz Magistral — Modulação hormonal feminina com fitoestrógenos","ano":2025,"detalhe":"material técnico do fabricante"}]'::jsonb),

  ('Menopausa com estresse e fadiga adrenal — Adaptogen Blend', 'rm-menopausa-adaptogenos',
   array['menopausa','adrenal','cortisol','rhodiola','panax ginseng','adaptógeno'],
   'magistral', 'Saúde da mulher', 'Raiz Magistral',
   'Mulher na menopausa com altos níveis de estresse (cortisol) ou fadiga adrenal.',
   '[{"titulo":"Adaptogen Blend","componentes":[
        {"ativo":"Rhodiola rosea","dose":"250 mg","obs":""},
        {"ativo":"Panax ginseng","dose":"150 mg","obs":""},
        {"ativo":"Excipiente","dose":"qsp 1 cápsula","obs":""}],
      "posologia":"1 dose 2x ao dia","duracao":"Fazer 60 doses","via":"oral"}]'::jsonb,
   'Racional do material: na mulher, ~95% da testosterona circulante vem da adrenal; modular as adrenais favorece a produção de testosterona e, via aromatase, de estrógenos na menopausa.',
   'Panax ginseng: cautela em hipertensão não controlada, insônia e uso de anticoagulantes/antidiabéticos. Rhodiola pode causar agitação se tomada à noite.',
   'Fadiga intensa, alteração de tireoide ou suspeita de insuficiência adrenal: investigação médica — "fadiga adrenal" não é diagnóstico reconhecido.',
   'O mecanismo adrenal→aromatase é o racional do fabricante, não consenso — apresentar como hipótese de trabalho. Doses do material.',
   '[{"fonte":"Raiz Magistral — Modulação hormonal feminina com fitoestrógenos","ano":2025,"detalhe":"material técnico do fabricante"}]'::jsonb),

  ('Composto otimizador hormonal feminino', 'rm-otimizador-hormonal-feminino',
   array['menopausa','fitoestrógeno','dim','isoflavona','cimicifuga','amora','pinus'],
   'magistral', 'Saúde da mulher', 'Raiz Magistral',
   'Modulação estrogênica na menopausa, com proteção vascular e do metabolismo dos estrogênios.',
   '[{"titulo":"Composto otimizador hormonal feminino","componentes":[
        {"ativo":"DIM (di-indolilmetano)","dose":"100 mg","obs":"protetor estrogênico, modula metabolismo hepático dos estrogênios"},
        {"ativo":"Isoflavona da soja","dose":"100 mg","obs":""},
        {"ativo":"Cimicifuga racemosa","dose":"150 mg","obs":""},
        {"ativo":"Pinus pinaster","dose":"50 mg","obs":"prevenção de problemas vasculares"},
        {"ativo":"Amora negra (Morus nigra)","dose":"125 mg","obs":""},
        {"ativo":"Excipiente","dose":"qsp 1 cápsula","obs":""}],
      "posologia":"1 dose 2x ao dia","duracao":"Fazer 60 doses","via":"oral"}]'::jsonb,
   'Faixas usuais do material para os isolados: isoflavonas 50–150 mg/dia (ou genisteína 15–60 mg); amora negra 350–750 mg/dia; Cimicifuga 25–150 mg/dia; Red clover 40–120 mg; Yam mexicano 250 mg até 3x/dia; Hypericum 200–300 mg 2x/dia; DIM 50–200 mg 1–2x/dia; Pinus pinaster 50–200 mg; Vitex 50–150 mg/dia.',
   'Cimicifuga: cautela em hepatopatas (relatos raros de hepatotoxicidade). Fitoestrógenos: avaliar câncer hormônio-dependente e uso de tamoxifeno. DIM pode alterar o metabolismo de fármacos via CYP.',
   'Sangramento pós-menopausa, nódulo mamário ou sintomas intensos que pedem terapia hormonal: ginecologia.',
   'Prescrição de fitoterápicos pelo nutricionista segue a Res. CFN 556/2015 (habilitação). Doses do material do fabricante — individualizar.',
   '[{"fonte":"Gynecological Endocrinology — Cimicifuga racemosa","ano":null,"detalhe":"40 mg/dia com resultados comparáveis a estradiol transdérmico em baixa dose para fogachos e sintomas vasomotores"},
     {"fonte":"Estudo clínico — Morus nigra","ano":null,"detalhe":"62 mulheres no climatério, 250 mg por 60 dias: melhora de fogacho, insônia, nervosismo e fadiga"},
     {"fonte":"Estudos com Trifolium pratense","ano":null,"detalhe":"80 mg/dia na pós-menopausa: redução de sintomas e efeito em citologia vaginal e triglicerídeos"},
     {"fonte":"Raiz Magistral — Modulação hormonal feminina com fitoestrógenos","ano":2025,"detalhe":"material técnico do fabricante"}]'::jsonb),

  ('Hormobalance Calm — menopausa com humor deprimido', 'rm-hormobalance-calm',
   array['menopausa','red clover','yam','hypericum','vitex','depressão','ansiedade'],
   'magistral', 'Saúde da mulher', 'Raiz Magistral',
   'Mulher na menopausa com sintomas depressivos e ansiedade importante, além dos sintomas vasomotores.',
   '[{"titulo":"Hormobalance Calm","componentes":[
        {"ativo":"Red clover (Trifolium pratense)","dose":"40 mg","obs":"extrato padronizado com 8% de isoflavonas"},
        {"ativo":"Yam mexicano (Dioscorea spp.)","dose":"200 mg","obs":"extrato padronizado com 6% de diosgenina"},
        {"ativo":"Hypericum perforatum","dose":"200 mg","obs":"extrato padronizado com 0,3% de hipericina"},
        {"ativo":"Vitex agnus-castus","dose":"25 mg","obs":"extrato padronizado com 0,5% de agnosídeos"},
        {"ativo":"Excipiente","dose":"qsp 1 cápsula","obs":""}],
      "posologia":"1 dose 2x ao dia","duracao":"Fazer 60 doses","via":"oral"}]'::jsonb,
   'Vitex também eleva progesterona, o que o material associa a melhor sono, neuroproteção e preservação de massa muscular.',
   'Hypericum é um dos fitoterápicos de maior risco de interação: induz CYP3A4 e reduz a eficácia de contraceptivos, anticoagulantes, imunossupressores, antirretrovirais e estatinas; com ISRS há risco de síndrome serotoninérgica; causa fotossensibilidade. Vitex interfere em contraceptivos e agonistas dopaminérgicos.',
   'Depressão moderada a grave, ideação suicida ou paciente em uso de antidepressivo: psiquiatria antes de qualquer associação.',
   'Checar a lista completa de medicamentos antes de indicar por causa do Hypericum. Prescrição de fitoterápicos conforme Res. CFN 556/2015.',
   '[{"fonte":"Estudos em peri e pós-menopausa — Hypericum perforatum","ano":null,"detalhe":"efeitos positivos sobre sintomas climatéricos físicos e psicossomáticos"},
     {"fonte":"Raiz Magistral — Modulação hormonal feminina com fitoestrógenos","ano":2025,"detalhe":"material técnico do fabricante"}]'::jsonb),

  -- ==========================================================
  --  5) ANÁLOGOS DE GLP-1/GIP — TRÊS FASES
  -- ==========================================================
  ('GLP-1 fase 1 — pré-utilização (preparo metabólico)', 'rm-glp1-fase1-pre',
   array['glp-1','tirzepatida','semaglutida','pré-tratamento','nac','quercetina','probiótico'],
   'magistral', 'Metabolismo', 'Raiz Magistral',
   'Preparo do terreno metabólico antes de iniciar análogo de GLP-1/GIP: reduzir inflamação, apoiar imunidade e melhorar flexibilidade metabólica.',
   '[{"titulo":"Fórmula Antioxidante Power","componentes":[
        {"ativo":"N-acetilcisteína (NAC)","dose":"300 mg","obs":"precursor da glutationa"},
        {"ativo":"Coenzima Q10 (Cava Q10)","dose":"20 mg","obs":"metabolismo energético e proteção mitocondrial"},
        {"ativo":"Quercetina","dose":"100 mg","obs":"antioxidante e modulador inflamatório"},
        {"ativo":"Resveratrol","dose":"100 mg","obs":"ativa SIRT1, melhora sensibilidade à insulina"},
        {"ativo":"Própolis verde (extrato seco)","dose":"100 mg","obs":"imunomodulador"},
        {"ativo":"Excipiente","dose":"qsp 1 cápsula","obs":""}],
      "posologia":"1 cápsula ao dia, pela manhã","duracao":"","via":"oral"},
     {"titulo":"Probióticos para equilíbrio da microbiota","componentes":[
        {"ativo":"Lactobacillus rhamnosus","dose":"1 bi UFC","obs":""},
        {"ativo":"Lactobacillus plantarum","dose":"1 bi UFC","obs":""},
        {"ativo":"Saccharomyces boulardii","dose":"1 bi UFC","obs":""},
        {"ativo":"Lactobacillus acidophilus","dose":"1 bi UFC","obs":""},
        {"ativo":"Streptococcus thermophilus","dose":"1 bi UFC","obs":""},
        {"ativo":"Excipiente","dose":"qsp 1 cápsula","obs":""}],
      "posologia":"1 dose ao dia, em jejum pela manhã ou à noite","duracao":"Fazer 30 doses","via":"oral"},
     {"titulo":"Ômega-3","componentes":[
        {"ativo":"Ômega-3","dose":"1000 mg por cápsula","obs":""},
        {"ativo":"Excipiente","dose":"qsp 1 cápsula","obs":""}],
      "posologia":"2 cápsulas ao dia, após o almoço","duracao":"","via":"oral"}]'::jsonb,
   'Pontos de ação da fase: estabilidade redox e bioenergética, inflamação subclínica, imunidade intestinal e sistêmica, flexibilidade metabólica.',
   'Própolis: contraindicado em alergia a produtos apícolas. Quercetina e resveratrol podem interferir em anticoagulantes e no metabolismo de fármacos (CYP). S. boulardii: cautela em imunossuprimidos e cateter venoso central.',
   'Indicação, escolha e dose do análogo de GLP-1/GIP são conduta médica. Náusea intensa, vômitos persistentes, dor abdominal forte ou suspeita de pancreatite: emergência.',
   'A nutrição atua no suporte ao tratamento — o fármaco é prescrito e ajustado pelo médico. Doses do material do fabricante.',
   '[{"fonte":"Raiz Magistral — Tratamento em cada fase do uso de análogos de GLP-1/GIP","ano":2025,"detalhe":"material técnico do fabricante"}]'::jsonb),

  ('GLP-1 fase 2 — em uso (massa magra e micronutrientes)', 'rm-glp1-fase2-uso',
   array['glp-1','sarcopenia','polivitamínico','eletrólitos','peptistrong','clonapure','akkermat'],
   'magistral', 'Metabolismo', 'Raiz Magistral',
   'Durante o uso do análogo: preservar massa magra, repor micronutrientes e eletrólitos e manter a saúde intestinal, minimizando náusea e perda muscular.',
   '[{"titulo":"Polivitamínico no GLP-1/GIP","componentes":[
        {"ativo":"Vitaminas A 1.500 UI, D 4.000 UI, E 10 mg, K2 100 mcg","dose":"—","obs":""},
        {"ativo":"Complexo B: B1 10 mg, B2 10 mg, B3 20 mg, B5 30 mg, B6 20 mg, biotina 500 mcg, metilfolato 400 mcg, metilcobalamina 500 mcg","dose":"—","obs":""},
        {"ativo":"Vitamina C","dose":"100 mg","obs":""},
        {"ativo":"Minerais: boro 2 mg, cálcio citrato 150 mg, cobre 0,5 mg, picolinato de cromo 200 mcg, Lipofer 20 mg, iodo 150 mcg, magnésio citrato 150 mg, manganês 1 mg, molibdênio 45 mcg, selênio 100 mcg, vanádio 50 mcg, zinco 10 mg","dose":"—","obs":"formas queladas"},
        {"ativo":"Arginina","dose":"200 mg","obs":""},
        {"ativo":"Taurina","dose":"200 mg","obs":""}],
      "posologia":"1 dose logo antes da principal refeição","duracao":"Fazer 30 doses (sachê ou cápsulas)","via":"oral"},
     {"titulo":"Reposição de eletrólitos","componentes":[
        {"ativo":"Palatinose","dose":"3 g","obs":""},
        {"ativo":"Cloreto de sódio","dose":"150 mg","obs":""},
        {"ativo":"Citrato de potássio","dose":"150 mg","obs":""},
        {"ativo":"Citrato de magnésio","dose":"150 mg","obs":""},
        {"ativo":"Extrato de beterraba","dose":"500 mg","obs":""},
        {"ativo":"Carbogel","dose":"qsp 30 g","obs":""}],
      "posologia":"1 unidade durante o exercício físico","duracao":"Fazer 20 unidades","via":"oral"},
     {"titulo":"Coenzima Q10 nanoemulsão","componentes":[
        {"ativo":"Maxsolve (CoQ10)","dose":"2–10 gotas","obs":"cada gota contém 10 mg de CoQ10"}],
      "posologia":"5 gotas, 1 a 2x ao dia","duracao":"Fazer 15 mL","via":"oral"},
     {"titulo":"Preservação de massa muscular","componentes":[
        {"ativo":"Peptistrong®","dose":"2,4 g","obs":"sinalização proteica antianabólica-catabólica"}],
      "posologia":"1 sachê ao dia","duracao":"Fazer 30 sachês","via":"oral"},
     {"titulo":"Recuperação de massa magra e firmeza da pele","componentes":[
        {"ativo":"Peptistrong®","dose":"2,4 g","obs":""},
        {"ativo":"Colágeno Verisol®","dose":"2,5 g","obs":""},
        {"ativo":"Excipiente","dose":"qsp 1 sachê","obs":""}],
      "posologia":"1 sachê ao dia","duracao":"Fazer 30 sachês","via":"oral"},
     {"titulo":"Melhora da força e performance","componentes":[
        {"ativo":"Clonapure®","dose":"1,8 g","obs":""}],
      "posologia":"1 sachê ao dia","duracao":"Fazer 30 sachês","via":"oral"},
     {"titulo":"Aumento de saciedade","componentes":[
        {"ativo":"Akkermat® (Akkermansia)","dose":"150 mg","obs":""},
        {"ativo":"Excipiente","dose":"qsp 1 cápsula","obs":""}],
      "posologia":"1 dose ao dia","duracao":"Fazer 30 doses","via":"oral"},
     {"titulo":"Ômega-3","componentes":[
        {"ativo":"Ômega-3","dose":"1000 mg por cápsula","obs":""}],
      "posologia":"1 cápsula 2x ao dia, após as refeições principais","duracao":"","via":"oral"}]'::jsonb,
   'São opções para montar a fase conforme a queixa — não usar todas juntas. Prioridade prática: proteína da dieta + treino de força; o suplemento entra onde a ingestão não fecha. Pontos de ação: micronutrientes e energia, massa muscular, hidratação e eletrólitos, microbiota.',
   'Vitamina A e D nessas doses exigem checar outras fontes para não somar. Iodo 150 mcg: cautela em tireoidopatia. Cromo pode alterar glicemia em quem usa antidiabético. Ferro (Lipofer) reduz absorção de outros minerais e de levotiroxina — distanciar.',
   'Perda de peso muito rápida, perda de força evidente, desidratação, vômitos persistentes ou dor abdominal intensa: médico. Ajuste da dose do fármaco é do prescritor.',
   'Fórmulas de suporte ao tratamento médico. Conferir se as doses do polivitamínico ficam dentro dos limites da Res. CFN 656/2020 para o caso.',
   '[{"fonte":"Raiz Magistral — Tratamento em cada fase do uso de análogos de GLP-1/GIP","ano":2025,"detalhe":"material técnico do fabricante"}]'::jsonb),

  ('GLP-1 fase 3 — finalização (evitar reganho)', 'rm-glp1-fase3-final',
   array['glp-1','reganho','compulsão','saciedade','fibras','mitburn','5-htp'],
   'magistral', 'Metabolismo', 'Raiz Magistral',
   'Saída do análogo de GLP-1: prevenir reganho de peso e compulsão, reeducar o eixo fome-saciedade e sustentar o metabolismo sem o fármaco.',
   '[{"titulo":"GLP1 Fiber Protect","componentes":[
        {"ativo":"Fibregum","dose":"2 g","obs":""},
        {"ativo":"Psyllium","dose":"1 g","obs":""},
        {"ativo":"Glutamina","dose":"3 g","obs":"nutre enterócitos"},
        {"ativo":"Glicina","dose":"500 mg","obs":""},
        {"ativo":"Excipiente","dose":"qsp 1 sachê","obs":""}],
      "posologia":"1 dose ao dia, pela manhã","duracao":"Fazer 30 doses","via":"oral"},
     {"titulo":"Reequilíbrio do eixo intestino-cérebro","componentes":[
        {"ativo":"Bifidobacterium bifidum","dose":"500 mi UFC","obs":""},
        {"ativo":"Bifidobacterium lactis","dose":"500 mi UFC","obs":""},
        {"ativo":"Lactobacillus acidophilus","dose":"500 mi UFC","obs":""},
        {"ativo":"Lactobacillus rhamnosus","dose":"500 mi UFC","obs":""},
        {"ativo":"Streptococcus thermophilus","dose":"500 mi UFC","obs":""},
        {"ativo":"Excipiente","dose":"qsp 1 cápsula","obs":""}],
      "posologia":"1 dose ao dia, em jejum pela manhã ou à noite","duracao":"Fazer 30 doses","via":"oral"},
     {"titulo":"Redução da fome emocional","componentes":[
        {"ativo":"5-HTP","dose":"100 mg","obs":""},
        {"ativo":"Serenzo®","dose":"200 mg","obs":""},
        {"ativo":"Saffrin®","dose":"80 mg","obs":""},
        {"ativo":"Excipiente","dose":"qsp 1 cápsula","obs":""}],
      "posologia":"1 dose ao dia, pela manhã","duracao":"Fazer 30 doses","via":"oral"},
     {"titulo":"Melhora do metabolismo","componentes":[
        {"ativo":"Mitburn®","dose":"100 mg","obs":"termogênico"}],
      "posologia":"1 dose ao dia, pela manhã","duracao":"Fazer 30 doses","via":"oral"}]'::jsonb,
   'Pontos de ação: ajuste calórico, controle do apetite, compulsão alimentar e manutenção do peso. O que sustenta o resultado é o comportamento alimentar e o treino — a fórmula é apoio na transição.',
   'Psyllium/Fibregum: tomar com bastante água e distanciar de medicamentos (reduz absorção). 5-HTP não deve ser associado a ISRS, IMAO, tramadol ou triptanos. Mitburn (termogênico): cautela em hipertensão, arritmia e ansiedade.',
   'Compulsão alimentar recorrente com perda de controle ou sofrimento importante: psiquiatria/psicologia — pode ser transtorno de compulsão alimentar periódica.',
   'Doses do material do fabricante — individualizar. Termogênicos: checar cardiopatia e uso de estimulantes.',
   '[{"fonte":"Raiz Magistral — Tratamento em cada fase do uso de análogos de GLP-1/GIP","ano":2025,"detalhe":"material técnico do fabricante"}]'::jsonb);

  -- ---------- grava (upsert por slug da nutri) ----------
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

  raise notice 'Formulações Raiz Magistral gravadas para %', v_ana;
end $$;

notify pgrst, 'reload schema';
