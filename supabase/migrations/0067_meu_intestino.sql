-- ============================================================
--  Plataforma Nutri — Migração 0067
--  MEU INTESTINO FELIZ — o paciente registra o funcionamento
--  intestinal do dia (constipado / regular / diarreia, escala de
--  Bristol, sintomas) e a plataforma devolve, na hora, dicas de chá,
--  alimento e hábito. A nutri lê a série no prontuário.
--
--  QUEM ESCREVE: o PRÓPRIO PACIENTE, direto pelo client. É o inverso
--  do Diário do prato (0050), e de propósito: lá o número vinha da IA
--  e precisava ser inviolável para ter sentido clínico; aqui o dado É
--  o relato do paciente. Não existe versão "mais verdadeira" que ele
--  possa falsear. A nutri, por isso, só LÊ: se ela pudesse reescrever
--  o relato, o histórico deixaria de ser relato.
--
--  UM REGISTRO POR DIA: unique (paciente_id, data) para o app poder
--  fazer upsert enquanto a pessoa mexe nos chips, sem criar cinco
--  linhas do mesmo dia. A tela salva sozinha, com debounce.
--
--  DICAS: tabela editorial `dicas_conteudo`, curada pela nutri e
--  compartilhada com o módulo do ciclo (0068). NÃO é IA: o conteúdo é
--  escrito por profissional, revisado, e a mesma entrada aparece
--  igual para todo mundo. Isso mantém orientação alimentar GERAL —
--  sem diagnóstico, sem dose, sem prescrição (Res. CFN 856/2026).
--  Ninguém com login de paciente ou de nutri escreve aqui: a curadoria
--  entra por SQL (service_role). A tela é só leitura.
-- ============================================================

-- ------------------------------------------------------------
-- 1) BASE EDITORIAL DE DICAS (compartilhada com 0068)
-- ------------------------------------------------------------
create table if not exists public.dicas_conteudo (
  id       uuid primary key default gen_random_uuid(),
  modulo   text not null check (modulo in ('intestino', 'ciclo')),
  -- Chave de casamento com o que o paciente registrou. Namespaced,
  -- como as marcas de plano_adesao (0005): 'constipado', 'regular',
  -- 'sintoma:colica', 'fase:lutea'. Uma dica serve a um gatilho só —
  -- repetir a linha é mais barato que manter array e filtrar no client.
  gatilho  text not null,
  tipo     text not null check (tipo in ('cha', 'alimento', 'habito')),
  emoji    text,
  titulo   text not null,
  texto    text not null,
  ordem    int  not null default 0,
  ativo    boolean not null default true
);

comment on column public.dicas_conteudo.gatilho is
  'Chave do que o paciente registrou: classificacao do intestino, "sintoma:<slug>" ou "fase:<slug>" do ciclo.';

create index if not exists dicas_modulo_gatilho_idx
  on public.dicas_conteudo (modulo, gatilho, ordem);

-- Chave natural para o seed ser idempotente (re-rodar a migration não duplica).
create unique index if not exists dicas_chave_idx
  on public.dicas_conteudo (modulo, gatilho, titulo);

alter table public.dicas_conteudo enable row level security;

-- Conteúdo editorial: todo mundo logado lê o que está ativo.
drop policy if exists "dicas_select" on public.dicas_conteudo;
create policy "dicas_select" on public.dicas_conteudo
  for select to authenticated using (ativo);

-- Sem insert/update/delete: a curadoria entra por service_role.

-- ------------------------------------------------------------
-- 2) REGISTROS DO INTESTINO
-- ------------------------------------------------------------
create table if not exists public.intestino_registros (
  id            uuid primary key default gen_random_uuid(),
  paciente_id   uuid not null references public.pacientes(id) on delete cascade,
  data          date not null default current_date,

  classificacao text not null check (classificacao in ('constipado', 'regular', 'diarreia')),
  -- Escala de Bristol (1 a 7). Opcional: quem não quiser detalhar
  -- registra só a carinha, e o registro continua válido.
  bristol       int check (bristol between 1 and 7),
  evacuacoes    int not null default 0 check (evacuacoes between 0 and 20),
  sintomas      jsonb not null default '[]'::jsonb,  -- ['inchaco','gases','dor','esforco',...]
  observacao    text,

  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  unique (paciente_id, data)
);

create index if not exists intestino_paciente_idx
  on public.intestino_registros (paciente_id, data desc);

alter table public.intestino_registros enable row level security;

-- O paciente é dono do próprio relato: lê, cria, corrige e apaga.
drop policy if exists "intestino_all_paciente" on public.intestino_registros;
create policy "intestino_all_paciente" on public.intestino_registros
  for all to authenticated
  using (
    exists (
      select 1 from public.pacientes p
       where p.id = intestino_registros.paciente_id
         and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.pacientes p
       where p.id = intestino_registros.paciente_id
         and p.user_id = auth.uid()
    )
  );

-- A nutri acompanha, mas não reescreve o relato de ninguém.
drop policy if exists "intestino_select_nutri" on public.intestino_registros;
create policy "intestino_select_nutri" on public.intestino_registros
  for select to authenticated using (
    exists (
      select 1 from public.pacientes p
       where p.id = intestino_registros.paciente_id
         and p.nutricionista_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 3) SEED — dicas de intestino
--    Linguagem de orientação geral, na voz da Ana. Sem dose, sem
--    posologia, sem promessa de cura. Toda tela que mostra isto
--    repete que quem ajusta o caso é a nutricionista.
-- ------------------------------------------------------------
insert into public.dicas_conteudo (modulo, gatilho, tipo, emoji, titulo, texto, ordem) values
-- CONSTIPADO
('intestino','constipado','cha','🍵','Chá de camomila morno','Morno, à noite, ajuda a relaxar a musculatura e a criar rotina de horário. O próprio hábito de sentar sempre no mesmo horário já é metade do caminho.',1),
('intestino','constipado','cha','🌿','Chá de erva-doce','Bom depois das refeições quando vem aquela sensação de estufamento junto com o intestino parado.',2),
('intestino','constipado','alimento','🥝','Kiwi com a casca','Dois kiwis maduros, de preferência com a casca lavada, são um dos alimentos com melhor resposta para intestino lento.',3),
('intestino','constipado','alimento','🍑','Ameixa preta demolhada','Deixe de molho na água à noite e tome a água junto com as ameixas pela manhã.',4),
('intestino','constipado','alimento','🌾','Mamão com aveia e linhaça','A fibra do mamão com a aveia forma um gel que dá volume e maciez ao bolo fecal. Linhaça sempre triturada na hora.',5),
('intestino','constipado','alimento','🥬','Mais folhas e legumes no prato','Metade do prato colorida em duas refeições do dia. Fibra que não veio da comida raramente vem de outro lugar.',6),
('intestino','constipado','habito','💧','Água ao longo do dia','Fibra sem água endurece em vez de soltar. Se você aumentou a fibra e piorou, quase sempre falta líquido.',7),
('intestino','constipado','habito','🚶','Caminhada de 20 a 30 minutos','Movimento do corpo é movimento do intestino. Vale caminhada, dança, escada — o que você mantiver.',8),
('intestino','constipado','habito','⏰','Horário fixo para ir ao banheiro','Tente sempre no mesmo horário, sem pressa e sem celular. O intestino responde muito bem à rotina.',9),
('intestino','constipado','habito','🦶','Banquinho para apoiar os pés','Elevar os joelhos acima do quadril alinha o canal e reduz o esforço. Um banquinho baixo resolve.',10),

-- DIARREIA
('intestino','diarreia','cha','🍵','Chá de camomila','Calmante e sem cafeína. Ajuda quando vem junto com cólica e nervosismo.',1),
('intestino','diarreia','cha','🌱','Chá de hortelã','Ameniza o desconforto abdominal. Prefira morno, em pequenos goles ao longo do dia.',2),
('intestino','diarreia','alimento','🍌','Banana bem madura','Amassada, sozinha ou com aveia. É a fruta mais bem tolerada nesses dias.',3),
('intestino','diarreia','alimento','🍚','Arroz branco e batata cozida','Nesses dias o integral costuma acelerar mais. Voltar ao branco por um ou dois dias é estratégia, não retrocesso.',4),
('intestino','diarreia','alimento','🍏','Maçã cozida sem casca','A pectina da maçã cozida ajuda a dar consistência.',5),
('intestino','diarreia','habito','💧','Reposição de líquidos','O que mais preocupa na diarreia é a perda de água e sais. Beba em goles frequentes, e água de coco ajuda.',6),
('intestino','diarreia','habito','🚫','Segure na gordura, no leite e no café','Fritura, leite puro, café e adoçante em pó costumam piorar enquanto o intestino está irritado.',7),

-- REGULAR
('intestino','regular','alimento','🥣','Mantenha a fibra que já está funcionando','Está regular: o que você está fazendo funciona. Fibra, água e movimento são os três pilares que sustentam isso.',1),
('intestino','regular','alimento','🫙','Alimentos fermentados','Iogurte natural, kefir e chucrute ajudam a manter a microbiota, mesmo quando está tudo bem.',2),
('intestino','regular','habito','📝','Continue registrando','O valor deste espaço aparece no histórico. Registrar nos dias bons é o que permite reconhecer o dia ruim.',3),

-- SINTOMAS
('intestino','sintoma:inchaco','cha','🌿','Chá de erva-doce ou funcho','Clássico para sensação de estufamento depois das refeições.',1),
('intestino','sintoma:inchaco','habito','🍽️','Comer devagar e mastigar bem','Boa parte do inchaço é ar engolido junto com a comida rápida.',2),
('intestino','sintoma:gases','cha','🫚','Chá de gengibre','Ajuda no desconforto e na digestão mais lenta.',1),
('intestino','sintoma:gases','alimento','🫘','Deixe o feijão de molho','Trocar a água de molho antes de cozinhar reduz bastante os gases sem tirar o feijão do prato.',2),
('intestino','sintoma:dor','cha','🍵','Compressa morna e chá de camomila','Calor local e chá morno relaxam a musculatura durante a cólica.',1),
('intestino','sintoma:esforco','habito','🦶','Apoie os pés e não force','Esforço repetido machuca. Apoie os pés num banquinho e, se não vier, levante e tente mais tarde.',1)
on conflict (modulo, gatilho, titulo) do nothing;

notify pgrst, 'reload schema';
