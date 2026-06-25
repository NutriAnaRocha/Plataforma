/* ============================================================
   MOCK — Feed Científico Inteligente
   (Dados de exemplo. Numa fase futura virão de API + camada de IA.)
   Exposto como global para funcionar abrindo o HTML por file:// (sem servidor).

   Cada item:
     categoria  -> rótulo exibido na tag/chip
     areas      -> chaves que casam com a personalização ("Quais áreas você atende?")
     evidencia  -> 1 a 5 (nível de evidência)
   ============================================================ */
window.FEED_DATA = {
  /* Resumo semanal gerado pela IA */
  semana: {
    eyebrow: "Atualização da Semana",
    title: "5 estudos que podem mudar sua conduta esta semana",
    texto: "A IA leu os principais artigos publicados e resumiu em português: creatina em mulheres, tirzepatida na manutenção de peso, probióticos na SII, vitamina D na gestação e jejum intermitente em atletas."
  },

  /* Categorias (chips do feed) */
  categorias: [
    "Todos", "Clínica", "Saúde da Mulher", "Esportiva", "Comportamental",
    "Microbiota", "Suplementação", "Obesidade", "Materno Infantil",
    "Artigos", "CFN/CRN", "Gestão"
  ],

  cards: [
    {
      id: "creatina-mulheres",
      categoria: "Esportiva",
      areas: ["Esportiva", "Saúde da Mulher"],
      data: "22 jun 2026",
      title: "Nova meta-análise sobre creatina em mulheres",
      resumo: "Creatina demonstrou benefícios para força, cognição e composição corporal em mulheres de diferentes faixas etárias.",
      mudou: "Reforça a segurança da suplementação em mulheres, inclusive na peri e pós-menopausa — não só em atletas.",
      aplicar: "Considere 3–5 g/dia em praticantes de atividade física e durante o envelhecimento, alinhado ao objetivo da paciente.",
      evidencia: 5,
      link: "#"
    },
    {
      id: "tirzepatida-manutencao",
      categoria: "Obesidade",
      areas: ["Clínica", "Funcional"],
      data: "21 jun 2026",
      title: "Tirzepatida e manutenção do peso após 1 ano",
      resumo: "Estudo de extensão mostra que a interrupção da medicação leva a reganho parcial; a manutenção exige estratégia nutricional estruturada.",
      mudou: "O acompanhamento nutricional passa a ser peça central — não acessória — no uso de análogos de GLP-1/GIP.",
      aplicar: "Estruture protocolo de transição alimentar e preservação de massa magra para pacientes em desmame da medicação.",
      evidencia: 4,
      link: "#"
    },
    {
      id: "probioticos-sii",
      categoria: "Microbiota",
      areas: ["Clínica", "Funcional"],
      data: "20 jun 2026",
      title: "Probióticos específicos na Síndrome do Intestino Irritável",
      resumo: "Revisão sistemática aponta cepas com melhor evidência para sintomas de dor e distensão abdominal na SII.",
      mudou: "A escolha da cepa importa: efeitos são cepa-específicos, não 'probiótico' genérico.",
      aplicar: "Selecione cepas com evidência para o subtipo da paciente e reavalie em 4–8 semanas.",
      evidencia: 4,
      link: "#"
    },
    {
      id: "vitd-gestacao",
      categoria: "Materno Infantil",
      areas: ["Saúde da Mulher", "Fertilidade", "Pediatria"],
      data: "19 jun 2026",
      title: "Vitamina D na gestação e desfechos neonatais",
      resumo: "Suplementação adequada associada a menor risco de baixo peso ao nascer e melhor status ósseo do recém-nascido.",
      mudou: "Refina as metas de 25(OH)D no pré-natal e a importância da dosagem precoce.",
      aplicar: "Avalie status de vitamina D no início do pré-natal e individualize a suplementação conforme o nível.",
      evidencia: 4,
      link: "#"
    },
    {
      id: "sop-inositol",
      categoria: "Saúde da Mulher",
      areas: ["Saúde da Mulher", "Fertilidade", "Funcional"],
      data: "18 jun 2026",
      title: "Mio-inositol na SOP: atualização das evidências",
      resumo: "Mio-inositol melhora marcadores de resistência à insulina e regularidade do ciclo em mulheres com SOP.",
      mudou: "Consolida o inositol como adjuvante nutricional de primeira linha em SOP com perfil insulínico alterado.",
      aplicar: "Combine com estratégia alimentar de baixo índice glicêmico e monitore ciclo e marcadores metabólicos.",
      evidencia: 4,
      link: "#"
    },
    {
      id: "renal-proteina",
      categoria: "Clínica",
      areas: ["Renal", "Clínica"],
      data: "17 jun 2026",
      title: "Proteína na Doença Renal Crônica não dialítica",
      resumo: "Novo consenso refina as faixas de ingestão proteica conforme estágio e presença de diabetes.",
      mudou: "Individualização ganha peso: metas fixas dão lugar a faixas ajustadas por estágio e comorbidade.",
      aplicar: "Calcule a meta proteica por estágio da DRC e monitore TFG e estado nutricional periodicamente.",
      evidencia: 5,
      link: "#"
    },
    {
      id: "compulsao-mindful",
      categoria: "Comportamental",
      areas: ["Comportamental", "Estética"],
      data: "16 jun 2026",
      title: "Mindful eating reduz episódios de compulsão",
      resumo: "Ensaio clínico mostra redução na frequência de compulsão alimentar com intervenção baseada em atenção plena.",
      mudou: "Fortalece abordagens comportamentais como complemento — e não substituto — da prescrição alimentar.",
      aplicar: "Inclua práticas guiadas de mindful eating no plano de pacientes com fome emocional e compulsão.",
      evidencia: 3,
      link: "#"
    },
    {
      id: "cfn-resolucao",
      categoria: "CFN/CRN",
      areas: ["Clínica", "Esportiva", "Saúde da Mulher"],
      data: "15 jun 2026",
      title: "CFN publica atualização sobre prescrição de suplementos",
      resumo: "Nova resolução detalha competências e limites para prescrição de suplementos pelo nutricionista.",
      mudou: "Clareza regulatória sobre o que pode ser prescrito e a documentação exigida no prontuário.",
      aplicar: "Revise seus modelos de prescrição e registro para garantir conformidade com a nova resolução.",
      evidencia: 5,
      link: "#"
    },
    {
      id: "gestao-precificacao",
      categoria: "Gestão",
      areas: ["Estética", "Funcional", "Clínica"],
      data: "14 jun 2026",
      title: "Precificação de pacotes de acompanhamento",
      resumo: "Análise de mercado mostra que pacotes trimestrais aumentam adesão e previsibilidade de receita no consultório.",
      mudou: "Modelo de sessão avulsa perde espaço para jornadas de acompanhamento contínuo.",
      aplicar: "Estruture pacotes com entregáveis claros (planos, retornos, suporte) e comunique o valor da jornada.",
      evidencia: 3,
      link: "#"
    }
  ]
};
