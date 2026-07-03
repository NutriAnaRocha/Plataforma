/* ============================================================
   MOCK — Comunidade (rede profissional de nutricionistas)
   Dados fictícios. Numa fase futura virão de API.
   Exposto como global p/ funcionar por file:// (sem servidor).

   post:
     autor, crn, iniciais, cor ("vinho"|"rosa"|"ok"|"alerta")
     especialidade, tempo, categoria
     texto            -> conteúdo do post
     imagem (opcional)-> emoji/ilustração de capa (mock, sem asset externo)
     tags (opcional)  -> chips no rodapé do post
     curtidas, comentarios, curtido (bool)
     comentariosLista -> [{autor, iniciais, cor, tempo, texto}]
     fixado (opcional)-> destaca no topo
   ============================================================ */
window.COMUNIDADE_DATA = {
  /* Card de destaque do topo (gerado/curado pela plataforma) */
  destaque: {
    eyebrow: "Comunidade Ana Rocha",
    title: "Um espaço de nutricionistas para nutricionistas",
    texto: "Troque experiências, compartilhe casos (sempre sem dados de pacientes), tire dúvidas de conduta e cresça junto com outras profissionais. Seja gentil e cite suas fontes. 💚",
    membros: "2.847 membros",
    online: "126 online agora"
  },

  categorias: [
    "Todos", "Casos Clínicos", "Dúvidas", "Conquistas",
    "Materiais", "Eventos", "Vagas"
  ],

  posts: [
    {
      id: "boas-vindas",
      fixado: true,
      autor: "Equipe Ana Rocha",
      crn: "Moderação",
      iniciais: "AR",
      cor: "vinho",
      especialidade: "Comunidade oficial",
      tempo: "Fixado",
      categoria: "Materiais",
      texto: "Bem-vinda à Comunidade! 🎉 Regras rápidas: (1) nunca compartilhe nome, foto ou exame identificável de paciente; (2) cite a evidência quando afirmar algo clínico; (3) respeito sempre. Use os filtros acima para navegar por assunto. Bons debates!",
      tags: ["Regras", "Comece por aqui"],
      curtidas: 214,
      comentarios: 12,
      curtido: true,
      comentariosLista: [
        { autor: "Marina Alves", iniciais: "MA", cor: "rosa", tempo: "2 d", texto: "Amei o espaço, que iniciativa linda! 👏" },
        { autor: "Beatriz Nunes", iniciais: "BN", cor: "ok", tempo: "1 d", texto: "Finalmente um lugar sério pra trocar ideia clínica." }
      ]
    },
    {
      id: "caso-sop",
      autor: "Camila Ferreira",
      crn: "CRN-3 45678",
      iniciais: "CF",
      cor: "rosa",
      especialidade: "Saúde da Mulher",
      tempo: "3 h",
      categoria: "Casos Clínicos",
      texto: "Paciente com SOP e resistência à insulina, sem uso de medicação. Fechei conduta com dieta de baixo índice glicêmico + mio-inositol 2 g 2x/dia e reforço de atividade de força. Em 12 semanas: ciclo regularizou e HOMA-IR caiu de 3,8 para 2,1. Alguém tem visto resposta parecida com inositol isolado vs. combinado com D-chiro?",
      tags: ["SOP", "Inositol", "Resistência à insulina"],
      curtidas: 88,
      comentarios: 9,
      curtido: false,
      comentariosLista: [
        { autor: "Renata Lopes", iniciais: "RL", cor: "vinho", tempo: "2 h", texto: "A proporção 40:1 (mio:D-chiro) tem tido melhor resposta na minha prática, principalmente em quem não regulou só com mio." },
        { autor: "Camila Ferreira", iniciais: "CF", cor: "rosa", tempo: "1 h", texto: "Boa, Renata! Vou testar a combinação na próxima e trago o resultado aqui." }
      ]
    },
    {
      id: "duvida-vegana-b12",
      autor: "Juliana Prado",
      crn: "CRN-3 33221",
      iniciais: "JP",
      cor: "ok",
      especialidade: "Vegetariana/Vegana",
      tempo: "6 h",
      categoria: "Dúvidas",
      texto: "Como vocês têm orientado a reposição de B12 em pacientes veganos assintomáticos com B12 sérica no limite inferior mas homocisteína normal? Reponho já ou monitoro? Curioso pra ver as condutas.",
      tags: ["B12", "Vegano"],
      curtidas: 41,
      comentarios: 14,
      curtido: false,
      comentariosLista: [
        { autor: "Diego Martins", iniciais: "DM", cor: "vinho", tempo: "5 h", texto: "Sérico isolado engana bastante. Se dá pra dosar ác. metilmalônico, ajuda muito a decidir. Mas em vegano eu tendo a repor preventivamente." }
      ]
    },
    {
      id: "conquista-consultorio",
      autor: "Patrícia Gomes",
      crn: "CRN-3 90876",
      iniciais: "PG",
      cor: "vinho",
      especialidade: "Clínica Funcional",
      tempo: "1 d",
      categoria: "Conquistas",
      texto: "Gente, inaugurei meu consultório próprio essa semana depois de 4 anos atendendo em espaço compartilhado! 🥹🎉 Fica aqui como incentivo pra quem está com medo de dar o passo: dá certo. Obrigada a essa comunidade que me ajudou tanto com dúvidas de gestão.",
      imagem: "🎉",
      tags: ["Empreendedorismo"],
      curtidas: 312,
      comentarios: 27,
      curtido: true,
      comentariosLista: [
        { autor: "Ana Luísa Rocha", iniciais: "AL", cor: "rosa", tempo: "1 d", texto: "Que orgulho, Patrícia! Sucesso nessa nova fase. 💚" },
        { autor: "Larissa Dias", iniciais: "LD", cor: "ok", tempo: "22 h", texto: "Inspirador demais! Tô juntando coragem pra fazer o mesmo." }
      ]
    },
    {
      id: "material-anamnese",
      autor: "Fernanda Rocha",
      crn: "CRN-3 11223",
      iniciais: "FR",
      cor: "rosa",
      especialidade: "Esportiva",
      tempo: "1 d",
      categoria: "Materiais",
      texto: "Montei um modelo de anamnese esportiva com foco em disponibilidade energética e sintomas de RED-S. Quem quiser, deixo o link nos comentários (é gratuito). Feedbacks são super bem-vindos pra eu melhorar a v2!",
      tags: ["Anamnese", "RED-S", "Grátis"],
      curtidas: 156,
      comentarios: 33,
      curtido: false,
      comentariosLista: [
        { autor: "Bruno Teixeira", iniciais: "BT", cor: "vinho", tempo: "20 h", texto: "Salvando aqui! Obrigado por compartilhar de graça, isso que é comunidade." }
      ]
    },
    {
      id: "evento-congresso",
      autor: "Equipe Ana Rocha",
      crn: "Moderação",
      iniciais: "AR",
      cor: "vinho",
      especialidade: "Comunidade oficial",
      tempo: "2 d",
      categoria: "Eventos",
      texto: "📅 Encontro online da comunidade dia 18/07 às 20h: 'Conduta nutricional no uso de análogos de GLP-1'. Roda de conversa + perguntas ao vivo. Gratuito para membros. Confirma presença nos comentários que enviamos o link no dia!",
      tags: ["Live", "GLP-1", "18/07"],
      curtidas: 97,
      comentarios: 41,
      curtido: false,
      comentariosLista: [
        { autor: "Marina Alves", iniciais: "MA", cor: "rosa", tempo: "2 d", texto: "Presença confirmada! Tema super atual." }
      ]
    },
    {
      id: "duvida-precificacao",
      autor: "Larissa Dias",
      crn: "CRN-3 55667",
      iniciais: "LD",
      cor: "ok",
      especialidade: "Comportamental",
      tempo: "3 d",
      categoria: "Dúvidas",
      texto: "Como vocês estão precificando pacote trimestral vs. consulta avulsa? Tô com receio de assustar o paciente com o valor fechado do pacote, mas sei que a adesão melhora muito. Aceito estratégias de como apresentar o valor. 🙏",
      tags: ["Gestão", "Precificação"],
      curtidas: 63,
      comentarios: 19,
      curtido: false,
      comentariosLista: [
        { autor: "Patrícia Gomes", iniciais: "PG", cor: "vinho", tempo: "3 d", texto: "Eu apresento sempre a jornada, não o preço. Quando a paciente entende o que recebe em 3 meses, o valor do pacote deixa de assustar." }
      ]
    },
    {
      id: "vaga-clinica",
      autor: "Clínica Bem Viver",
      crn: "Parceiro",
      iniciais: "BV",
      cor: "alerta",
      especialidade: "Oportunidade",
      tempo: "4 d",
      categoria: "Vagas",
      texto: "💼 Vaga: nutricionista clínico(a) para clínica multidisciplinar em São Paulo (Pinheiros). 20h semanais, presencial. Desejável experiência com emagrecimento e acompanhamento de bariátrica. Interessados(as) comentem que enviamos o processo por mensagem.",
      tags: ["São Paulo", "Presencial", "Clínica"],
      curtidas: 34,
      comentarios: 22,
      curtido: false,
      comentariosLista: []
    }
  ]
};
