-- ============================================================
--  0081 - O painel devolve o TITULO da receita, nao o slug
--
--  A aba de receitas mostrava "bolo-de-banana" desmontado em
--  "bolo de banana": nome de comida escrito como endereco de URL,
--  tudo em caixa baixa. O titulo certo sempre existiu em
--  mercado_receitas.titulo -- o painel e que nao ia busca-lo.
--
--  Unica mudanca em relacao a 0080: o bloco receitas.top passa a
--  fazer join em mercado_receitas e devolve 'titulo' junto do slug.
--  O slug continua indo, porque e ele que identifica a receita.
-- ============================================================

create or replace function public.mercado_painel(p_dias int default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dias   int := greatest(coalesce(p_dias, 30), 1);
  v_desde  timestamptz := now() - make_interval(days => v_dias);
  v_7d     timestamptz := now() - interval '7 days';
  v_hoje   timestamptz := date_trunc('day', now() at time zone 'America/Sao_Paulo')
                          at time zone 'America/Sao_Paulo';
  v_mes    timestamptz := date_trunc('month', now() at time zone 'America/Sao_Paulo')
                          at time zone 'America/Sao_Paulo';
  v_disp   text[];
  v_cod    text[];
  v_mail   text[];
  v_out    jsonb;
begin
  -- ---------- quem é "interno" ----------
  select coalesce(array_agg(lower(valor)) filter (where tipo = 'email'), '{}'),
         coalesce(array_agg(valor)        filter (where tipo = 'codigo'), '{}'),
         coalesce(array_agg(valor)        filter (where tipo = 'dispositivo'), '{}')
    into v_mail, v_cod, v_disp
  from mercado_internos;

  -- Um e-mail marcado arrasta os códigos que ele comprou...
  v_cod := v_cod || coalesce((
    select array_agg(distinct codigo) from mercado_pagamentos
    where codigo is not null and lower(coalesce(email, '')) = any(v_mail)
  ), '{}');

  -- ...e um código marcado arrasta os aparelhos que o usaram. É assim
  -- que o celular dela sai da conta sozinho depois que ela marca o
  -- próprio código, sem precisar caçar uuid.
  v_disp := v_disp || coalesce((
    select array_agg(distinct dispositivo) from mercado_codigo_dispositivos
    where codigo = any(v_cod)
  ), '{}');

  -- ---------- leituras de gente de verdade ----------
  drop table if exists _an;
  create temp table _an on commit drop as
    select * from mercado_analises a
    where not (coalesce(a.dispositivo, '') = any(v_disp))
      and not (coalesce(a.codigo_credito, '') = any(v_cod));

  select jsonb_build_object(

    'gerado_em', now(),
    'janela_dias', v_dias,

    -- ---------- USO (só gente de verdade) ----------
    'uso', (
      select jsonb_build_object(
        'leituras_total',   count(*),
        'pessoas_total',    count(distinct dispositivo),
        'leituras_janela',  count(*) filter (where criado_em >= v_desde),
        'pessoas_janela',   count(distinct dispositivo) filter (where criado_em >= v_desde),
        'leituras_7d',      count(*) filter (where criado_em >= v_7d),
        'pessoas_7d',       count(distinct dispositivo) filter (where criado_em >= v_7d),
        'leituras_hoje',    count(*) filter (where criado_em >= v_hoje),
        'pessoas_hoje',     count(distinct dispositivo) filter (where criado_em >= v_hoje),
        'leituras_pagas',   count(*) filter (where codigo_credito is not null),
        'leituras_gratis',  count(*) filter (where codigo_credito is null),
        'primeira_leitura', min(criado_em),
        'ultima_leitura',   max(criado_em)
      )
      from _an
    ),

    'fidelidade', (
      select jsonb_build_object(
        'pessoas',        count(*),
        'voltaram',       count(*) filter (where n > 1),
        'tres_ou_mais',   count(*) filter (where n >= 3),
        'media_leituras', round(coalesce(avg(n), 0)::numeric, 2),
        'novas_janela',   count(*) filter (where primeira >= v_desde)
      )
      from (select dispositivo, count(*) n, min(criado_em) primeira from _an group by 1) t
    ),

    'serie', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'dia', d::date, 'leituras', coalesce(x.leituras, 0),
               'pessoas', coalesce(x.pessoas, 0), 'novas', coalesce(y.novas, 0)
             ) order by d), '[]'::jsonb)
      from generate_series(date_trunc('day', v_desde), date_trunc('day', now()), interval '1 day') d
      left join (
        select date_trunc('day', criado_em) dia, count(*) leituras,
               count(distinct dispositivo) pessoas
        from _an where criado_em >= v_desde group by 1
      ) x on x.dia = d
      left join (
        select date_trunc('day', primeira) dia, count(*) novas
        from (select dispositivo, min(criado_em) primeira from _an group by 1) p
        where primeira >= v_desde group by 1
      ) y on y.dia = d
    ),

    -- ---------- QUEM ESTA USANDO, UM A UM ----------
    -- Sem cadastro nao ha nome; o que da para mostrar e o aparelho, o
    -- que ele leu e quando. Serve para ela reconhecer o proprio celular
    -- na lista e tirar da conta com um toque -- e para ver que "5
    -- pessoas" sao cinco historias, nao um numero solto.
    'pessoas', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'dispositivo', dispositivo, 'leituras', n,
               'primeira', primeira, 'ultima', ultima, 'produtos', produtos
             ) order by ultima desc), '[]'::jsonb)
      from (
        select dispositivo, count(*) n, min(criado_em) primeira, max(criado_em) ultima,
               (array_agg(coalesce(nullif(btrim(produto), ''), 'sem nome')
                          order by criado_em desc))[1:3] produtos
        from _an group by 1 order by max(criado_em) desc limit 60
      ) t
    ),

    -- ---------- O QUE FOI TIRADO DA CONTA ----------
    -- Fica na tela, com motivo, para ela conferir e desfazer. Painel
    -- que esconde o próprio filtro é tão ruim quanto painel inflado.
    'internos', (
      select jsonb_build_object(
        'leituras',  (select count(*) from mercado_analises) - (select count(*) from _an),
        'aparelhos', (select count(distinct dispositivo) from mercado_analises)
                     - (select count(distinct dispositivo) from _an),
        'itens', coalesce((
          select jsonb_agg(jsonb_build_object(
                   'tipo', i.tipo, 'valor', i.valor, 'motivo', i.motivo,
                   'criado_em', i.criado_em,
                   'leituras', case when i.tipo = 'dispositivo'
                     then (select count(*) from mercado_analises a where a.dispositivo = i.valor)
                     when i.tipo = 'codigo'
                     then (select count(*) from mercado_analises a where a.codigo_credito = i.valor)
                     else 0 end,
                   'ultima', case when i.tipo = 'dispositivo'
                     then (select max(criado_em) from mercado_analises a where a.dispositivo = i.valor)
                     when i.tipo = 'codigo'
                     then (select max(criado_em) from mercado_analises a where a.codigo_credito = i.valor)
                     else null end
                 ) order by i.tipo, i.criado_em)
          from mercado_internos i
        ), '[]'::jsonb)
      )
    ),

    -- ---------- CUSTO (aqui entra tudo: a OpenAI cobra o teste também) ----------
    'custo', (
      select jsonb_build_object(
        'usd_total',  round(coalesce(sum(custo_usd), 0)::numeric, 4),
        'usd_mes',    round(coalesce(sum(custo_usd) filter (where criado_em >= v_mes), 0)::numeric, 4),
        'usd_janela', round(coalesce(sum(custo_usd) filter (where criado_em >= v_desde), 0)::numeric, 4),
        'medido',     count(*) filter (where custo_usd is not null),
        'usd_publico', (select round(coalesce(sum(custo_usd), 0)::numeric, 4) from _an),
        'medido_publico', (select count(*) filter (where custo_usd is not null) from _an)
      )
      from mercado_analises
    ),

    -- ---------- QUEM ASSINOU ----------
    -- Assinatura interna não some da lista: vem marcada, e o painel a
    -- mostra separada. Some seria pior — ela lembraria do código e
    -- acharia que o painel perdeu dado.
    'assinantes', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'codigo', s.codigo, 'plano', s.plano,
               'criado_em', s.criado_em, 'expira_em', s.expira_em,
               'ativa', s.expira_em > now(),
               'renovacoes', s.renovacoes, 'ultimo_uso', s.ultimo_uso,
               'valor_centavos', s.valor_centavos,
               'email', p.email, 'nome', p.nome, 'telefone', p.telefone,
               'aparelhos', coalesce(d.n, 0), 'leituras', coalesce(l.n, 0),
               'interno', (s.codigo = any(v_cod)) or (lower(coalesce(p.email, '')) = any(v_mail))
             ) order by s.criado_em desc), '[]'::jsonb)
      from mercado_assinaturas s
      left join lateral (
        select email, nome, telefone from mercado_pagamentos
        where codigo = s.codigo
        order by (email is not null) desc, criado_em desc limit 1
      ) p on true
      left join (select codigo, count(*) n from mercado_codigo_dispositivos group by 1) d
        on d.codigo = s.codigo
      left join (select codigo_credito, count(*) n from mercado_analises group by 1) l
        on l.codigo_credito = s.codigo
    ),

    'creditos', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'codigo', c.codigo, 'total', c.creditos_total, 'usados', c.creditos_usados,
               'criado_em', c.criado_em, 'ultimo_uso', c.ultimo_uso,
               'valor_centavos', c.valor_centavos,
               'email', p.email, 'nome', p.nome, 'telefone', p.telefone,
               'interno', (c.codigo = any(v_cod)) or (lower(coalesce(p.email, '')) = any(v_mail))
             ) order by c.criado_em desc), '[]'::jsonb)
      from mercado_creditos c
      left join lateral (
        select email, nome, telefone from mercado_pagamentos
        where codigo = c.codigo
        order by (email is not null) desc, criado_em desc limit 1
      ) p on true
    ),

    -- ---------- DINHEIRO ----------
    -- Dinheiro dela mesma não é receita: sai do bolso e volta pro bolso
    -- (menos a taxa). Fica na chave *_interno, para a tela mostrar do
    -- lado sem inflar o número que ela usa para decidir preço.
    'receita', (
      select jsonb_build_object(
        'centavos_total', coalesce(sum(valor_centavos) filter (
            where status = 'entregue' and not interno), 0),
        'centavos_mes',   coalesce(sum(valor_centavos) filter (
            where status = 'entregue' and not interno and criado_em >= v_mes), 0),
        'pagamentos',     count(*) filter (where status = 'entregue' and not interno),
        'com_erro',       count(*) filter (where status <> 'entregue'),
        'centavos_interno', coalesce(sum(valor_centavos) filter (
            where status = 'entregue' and interno), 0),
        'pagamentos_interno', count(*) filter (where status = 'entregue' and interno),
        'assinaturas_ativas', (
          select count(*) from mercado_assinaturas
          where expira_em > now() and not (codigo = any(v_cod))),
        'assinaturas_vencidas', (
          select count(*) from mercado_assinaturas
          where expira_em <= now() and not (codigo = any(v_cod))),
        'assinaturas_internas', (
          select count(*) from mercado_assinaturas where codigo = any(v_cod))
      )
      from (
        select valor_centavos, status, criado_em,
               (lower(coalesce(email, '')) = any(v_mail))
               or (coalesce(codigo, '') = any(v_cod)) as interno
        from mercado_pagamentos
      ) t
    ),

    'pagamentos', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'criado_em', criado_em, 'email', email, 'nome', nome,
               'produto', produto, 'order_nsu', order_nsu,
               'valor_centavos', valor_centavos, 'codigo', codigo,
               'status', status, 'detalhe', detalhe,
               'interno', (lower(coalesce(email, '')) = any(v_mail))
                          or (coalesce(codigo, '') = any(v_cod))
             ) order by criado_em desc), '[]'::jsonb)
      from (select * from mercado_pagamentos order by criado_em desc limit 30) t
    ),

    -- ---------- RECEITAS E AVALIAÇÕES ----------
    'receitas', (
      select jsonb_build_object(
        'aparelhos', (select count(distinct dispositivo) from mercado_receitas_vistas
                      where not (coalesce(dispositivo, '') = any(v_disp))),
        'aberturas', (select count(*) from mercado_receitas_vistas
                      where not (coalesce(dispositivo, '') = any(v_disp))),
        'top', (
          select coalesce(jsonb_agg(jsonb_build_object(
                   'slug', r.slug, 'titulo', coalesce(rc.titulo, r.slug), 'n', r.n
                 ) order by r.n desc), '[]'::jsonb)
          from (
            select slug, count(*) n from mercado_receitas_vistas
            where not (coalesce(dispositivo, '') = any(v_disp))
            group by 1 order by n desc limit 8
          ) r
          left join mercado_receitas rc on rc.slug = r.slug
        )
      )
    ),

    -- Avaliação é palavra de gente: mesmo se vier de aparelho marcado,
    -- ela quer ler. Não filtra; só marca.
    'avaliacoes', (
      select jsonb_build_object(
        'total', count(*),
        'media', round(coalesce(avg(nota), 0)::numeric, 2),
        'sem_tratar', count(*) filter (where tratada is not true),
        'ultimas', (
          select coalesce(jsonb_agg(jsonb_build_object(
                   'criado_em', criado_em, 'nota', nota, 'comentario', comentario,
                   'contato', contato, 'tela', tela, 'assinante', assinante,
                   'interno', (coalesce(dispositivo, '') = any(v_disp))
                 ) order by criado_em desc), '[]'::jsonb)
          from (select * from mercado_avaliacoes order by criado_em desc limit 10) u
        )
      )
      from mercado_avaliacoes
    ),

    -- ---------- O QUE ESTÃO LENDO ----------
    'produtos', (
      select coalesce(jsonb_agg(jsonb_build_object('nome', nome, 'n', n) order by n desc), '[]'::jsonb)
      from (
        select coalesce(nullif(btrim(produto), ''), 'sem nome') nome, count(*) n
        from _an group by 1 order by n desc limit 10
      ) t
    ),

    'categorias', (
      select coalesce(jsonb_agg(jsonb_build_object('nome', nome, 'n', n) order by n desc), '[]'::jsonb)
      from (
        select coalesce(nullif(btrim(categoria), ''), 'sem categoria') nome, count(*) n
        from _an group by 1 order by n desc limit 10
      ) t
    ),

    'vereditos', (
      select coalesce(jsonb_object_agg(coalesce(veredito, 'sem veredito'), n), '{}'::jsonb)
      from (select veredito, count(*) n from _an group by 1) t
    )

  ) into v_out;

  return v_out;
end;
$$;

comment on function public.mercado_painel(int) is
  'Números do RotuLens para o painel da Ana, já sem o uso dela mesma (lista mercado_internos). Só o service_role executa.';

revoke all on function public.mercado_painel(int) from public;
revoke all on function public.mercado_painel(int) from anon;
revoke all on function public.mercado_painel(int) from authenticated;
grant execute on function public.mercado_painel(int) to service_role;
