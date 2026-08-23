-- ============================================================
--  Plataforma Nutri — Migração 0077
--  Inteligência Clínica: a nutri só vê (e só edita) o que é dela
--
--  DOIS DEFEITOS NA MESMA LINHA, nas 5 views da IC:
--
--  1) A view não era `security_invoker`, então rodava com os direitos
--     do dono e IGNORAVA a RLS da tabela base. A policy de select
--     ("dono nulo OU auth.uid() = dono") estava certa e nunca era
--     aplicada: uma nutri via as formulações, protocolos, receitas,
--     orientações e exames PRIVADOS de outra nutri.
--
--  2) `editavel` era `nutricionista_id IS NOT NULL` — ou seja, "tem
--     algum dono", não "o dono sou eu". A tela marcava com o selo
--     "minha" e oferecia editar o que era de outra pessoa. O UPDATE e
--     o DELETE eram barrados pela RLS (silenciosamente, 0 linhas), o
--     que fazia o botão parecer quebrado em vez de proibido.
--
--  Apareceu ao ligar a lixeira no banco de formulações (23/08/2026):
--  a conta de teste via 4 formulações "minhas" tendo criado 2.
--
--  As definições abaixo são as mesmas de antes, com `editavel`
--  corrigido e `security_invoker` ligado.
-- ============================================================

-- ic_exames_meus
create or replace view public.ic_exames_meus as
SELECT id,
    nutricionista_id,
    origem_id,
    nome,
    slug,
    sinonimos,
    unidade,
    eixo,
    grupo,
    ref_convencional,
    ref_funcional,
    interpretacao_clinica,
    interpretacao_funcional,
    nutrientes,
    sinais_alto,
    sinais_baixo,
    estrategia_alto,
    estrategia_baixo,
    atencao,
    referencias,
    ativo,
    oculto,
    notas_pessoais,
    created_at,
    updated_at,
    (nutricionista_id = auth.uid()) IS TRUE AS editavel
   FROM ic_exames e
  WHERE ativo AND NOT (EXISTS ( SELECT 1
           FROM ic_exames_ocultos o
          WHERE o.exame_id = e.id AND o.nutricionista_id = auth.uid()));

alter view public.ic_exames_meus set (security_invoker = true);

-- ic_formulacoes_minhas
create or replace view public.ic_formulacoes_minhas as
SELECT id,
    nutricionista_id,
    origem_id,
    nome,
    slug,
    sinonimos,
    categoria,
    eixo,
    grupo,
    indicacao,
    formulas,
    observacoes,
    interacoes,
    quando_encaminhar,
    atencao,
    referencias,
    notas_pessoais,
    ativo,
    created_at,
    updated_at,
    (nutricionista_id = auth.uid()) IS TRUE AS editavel
   FROM ic_formulacoes f
  WHERE ativo AND NOT (EXISTS ( SELECT 1
           FROM ic_formulacoes_ocultas x
          WHERE x.formulacao_id = f.id AND x.nutricionista_id = auth.uid()));

alter view public.ic_formulacoes_minhas set (security_invoker = true);

-- ic_orientacoes_minhas
create or replace view public.ic_orientacoes_minhas as
SELECT id,
    nutricionista_id,
    origem_id,
    nome,
    slug,
    sinonimos,
    categoria,
    eixo,
    grupo,
    resumo,
    blocos,
    dica_pratica,
    referencias,
    atencao,
    notas_pessoais,
    ativo,
    created_at,
    updated_at,
    (nutricionista_id = auth.uid()) IS TRUE AS editavel
   FROM ic_orientacoes o
  WHERE ativo AND NOT (EXISTS ( SELECT 1
           FROM ic_orientacoes_ocultas x
          WHERE x.orientacao_id = o.id AND x.nutricionista_id = auth.uid()));

alter view public.ic_orientacoes_minhas set (security_invoker = true);

-- ic_protocolos_meus
create or replace view public.ic_protocolos_meus as
SELECT id,
    nutricionista_id,
    origem_id,
    nome,
    slug,
    sinonimos,
    eixo,
    grupo,
    objetivo_clinico,
    estrategia,
    nutrientes,
    exames_slugs,
    sinais_sintomas,
    materiais_apoio,
    referencias,
    quando_encaminhar,
    atencao,
    notas_pessoais,
    ativo,
    created_at,
    updated_at,
    (nutricionista_id = auth.uid()) IS TRUE AS editavel
   FROM ic_protocolos p
  WHERE ativo AND NOT (EXISTS ( SELECT 1
           FROM ic_protocolos_ocultos o
          WHERE o.protocolo_id = p.id AND o.nutricionista_id = auth.uid()));

alter view public.ic_protocolos_meus set (security_invoker = true);

-- ic_receitas_minhas
create or replace view public.ic_receitas_minhas as
SELECT id,
    nutricionista_id,
    origem_id,
    nome,
    slug,
    sinonimos,
    categoria,
    tags,
    resumo,
    porcoes,
    tempo_min,
    kcal_porcao,
    ingredientes,
    modo_preparo,
    dica,
    atencao,
    notas_pessoais,
    ativo,
    created_at,
    updated_at,
    (nutricionista_id = auth.uid()) IS TRUE AS editavel
   FROM ic_receitas r
  WHERE ativo AND NOT (EXISTS ( SELECT 1
           FROM ic_receitas_ocultas x
          WHERE x.receita_id = r.id AND x.nutricionista_id = auth.uid()));

alter view public.ic_receitas_minhas set (security_invoker = true);
