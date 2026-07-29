-- ============================================================
--  Plataforma Nutri — Migração 0048
--  INTELIGÊNCIA CLÍNICA — protocolo de conduta nutricional em uso de
--  análogos de GLP-1 ("canetas emagrecedoras").
--
--  Por que existe: o modelo de plano alimentar `caneta` (plano-alimentar.js)
--  foi montado antes de qualquer busca de literatura. Este protocolo é o
--  lastro que faltava — os alvos do modelo (proteína distribuída, teto de
--  gordura, fibra, piso de energia) saem daqui, e as três referências são
--  os documentos de 2025 contra os quais o modelo foi conferido.
--
--  Não trata de indicar, prescrever ou ajustar a medicação: isso é do
--  médico. O protocolo cobre o que é do nutricionista — preservar massa
--  magra, manter adequação de micronutrientes num consumo muito reduzido
--  e manejar os efeitos gastrointestinais pela via alimentar.
-- ============================================================

insert into public.ic_protocolos (
  nutricionista_id, nome, slug, sinonimos, eixo, grupo,
  objetivo_clinico, estrategia, nutrientes, exames_slugs, sinais_sintomas,
  materiais_apoio, referencias, quando_encaminhar, atencao
) values

(null, 'Conduta nutricional em uso de análogos de GLP-1', 'analogos-glp1',
 '{"caneta","canetas emagrecedoras","semaglutida","Ozempic","Wegovy","liraglutida","Saxenda","tirzepatida","Mounjaro","agonista GLP-1","GLP-1 RA"}',
 'Condições clínicas', 'Obesidade',
 'Preservar massa magra e adequação nutricional durante uma perda de peso rápida e induzida por fármaco, e manejar pela alimentação os efeitos gastrointestinais que fazem a paciente abandonar o tratamento.',
 'O remédio resolve o apetite; ele não resolve a COMPOSIÇÃO do que se perde nem a qualidade do que ainda se come. Os ensaios com substudo de composição corporal mostram redução absoluta de massa magra clinicamente relevante — é esse o alvo do nutricionista. Proteína é a alavanca: consenso Delphi de 2025 põe 1,2–1,5 g/kg de peso ATUAL/dia na fase de perda (o Advisory conjunto ACLM/ASN/OMA/TOS aceita até 1,6 g/kg e alerta para não passar de 2), e — ponto que costuma ser esquecido — DISTRIBUÍDA entre as refeições, não concentrada no almoço e no jantar. Distribuir é difícil justamente aqui, porque a paciente come pouco: por isso o plano se apoia em itens de alta densidade proteica e pouco volume (leite em pó desnatado, ricota, ovo, iogurte). Proteína primeiro no prato, antes do carboidrato, é a regra prática que sobrevive quando a saciedade chega no meio da refeição. Treino de FORÇA não é acessório: sem ele a proteína isolada não segura a massa magra — 2–3 sessões semanais de intensidade moderada a alta, somadas a ≥150 min de aeróbico. Estrutura de refeições: 4–6 pequenas ao dia, comer devagar, não deitar depois. Sintomas GI: gordura concentrada e fritura pioram a náusea (o esvaziamento gástrico já está lento), então gordura fica em 25–60 g/dia num plano de 1200–1500 kcal e 35–70 g em 1500–1800 kcal, diluída entre as refeições. A constipação é manejada com fibra (≥25 g/dia mulheres, ≥30 g homens) e líquidos >2 L/dia — mas com uma ressalva contraintuitiva: na fase de TITULAÇÃO da dose, segurar temporariamente fibra e gordura enquanto a náusea está ativa, e só então subir a fibra. O piso de energia do consenso é 1000–1200 kcal/dia; abaixo disso não se fecha micronutriente nem proteína distribuída. Estudo transversal de 2025 com usuárias de GLP-1 achou ingestão abaixo da referência para fibra, cálcio, ferro, magnésio, potássio e vitaminas A, C e D — daí o polivitamínico entrar em pauta quando o consumo alimentar fica muito restrito.',
 '[{"nutriente":"Proteína","papel":"Único fator dietético com efeito consistente sobre a perda de massa magra; precisa estar em TODAS as refeições, não só nas principais","dose":"1,2–1,5 g/kg de peso atual/dia (até 1,6); ~20–30 g por refeição; não ultrapassar 2 g/kg"},
   {"nutriente":"Fibras","papel":"Manejo da constipação, que é o efeito adverso que mais dura","dose":"≥25 g/dia (mulheres) e ≥30 g/dia (homens); ≥35 g se diabetes. Subir DEPOIS da titulação"},
   {"nutriente":"Água e líquidos","papel":"Constipação e risco de lesão renal aguda por desidratação em vômito/diarreia","dose":">2 L/dia (~35 ml/kg); afastar líquido das refeições para não roubar espaço da proteína"},
   {"nutriente":"Polivitamínico e mineral","papel":"Consumo muito reduzido compromete a adequação; deficiências descritas de ferro, cálcio, magnésio, potássio, vitaminas A, C e D","dose":"Considerar quando a ingestão alimentar estiver muito limitada; corrigir deficiência documentada"},
   {"nutriente":"Vitamina B12","papel":"Ingestão reduzida de fontes animais somada a metformina, frequente nesse perfil","dose":"Monitorar"},
   {"nutriente":"Gordura","papel":"Não é nutriente a maximizar aqui: gordura concentrada agrava náusea e refluxo pelo esvaziamento gástrico lento","dose":"Teto de 25–60 g/dia em 1200–1500 kcal; 35–70 g em 1500–1800 kcal, diluída no dia; sem fritura"}]',
 '{"hemoglobina","ferritina","ferro-serico","vitamina-b12","vitamina-d","magnesio","calcio","albumina","creatinina-tfg","hba1c","glicemia-jejum","tgp-alt"}',
 '{"Náusea e vômito (pico na titulação da dose)","Saciedade precoce — abandona o prato na metade","Refluxo e sensação de comida parada","Constipação persistente","Diarreia","Aversão a carne e a alimentos gordurosos","Queda de cabelo (perda rápida + ingestão proteica baixa)","Perda de força e fadiga — sinal de perda de massa magra","Desidratação"}',
 '[{"titulo":"Coma a proteína primeiro","tipo":"orientacao","detalhe":"A saciedade chega no meio da refeição; o que estiver no prato quando ela chegar é o que se perde. Comece pela proteína, depois vegetais, carboidrato por último"},
   {"titulo":"Refeições pequenas e devagar","tipo":"habito","detalhe":"4–6 refeições pequenas, mastigando bem. Volume grande de uma vez é o principal gatilho de vômito"},
   {"titulo":"Não deitar depois de comer","tipo":"habito","detalhe":"Esperar 2–3h; o esvaziamento gástrico está lento e o refluxo é comum"},
   {"titulo":"Líquido fora das refeições","tipo":"orientacao","detalhe":">2 L/dia, mas entre as refeições — beber junto ocupa o espaço que deveria ser da proteína"},
   {"titulo":"Treino de força 2–3x/semana","tipo":"habito","detalhe":"É tratamento, não complemento: sem estímulo de força, a proteína sozinha não preserva a massa magra"},
   {"titulo":"Na náusea, segure gordura e fibra","tipo":"orientacao","detalhe":"Temporário e só na fase de titulação: alimentos brandos, com pouca gordura. A fibra sobe depois que o sintoma cede"}]',
 '[{"fonte":"Sievenpiper JL et al.","ano":2025,"detalhe":"Nutritional and lifestyle supportive care recommendations for management of obesity with GLP-1-based therapies: an expert consensus statement using a modified Delphi approach. Obesity Pillars 2025;17:100228. Origem dos alvos de proteína (1,2–1,5 g/kg), fibra, teto de gordura e piso de energia.","link":"https://doi.org/10.1016/j.obpill.2025.100228"},
   {"fonte":"Mozaffarian D et al.","ano":2025,"detalhe":"Nutritional priorities to support GLP-1 therapy for obesity: a joint Advisory from the American College of Lifestyle Medicine, the American Society for Nutrition, the Obesity Medicine Association, and The Obesity Society. Obesity (Silver Spring) 2025;33(8):1475-1503. Proteína 1,2–1,6 g/kg, teto de 2 g/kg, refeições a cada 3–4h, força ≥3x/semana.","link":"https://doi.org/10.1002/oby.24336"},
   {"fonte":"Spreckley E, Ruggiero A, Brown A.","ano":2025,"detalhe":"Bridging the nutrition guidance gap for GLP-1 receptor agonist therapy assisted weight loss: lessons from bariatric surgery. International Journal of Obesity. Proteína primeiro, refeições pequenas e frequentes, líquido fora das refeições, polivitamínico.","link":"https://doi.org/10.1038/s41366-025-01952-w"}]',
 'Indicação, prescrição, escolha de dose e ajuste da caneta são do médico — inclusive a decisão de segurar a titulação quando o sintoma GI está inviabilizando a alimentação. Encaminhar também em: vômito persistente com sinais de desidratação; dor abdominal intensa e contínua (pancreatite); suspeita de doença biliar; perda de peso muito rápida com queda de força; e uso sem indicação clínica ou por via de origem não confiável (manipulados e injetáveis alternativos — SBD, SBEM e Abeso já se posicionaram contra).',
 'O risco silencioso aqui não é o peso não cair: é cair do jeito errado. Perda rápida sem proteína distribuída e sem treino de força custa massa magra, e o que volta depois da suspensão volta como gordura — a paciente termina o ciclo com pior composição corporal no mesmo peso. Atenção também ao que a náusea esconde: a paciente que "não está conseguindo comer nada" pode estar meses abaixo do piso de energia e de micronutrientes sem que ninguém tenha perguntado. E cuidado ao ler a antropometria: perda de peso expressiva na balança não é, por si só, indicador de sucesso neste caso — sem bioimpedância ou circunferências, não dá para saber o que se perdeu.');
