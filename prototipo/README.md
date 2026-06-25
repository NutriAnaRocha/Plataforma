# Plataforma para Nutricionistas — Protótipo (Login · Dashboard · Pacientes · Agenda · Prontuário)

Protótipo navegável de alta fidelidade das **Telas 1 (Login / Boas-vindas)** e **2 (Dashboard)**,
inspirado no WebDiet porém mais moderno e elegante (referências: Apple, Notion, Stripe, Linear).
Construído em HTML/CSS/JS puro — **sem build, sem instalação**.

## Como abrir

1. Dê **duplo clique** em `index.html` (abre direto no Chrome/Edge).
2. Entre com qualquer e-mail/senha → escolha as áreas de atuação → cai na `dashboard.html`.
   (Ou abra `dashboard.html` direto para ver a Tela 2.)
3. Tudo funciona offline. A fonte **Montserrat** é carregada do Google Fonts (precisa de internet só para isso; sem internet o navegador usa uma fonte de sistema equivalente).

> Os dados do feed vêm de `assets/js/feed-data.js` (JavaScript, não JSON) **de propósito**:
> ao abrir por `file://`, o Chrome bloqueia `fetch()` de arquivos locais. Como JS, funciona por duplo clique.

## ✏️ Trocar o nome da plataforma (1 lugar)

O nome ainda é provisório (`NutriPlat`). Para trocar, edite **uma linha**:

- Arquivo: [`assets/js/app.js`](assets/js/app.js) → constante `BRAND` (logo no topo).

O nome é injetado automaticamente no wordmark, no rodapé, no título da aba e no dashboard
(em todo elemento com `data-brand`).

## Identidade visual

| Token | Valor |
|---|---|
| Vinho | `#7B284C` |
| Rosa Claro | `#F4DCE5` |
| Branco | `#FFFFFF` |
| Cinza Claro | `#F5F5F5` |
| Cinza Escuro | `#3C3C3C` |
| Fonte display (wordmark/títulos) | **Merienda** (`assets/img/fonts/`) |
| Fonte UI/corpo | **Montserrat** (Google Fonts) |

Assets de marca reaproveitados de `…\NUTRI ANA LUISA ROCHA\Identidade Visual Ana`
(monograma folha + fonte Merienda). Todos os tokens ficam em
[`assets/css/tokens.css`](assets/css/tokens.css) e são herdados pelas próximas telas.

## Estrutura

```
prototipo/
├── index.html               Tela 1 — Login / Boas-vindas
├── dashboard.html           Tela 2 — Dashboard
├── pacientes.html           Tela 3 — Pacientes (lista + perfil)
├── agenda.html              Tela 4 — Agenda (visões Dia / Semana)
├── prontuario.html          Tela 5 — Prontuário completo (15 módulos)
├── assets/
│   ├── css/tokens.css        Design tokens (cores, tipografia, raio, sombra, espaçamento)
│   ├── css/style.css         Componentes + layout da Tela 1
│   ├── css/dashboard.css     Layout + componentes da Tela 2 (sidebar, cards, agenda, Nútri AI)
│   ├── css/pacientes.css     Layout + componentes da Tela 3 (tabela, perfil, abas, timeline)
│   ├── css/agenda.css        Layout + componentes da Tela 4 (grade Dia/Semana, mini-calendário, evento)
│   ├── css/prontuario.css    Layout + componentes da Tela 5 (menu de módulos, marcadores, plano, IA)
│   ├── js/feed-data.js       Mock do Feed Científico + "Atualização da Semana"
│   ├── js/feed.js            Carrossel (10s), chips, filtro e priorização por área
│   ├── js/personalize.js     Modal "Quais áreas você atende?" + localStorage
│   ├── js/dashboard-data.js  Mock da Tela 2 (indicadores, agenda, pacientes, pendências, IA)
│   ├── js/dashboard.js       Render do dashboard, gráfico SVG e assistente Nútri AI
│   ├── js/pacientes-data.js  Mock da Tela 3 (7 pacientes com perfil, evolução, consultas…)
│   ├── js/pacientes.js       Lista/busca/filtros + perfil com abas e gráfico de peso
│   ├── js/agenda-data.js     Mock da Tela 4 (consultas da semana por dia/horário/status)
│   ├── js/agenda.js          Render Dia/Semana, mini-calendário, resumo e modal de agendamento
│   ├── js/prontuario-data.js Mock da Tela 5 (1 paciente completo: anamnese, exames, plano, financeiro…)
│   ├── js/prontuario.js      Render do cabeçalho + 15 módulos do prontuário (array MODULES)
│   └── js/app.js             Nome da marca, login (Entrar/Criar conta), navegação
│   └── img/                  Logo, folha e fonte Merienda
```

## Tela 5 — Prontuário (centro de inteligência clínica)

Acessível pela sidebar (**Prontuários**) ou pelo botão **📋 Abrir prontuário** no perfil do paciente.

- **Cabeçalho do paciente**: foto, nome, idade, status (Ativo/Alta/Inativo), dados de contato/documentos
  e um **resumo rápido** (peso atual/inicial/diferença, IMC, objetivo, adesão, últimos exames).
- **Menu lateral com 15 módulos** (`.modrail`), cada um renderizado dinamicamente:
  1. **Anamnese e Perfil** — dados pessoais, histórico clínico, hábitos, histórico alimentar,
     saúde intestinal (escala de Bristol) e **Saúde da Mulher** (exibida só para pacientes do sexo feminino).
  2. **Diário Alimentar** — refeições com foto, sintomas, humor, energia, sono e hidratação.
  3. **Questionários** — biblioteca com pontuação automática e faixa (ansiedade, sono, compulsão…).
  4. **Exames Laboratoriais** — upload (dropzone), tabela de marcadores com status (normal/alto/baixo),
     **sparkline de tendência** e **resumo clínico gerado por IA**.
  5. **Antropometria e Bioimpedância** — medidas, dobras, composição corporal e **gráfico de evolução**.
  6. **Cálculos Nutricionais** — fórmulas (Mifflin, Harris-Benedict…), TMB/GET/VET e memória de cálculo.
  7. **Planejamento Alimentar** — refeições com itens, substituições, **checkbox** (visão do paciente),
     totais de macros/kcal com barras e biblioteca de protocolos (SOP, gestação, etc.).
  8. **Metas e Objetivos** — barras de progresso (peso, gordura, massa muscular, passos…).
  9. **Orientações** — biblioteca de materiais para enviar (PDF, e-book, guias).
  10. **Manipulados** — prescrições com dosagem, posologia, horário, duração e histórico.
  11. **Arquivos Anexos** — upload com organização automática por categoria.
  12. **Evolução Clínica** — registro cronológico (queixa, evolução, diagnóstico, conduta, metas).
  13. **Chat com Paciente** — mensagens, fotos, áudios e arquivos.
  14. **Documentos** — geração de declarações/atestados/recibos com assinatura digital.
  15. **Financeiro** — recebido/pendente, lançamentos e formas de pagamento (Pix, Stripe, Asaas…).
- **Inteligência clínica**: caixas de **insight da IA** (`.ai-insight`) em vários módulos + o assistente
  **Nútri AI** flutuante, contextualizado neste prontuário.
- Reutiliza o shell e os componentes das Telas 2/3 (info-block, timeline, pílula, barra, gráfico SVG).

## Tela 4 — Agenda

- **Duas visões** alternadas por um *segmented control*: **Semana** (7 colunas Seg–Dom com grade
  horária 07h–20h) e **Dia** (timeline de um único dia, com tipo e modalidade em cada consulta).
- **Eventos** posicionados por horário e duração, coloridos por status (Agendada, Em andamento,
  Concluída, Cancelada) e com **linha do "agora"** no dia atual.
- **Navegação** ‹ › (dia ou semana, conforme a visão) + botão **Hoje**.
- **Mini-calendário** lateral do mês, com pontos nos dias que têm consulta; clicar num dia abre a visão Dia.
- **Resumo** contextual (do dia ou da semana): totais por modalidade, encaixes e concluídas. **Legenda** de status.
- **Novo agendamento**: botão e modal (paciente, data, início, duração, tipo, modalidade). Clicar
  num horário vazio do calendário já abre o modal com data/hora pré-preenchidas.
- Reutiliza o shell (sidebar/topbar), o `.modal` e os campos de `style.css`; navegação ligada na sidebar e no "Ver agenda →" do dashboard.

## Tela 3 — Pacientes

- **Lista** de pacientes em tabela, com **busca** (nome/objetivo) e **filtros por status**
  (Todos / Ativos / Atenção / Inativos) com contadores. Cada linha mostra avatar, idade/sexo,
  objetivo, pílula de status e barra de **adesão** (fica laranja/vermelha quando < 50%).
- **Perfil do paciente** (clicando numa linha, a lista dá lugar ao perfil):
  cabeçalho com avatar, tags e status; 4 indicadores (peso atual + variação, IMC + classificação,
  meta, adesão); e **abas**: *Resumo* (anamnese, restrições, contato, agenda, antropometria),
  *Evolução* (gráfico de peso SVG), *Consultas* (timeline), *Prescrições* e *Exames* (listas com status).
- Reutiliza o shell (sidebar/topbar) e os componentes do Dashboard; a navegação Dashboard ↔ Pacientes já está ligada.

## Tela 2 — Dashboard

- **Sidebar** com a navegação completa do briefing (Dashboard, Pacientes, Agenda, Prontuários,
  Prescrições, Exames, Comunidade, Financeiro, Relatórios, IA Assistente, Configurações) + card do usuário.
- **Topbar** com saudação, data de hoje, busca, notificações e avatar.
- **4 indicadores**: Pacientes ativos, Consultas hoje, Aniversariantes e Pendências (com variação/delta).
- **Agenda inteligente**: consultas do dia com horário, paciente, tipo, modo (presencial/online) e status.
- **Evolução & adesão**: gráfico de linha (SVG) das últimas 8 semanas, gerado a partir do mock.
- **Pacientes em foco**: progresso rumo ao objetivo (barra %).
- **Aniversariantes** do dia + **Pendências** (checklist clicável).
- **Nútri AI**: assistente flutuante no canto inferior direito (estilo ChatGPT) — abre painel com
  histórico, chips de sugestão e campo de mensagem (resposta de demonstração via mock).
- **Responsivo**: sidebar vira gaveta (☰) abaixo de 880px; cards reorganizam em 2 e depois 1 coluna.

## Biblioteca de componentes (reutilizáveis)

Definidos em `style.css`, prontos para o Dashboard herdar:

| Componente | Classe | Uso |
|---|---|---|
| Botão primário | `.btn .btn--primary` | Entrar, ações principais |
| Botão ghost (sobre vinho) | `.btn .btn--ghost` | Criar conta no painel vinho |
| Botão contorno (sobre claro) | `.btn .btn--outline` | Ações secundárias |
| Campo de formulário | `.field` (+ `.field--light`) | Login / modal |
| Chip de categoria | `.chip` | Filtros do feed |
| Tag | `.tag` | Categoria no card |
| Estrelas de evidência | `.stars` | Nível de evidência |
| News card | `.news-card` | Card do feed científico |
| Faixa da semana | `.highlight-week` | Resumo da IA |
| Modal | `.modal-overlay` + `.modal` | Personalização |
| Carrossel | `.carousel` + `.dot` | Rotação automática 10s |

## Fluxo de navegação

`index.html` → **Entrar / Criar conta** (revela formulário inline) → **Entrar na plataforma**
→ (1º acesso) **modal "Quais áreas você atende?"** → salva preferências (localStorage) e
reordena o feed → `dashboard.html`.

> Para rever o modal de 1º acesso, limpe o storage no console:
> `localStorage.removeItem('nutriplat.areas')` e recarregue.

## Destaques de UX (diferenciais sobre o WebDiet)

- **Feed Científico Inteligente** no lugar de "notícias": cada card traz *Resumo em 30s*,
  *O que mudou na prática clínica?*, *Como aplicar com seus pacientes?* e **nível de evidência**.
- **Atualização da Semana** — resumo curado (futuro: gerado por IA).
- **Personalização por área** de atuação, priorizando o conteúdo relevante.
- Carrossel automático (10s) com barra de progresso, pausa no hover e navegação manual.

## Fora de escopo (próximos ciclos)

- Telas internas restantes (Prontuários, Prescrições, Exames, Comunidade, Financeiro, etc. — hoje são itens de menu).
- Integração com API real de notícias + camada de IA (resumos automáticos e o Nútri AI conectado a um LLM).
- Autenticação e backend reais (persistência, multiusuário).
