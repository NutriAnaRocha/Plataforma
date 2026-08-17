-- ============================================================
--  Plataforma Nutri — Migração 0068
--  MEU CICLO — a paciente registra menstruação, sintomas e humor;
--  a plataforma calcula a fase do ciclo e devolve dicas de chá e
--  alimento próprias daquela fase. A nutri lê a regularidade e os
--  sintomas recorrentes na ficha. Inspiração: o app Flo.
--
--  MESMA REGRA DE DONO DA 0067: quem escreve é a paciente; a nutri
--  só lê. Dado de ciclo menstrual é dado de saúde íntimo — a única
--  pessoa com direito de dizer o que aconteceu é quem viveu.
--
--  SEM TABELA DE CONFIGURAÇÃO. Duração média, dia do ciclo, fase
--  atual e previsão da próxima menstruação são DERIVADAS do
--  histórico (o primeiro dia com fluxo abre um ciclo). Guardar
--  "duração média" numa coluna criaria um número que envelhece e
--  discorda do histórico. Cálculo no client, a partir da série.
--
--  ESCOPO CLÍNICO: isto NÃO é método contraceptivo nem janela fértil
--  para evitar gravidez, e a tela diz isso. É registro de sintomas
--  para orientação alimentar (Res. CFN 856/2026). Ciclo irregular,
--  sangramento fora do padrão ou dor incapacitante são encaminhamento
--  médico, e o módulo sinaliza isso em vez de sugerir conduta.
--
--  QUEM VÊ: liberação por paciente, via pacientes.portal_features
--  (chave 'ciclo'). NUNCA automático pelo sexo cadastrado — paciente
--  na menopausa, sem menstruação ou trans não deve receber o módulo
--  de presente. Quem decide é a nutri, na ficha.
-- ============================================================

create table if not exists public.ciclo_registros (
  id            uuid primary key default gen_random_uuid(),
  paciente_id   uuid not null references public.pacientes(id) on delete cascade,
  data          date not null default current_date,

  -- 'nenhum' é registro legítimo: marca o dia sem fluxo em que ela
  -- anotou só sintoma ou humor.
  fluxo         text not null default 'nenhum'
                check (fluxo in ('nenhum', 'escape', 'leve', 'moderado', 'intenso')),
  sintomas      jsonb not null default '[]'::jsonb,  -- ['colica','inchaco','cefaleia',...]
  humor         text check (humor in ('bem', 'disposta', 'irritada', 'ansiosa', 'triste')),
  energia       int check (energia between 1 and 3),
  libido        int check (libido between 1 and 3),
  observacao    text,

  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  unique (paciente_id, data)
);

create index if not exists ciclo_paciente_idx
  on public.ciclo_registros (paciente_id, data desc);

alter table public.ciclo_registros enable row level security;

drop policy if exists "ciclo_all_paciente" on public.ciclo_registros;
create policy "ciclo_all_paciente" on public.ciclo_registros
  for all to authenticated
  using (
    exists (
      select 1 from public.pacientes p
       where p.id = ciclo_registros.paciente_id
         and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.pacientes p
       where p.id = ciclo_registros.paciente_id
         and p.user_id = auth.uid()
    )
  );

drop policy if exists "ciclo_select_nutri" on public.ciclo_registros;
create policy "ciclo_select_nutri" on public.ciclo_registros
  for select to authenticated using (
    exists (
      select 1 from public.pacientes p
       where p.id = ciclo_registros.paciente_id
         and p.nutricionista_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
--  SEED — dicas por fase e por sintoma (tabela criada na 0067)
-- ------------------------------------------------------------
insert into public.dicas_conteudo (modulo, gatilho, tipo, emoji, titulo, texto, ordem) values
-- FASE MENSTRUAL
('ciclo','fase:menstrual','cha','🍵','Chá de camomila','Morno, ajuda a relaxar a musculatura nos dias de cólica. Vale junto de uma bolsa quente na barriga.',1),
('ciclo','fase:menstrual','cha','🫚','Chá de gengibre','Bem-vindo nos primeiros dias, principalmente se vem enjoo junto.',2),
('ciclo','fase:menstrual','alimento','🥬','Ferro do prato + vitamina C','Feijão, lentilha e folhas escuras com limão, laranja ou acerola na mesma refeição. A vitamina C multiplica o aproveitamento do ferro vegetal.',3),
('ciclo','fase:menstrual','alimento','🍫','Cacau 70%','Um ou dois quadradinhos matam a vontade de doce e ainda trazem magnésio.',4),
('ciclo','fase:menstrual','habito','☕','Segure no café e no álcool','Nesses dias os dois costumam intensificar cólica e irritabilidade.',5),
('ciclo','fase:menstrual','habito','😴','Menos cobrança, mais sono','Energia baixa aqui é fisiologia, não preguiça. Treino leve e uma hora a mais de sono valem mais que forçar.',6),

-- FASE FOLICULAR
('ciclo','fase:folicular','alimento','🥗','Aproveite a fase de mais disposição','A energia sobe junto com o estrogênio. É a melhor janela para treinar mais forte e organizar as refeições da semana.',1),
('ciclo','fase:folicular','alimento','🐟','Proteína e gordura boa','Ovo, peixe, castanhas e azeite sustentam a produção hormonal da fase.',2),
('ciclo','fase:folicular','cha','🌿','Chá verde pela manhã','Se você tolera cafeína, cai bem nessa fase de mais disposição. Evite no fim do dia.',3),
('ciclo','fase:folicular','habito','🏋️','Puxe mais no treino','Força e intensidade costumam render mais aqui. Aproveite a janela.',4),

-- FASE OVULATÓRIA
('ciclo','fase:ovulatoria','alimento','🥑','Gordura boa e fibra','Abacate, azeite, castanhas e bastante folha ajudam o fígado a metabolizar o pico de estrogênio.',1),
('ciclo','fase:ovulatoria','alimento','🥦','Crucíferas','Brócolis, couve-flor e repolho apoiam a fase de metabolização hormonal.',2),
('ciclo','fase:ovulatoria','habito','💧','Água e movimento','Retenção e sensibilidade nos seios são comuns por aqui. Água e caminhada ajudam mais que cortar sal do prato.',3),

-- FASE LÚTEA
('ciclo','fase:lutea','cha','🍵','Chá de camomila ou melissa','À noite, ajudam com a irritabilidade e o sono picado típicos da TPM.',1),
('ciclo','fase:lutea','alimento','🌰','Magnésio no prato','Castanha-do-pará, banana, aveia, semente de abóbora e cacau 70%. É a fase em que a falta de magnésio mais aparece.',2),
('ciclo','fase:lutea','alimento','🍠','Carboidrato de verdade, sem culpa','A fome aumenta nessa fase por fisiologia. Batata-doce, arroz e frutas seguram melhor a vontade de doce do que cortar tudo.',3),
('ciclo','fase:lutea','alimento','🧂','Menos ultraprocessado e sal','Inchaço e retenção respondem rápido a isso, mais que a qualquer chá.',4),
('ciclo','fase:lutea','habito','🚶','Movimento leve e sono','Caminhada, alongamento e dormir cedo suavizam a TPM mais do que qualquer suplemento sem indicação.',5),

-- SINTOMAS
('ciclo','sintoma:colica','cha','🍵','Camomila e calor local','Chá morno e bolsa quente na barriga. Simples e é o que mais funciona.',1),
('ciclo','sintoma:colica','alimento','🐟','Ômega 3 na semana','Sardinha, salmão e linhaça triturada ajudam no componente inflamatório da cólica ao longo dos ciclos.',2),
('ciclo','sintoma:inchaco','cha','🌿','Chá de hibisco ou erva-doce','Ajudam na sensação de retenção. Sem exagero e longe do horário de dormir.',1),
('ciclo','sintoma:inchaco','habito','🧂','Corte o ultraprocessado antes do sal','O sódio que incha vem muito mais do embutido e do congelado do que do saleiro.',2),
('ciclo','sintoma:cefaleia','habito','💧','Água e refeições sem grandes intervalos','Dor de cabeça de TPM costuma ter desidratação e queda de glicose por trás.',1),
('ciclo','sintoma:seios','alimento','🌰','Magnésio e menos cafeína','A sensibilidade nos seios costuma melhorar com magnésio no prato e menos café nessa fase.',1),
('ciclo','sintoma:acne','alimento','🥛','Observe leite e açúcar','Em muitas mulheres a acne cíclica melhora reduzindo leite e açúcar nessa fase. Vale testar e anotar aqui.',1),
('ciclo','sintoma:tpm','alimento','🍌','Banana, aveia e castanhas','Combinação de magnésio e B6 que ajuda a estabilizar o humor.',1),
('ciclo','sintoma:cansaco','alimento','🥬','Ferro e vitamina C','Cansaço que atravessa vários ciclos merece avaliação de ferro. Enquanto isso, folhas escuras e leguminosas com fruta cítrica.',1)
on conflict (modulo, gatilho, titulo) do nothing;

notify pgrst, 'reload schema';
