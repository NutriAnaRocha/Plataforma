/* ============================================================
   IA ASSISTENTE (tela cheia) — mock de dados do Nútri AI
   Exposto como window.IA_DATA (JS, não JSON: fetch local é bloqueado em file://)
   ============================================================ */
window.IA_DATA = {
  saudacao: "Olá, Ana! 👋 Sou o <strong>Nútri AI</strong>",
  sub: "Seu copiloto clínico. Posso interpretar exames, montar cardápios, resumir a evolução de pacientes, calcular gasto energético e redigir orientações — tudo com base nos dados da sua plataforma.",

  /* contexto de paciente que o assistente \"enxerga\" */
  pacienteAtivo: "Marina Costa Ribeiro",
  pacientes: ["Marina Costa Ribeiro", "Joana Prado", "Rafael Antunes", "Carla Bruno", "Sem paciente (geral)"],

  /* cards do estado inicial — cada um semeia um prompt */
  capacidades: [
    { ico: "🧪", titulo: "Interpretar exames", desc: "Lê o laboratório e destaca o que importa.", prompt: "Analise os últimos exames da Marina e me diga o que merece atenção." },
    { ico: "🥗", titulo: "Montar cardápio", desc: "Plano alimentar dentro das metas de macros.", prompt: "Monte um cardápio de um dia para a Marina (1800 kcal, foco em SOP)." },
    { ico: "📈", titulo: "Resumir evolução", desc: "Síntese clínica do progresso do paciente.", prompt: "Resuma a evolução da Marina nas últimas 8 semanas." },
    { ico: "🧮", titulo: "Calcular energia", desc: "TMB, GET e VET com memória de cálculo.", prompt: "Calcule TMB, GET e VET da Marina e explique o ajuste calórico." },
    { ico: "📝", titulo: "Redigir orientações", desc: "Texto pronto para enviar ao paciente.", prompt: "Escreva orientações nutricionais para uma paciente com SOP e resistência à insulina." },
    { ico: "💡", titulo: "Tirar dúvida clínica", desc: "Resposta com base em evidência.", prompt: "Qual a conduta nutricional inicial para resistência à insulina?" }
  ],

  /* chips rápidos abaixo do campo */
  exemplos: [
    "O que mudou nos exames da Marina?",
    "Sugira substituições para o jantar dela",
    "Quais pacientes estão com baixa adesão?",
    "Gere um resumo para o prontuário"
  ],

  /* histórico (mock) na lateral */
  conversas: [
    { titulo: "Exames — Marina Costa", quando: "Há 2 h", preview: "Vitamina D baixa e HOMA-IR elevado…" },
    { titulo: "Cardápio low-carb — Rafael", quando: "Ontem", preview: "Plano de 1900 kcal com 130 g de proteína…" },
    { titulo: "Adesão da semana", quando: "2 dias atrás", preview: "3 pacientes abaixo de 60% de adesão…" },
    { titulo: "Orientações — gestante", quando: "Semana passada", preview: "Ácido fólico, ferro e fracionamento…" }
  ],

  /* respostas (demonstração) — a IA escolhe pela intenção do texto */
  respostas: {
    exame: '<h4>🧪 Leitura dos exames — Marina (15/06)</h4>' +
      '<p>Comparei com o painel de 10/03. Pontos que pedem atenção:</p>' +
      '<ul>' +
      '<li><strong>HOMA-IR 3,8</strong> (ref. &lt; 2,5) — resistência à insulina, coerente com o quadro de SOP. <em>Subiu de 3,1.</em></li>' +
      '<li><strong>Vitamina D 24 ng/mL</strong> (insuficiente) — considerar reposição e reavaliar em 90 dias.</li>' +
      '<li><strong>Triglicerídeos 168 mg/dL</strong> — no limite; melhora esperada com redução de ultraprocessados.</li>' +
      '<li>✅ TSH, hemoglobina e ferritina <strong>normais</strong>.</li>' +
      '</ul>' +
      '<p><strong>Sugestão de conduta:</strong> dieta de baixo índice glicêmico, priorizar fibras e proteína no café, e atividade de força 3×/semana. Quer que eu já transforme isso em orientações para enviar a ela?</p>' +
      '<p class="ia-fonte">Baseado nos dados do prontuário · revise antes de prescrever.</p>',

    cardapio: '<h4>🥗 Cardápio — 1 dia (~1800 kcal · foco SOP)</h4>' +
      '<ul>' +
      '<li><strong>Café (7h):</strong> ovos mexidos (2), pão integral, abacate, café sem açúcar.</li>' +
      '<li><strong>Lanche:</strong> iogurte natural + chia + morangos.</li>' +
      '<li><strong>Almoço:</strong> frango grelhado, arroz integral, feijão, salada à vontade + azeite.</li>' +
      '<li><strong>Lanche:</strong> mix de castanhas (30 g) + maçã.</li>' +
      '<li><strong>Jantar:</strong> salmão, legumes assados, purê de couve-flor.</li>' +
      '</ul>' +
      '<p><strong>Macros aprox.:</strong> 110 g proteína · 150 g carbo (baixo IG) · 70 g gordura.</p>' +
      '<p>Posso gerar a lista de compras e mandar para o módulo de Plano Alimentar dela. Sigo?</p>' +
      '<p class="ia-fonte">Sugestão automática · ajuste porções conforme antropometria.</p>',

    evolucao: '<h4>📈 Evolução da Marina — últimas 8 semanas</h4>' +
      '<ul>' +
      '<li><strong>Peso:</strong> 81,0 → 72,4 kg (−8,6 kg). IMC 29,8 → 26,6.</li>' +
      '<li><strong>Adesão ao plano:</strong> 84% (alta e consistente).</li>' +
      '<li><strong>Cintura:</strong> −9 cm; melhora do padrão de saciedade relatada no diário.</li>' +
      '<li>⚠️ Platô leve nas últimas 2 semanas — possível ajuste de VET ou redistribuição de carbo.</li>' +
      '</ul>' +
      '<p>Resumo pronto para colar no <strong>Prontuário &gt; Evolução Clínica</strong>. Quer que eu salve?</p>' +
      '<p class="ia-fonte">Gerado a partir de antropometria + diário + adesão.</p>',

    calculo: '<h4>🧮 Gasto energético — Marina</h4>' +
      '<ul>' +
      '<li><strong>TMB (Mifflin-St Jeor):</strong> 1.412 kcal.</li>' +
      '<li><strong>GET</strong> (fator atividade 1,55): 2.189 kcal.</li>' +
      '<li><strong>VET prescrito:</strong> 1.789 kcal (déficit de ~400 kcal/dia).</li>' +
      '</ul>' +
      '<p>O déficit moderado favorece perda de gordura preservando massa magra — adequado ao quadro de SOP. Memória de cálculo registrada no módulo Cálculos.</p>' +
      '<p class="ia-fonte">Fórmula configurável no prontuário.</p>',

    orientacao: '<h4>📝 Orientações nutricionais — SOP / resistência à insulina</h4>' +
      '<ul>' +
      '<li>Priorize alimentos de <strong>baixo índice glicêmico</strong> (integrais, leguminosas, vegetais).</li>' +
      '<li>Inclua <strong>proteína e fibra no café da manhã</strong> para estabilizar a glicemia.</li>' +
      '<li>Reduza ultraprocessados, açúcar e bebidas açucaradas.</li>' +
      '<li>Fracione as refeições e mantenha boa hidratação.</li>' +
      '<li>Associe <strong>treino de força</strong> 3×/semana — melhora a sensibilidade à insulina.</li>' +
      '</ul>' +
      '<p>Texto pronto para o módulo <strong>Orientações</strong> ou para enviar no chat da paciente. Quer que eu personalize com o nome dela?</p>' +
      '<p class="ia-fonte">Conteúdo educativo · não substitui avaliação individual.</p>',

    adesao: '<h4>💡 Pacientes com baixa adesão esta semana</h4>' +
      '<ul>' +
      '<li><strong>Carla Bruno</strong> — 52% · sem registro no diário há 5 dias.</li>' +
      '<li><strong>Rafael Antunes</strong> — 58% · pulou 2 refeições principais.</li>' +
      '<li><strong>Joana Prado</strong> — 61% · adesão caindo desde a última consulta.</li>' +
      '</ul>' +
      '<p>Quer que eu rascunhe uma mensagem de acolhimento para cada um?</p>' +
      '<p class="ia-fonte">Calculado a partir do diário alimentar + check-ins.</p>',

    padrao: '<p>Claro! No protótipo, esta é uma resposta de demonstração 🙂 — na versão final o Nútri AI estará conectado a um modelo de linguagem com acesso (seguro) aos dados da sua plataforma.</p>' +
      '<p>Posso <strong>interpretar exames</strong>, <strong>montar cardápios</strong>, <strong>resumir a evolução</strong> de um paciente, <strong>calcular TMB/GET</strong> e <strong>redigir orientações</strong>. É só pedir — ou tocar em um dos cartões acima.</p>'
  }
};
