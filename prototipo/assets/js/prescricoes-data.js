/* Mock de Prescrições (planos alimentares) — exposto em window, pois fetch de JSON é bloqueado em file:// */
window.RX_DATA = {
  resumo: { ativos: 18, modelos: 6, revisar: 3, aderencia: 82 },

  // Lista de planos (cada um pertence a um paciente)
  planos: [
    {
      id: "p1", paciente: "Marina Costa Ribeiro", iniciais: "MC", cor: "rosa",
      objetivo: "Emagrecimento + SOP", status: "ativo", atualizado: "há 2 dias",
      kcal: 1650, adesao: 88,
      macros: { cho: 45, ptn: 30, lip: 25 },
      refeicoes: [
        { hora: "07:30", nome: "Café da manhã", itens: [
          { alimento: "Ovos mexidos (2 un)", qtd: "120 g", kcal: 180 },
          { alimento: "Pão integral", qtd: "1 fatia", kcal: 80 },
          { alimento: "Mamão papaia", qtd: "100 g", kcal: 40 }
        ]},
        { hora: "10:00", nome: "Lanche da manhã", itens: [
          { alimento: "Iogurte natural", qtd: "170 g", kcal: 100 },
          { alimento: "Castanha-do-pará", qtd: "2 un", kcal: 60 }
        ]},
        { hora: "12:30", nome: "Almoço", itens: [
          { alimento: "Filé de frango grelhado", qtd: "120 g", kcal: 200 },
          { alimento: "Arroz integral", qtd: "4 col. sopa", kcal: 160 },
          { alimento: "Feijão", qtd: "1 concha", kcal: 110 },
          { alimento: "Salada verde + azeite", qtd: "à vontade", kcal: 70 }
        ]},
        { hora: "16:00", nome: "Lanche da tarde", itens: [
          { alimento: "Banana", qtd: "1 un", kcal: 90 },
          { alimento: "Pasta de amendoim", qtd: "1 col. chá", kcal: 50 }
        ]},
        { hora: "20:00", nome: "Jantar", itens: [
          { alimento: "Omelete de legumes", qtd: "150 g", kcal: 220 },
          { alimento: "Batata-doce", qtd: "100 g", kcal: 90 }
        ]}
      ]
    },
    {
      id: "p2", paciente: "Carla Menezes", iniciais: "CM", cor: "vinho",
      objetivo: "Hipertrofia", status: "ativo", atualizado: "há 5 dias",
      kcal: 2200, adesao: 75, macros: { cho: 50, ptn: 30, lip: 20 }, refeicoes: []
    },
    {
      id: "p3", paciente: "Roberto Lima", iniciais: "RL", cor: "rosa",
      objetivo: "Controle glicêmico", status: "revisar", atualizado: "há 12 dias",
      kcal: 1800, adesao: 61, macros: { cho: 40, ptn: 30, lip: 30 }, refeicoes: []
    },
    {
      id: "p4", paciente: "Juliana Prado", iniciais: "JP", cor: "vinho",
      objetivo: "Reeducação alimentar", status: "ativo", atualizado: "ontem",
      kcal: 1500, adesao: 91, macros: { cho: 45, ptn: 25, lip: 30 }, refeicoes: []
    },
    {
      id: "p5", paciente: "Fernanda Dias", iniciais: "FD", cor: "rosa",
      objetivo: "Gestante — 2º trimestre", status: "revisar", atualizado: "há 9 dias",
      kcal: 2100, adesao: 70, macros: { cho: 50, ptn: 25, lip: 25 }, refeicoes: []
    }
  ],

  // Modelos reutilizáveis
  modelos: [
    { nome: "Low carb 1500 kcal", desc: "Base para emagrecimento", usos: 24, tag: "Emagrecimento" },
    { nome: "Hipertrofia 2200 kcal", desc: "Alta proteína, 5 refeições", usos: 18, tag: "Ganho de massa" },
    { nome: "Mediterrâneo 1800 kcal", desc: "Anti-inflamatório", usos: 12, tag: "Saúde" },
    { nome: "Gestante 2100 kcal", desc: "Ferro + folato reforçados", usos: 7, tag: "Gestação" }
  ]
};
