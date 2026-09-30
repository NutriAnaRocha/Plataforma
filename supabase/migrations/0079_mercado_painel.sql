-- ============================================================
--  0079 — Painel do RotuLens (números para a Ana)
--
--  Uma função só, que devolve TUDO que o painel mostra num único
--  jsonb. Motivo: o painel é uma tela de leitura; fazer dez
--  consultas pelo PostgREST significaria dez viagens e dez lugares
--  para a RLS vazar. Aqui a conta é feita no banco e sai pronta.
--
--  Segurança: security definer, mas o EXECUTE é revogado de todo
--  mundo — nem anon nem authenticated podem chamar. Só o
--  service_role, de dentro da edge function `mercado-painel`, que
--  antes confere profiles.is_admin do chamador. Quem entra no app
--  não tem como pedir esses dados.
--
--  Vocabulário: o RotuLens não tem conta de usuário. O que existe é
--  "dispositivo" — um id gravado no aparelho. Então "pessoas" aqui
--  é sempre APARELHOS DISTINTOS: quem troca de celular conta duas
--  vezes, quem limpa os dados do site conta de novo. É a melhor
--  medida possível sem pedir cadastro, e o painel diz isso na tela.
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
  v_out    jsonb;
begin
  select jsonb_build_object(

    'gerado_em', now(),
    'janela_dias', v_dias,

    -- ---------- USO ----------
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
      from mercado_analises
    ),

    -- Quem voltou: aparelho com mais de uma leitura. É o número que diz
    -- se o app grudou ou se foi só curiosidade de uma vez.
    'fidelidade', (
      select jsonb_build_object(
        'pessoas',        count(*),
        'voltaram',       count(*) filter (where n > 1),
        'tres_ou_mais',   count(*) filter (where n >= 3),
        'media_leituras', round(coalesce(avg(n), 0)::numeric, 2),
        'novas_janela',   count(*) filter (where primeira >= v_desde)
      )
      from (
        select dispositivo, count(*) n, min(criado_em) primeira
        from mercado_analises group by 1
      ) t
    ),

    -- Série por dia, para o gráfico. Dias sem leitura entram com zero:
    -- buraco no gráfico é informação, não pode sumir.
    'serie', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'dia', d::date, 'leituras', coalesce(x.leituras, 0),
               'pessoas', coalesce(x.pessoas, 0), 'novas', coalesce(y.novas, 0)
             ) order by d), '[]'::jsonb)
      from generate_series(date_trunc('day', v_desde), date_trunc('day', now()), interval '1 day') d
      left join (
        select date_trunc('day', criado_em) dia, count(*) leituras,
               count(distinct dispositivo) pessoas
        from mercado_analises where criado_em >= v_desde group by 1
      ) x on x.dia = d
      left join (
        select date_trunc('day', primeira) dia, count(*) novas
        from (select dispositivo, min(criado_em) primeira from mercado_analises group by 1) p
        where primeira >= v_desde group by 1
      ) y on y.dia = d
    ),

    -- ---------- CUSTO (o que a OpenAI cobra) ----------
    'custo', (
      select jsonb_build_object(
        'usd_total',  round(coalesce(sum(custo_usd), 0)::numeric, 4),
        'usd_mes',    round(coalesce(sum(custo_usd) filter (where criado_em >= v_mes), 0)::numeric, 4),
        'usd_janela', round(coalesce(sum(custo_usd) filter (where criado_em >= v_desde), 0)::numeric, 4),
        'medido',     count(*) filter (where custo_usd is not null)
      )
      from mercado_analises
    ),

    -- ---------- QUEM ASSINOU ----------
    -- O e-mail não está na assinatura: ele vem do pagamento que gerou o
    -- código (mercado_pagamentos.codigo). Sem pagamento casado — código
    -- criado à mão, por exemplo — o campo vem nulo, e é assim que tem de
    -- aparecer na tela: em branco, não inventado.
    'assinantes', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'codigo', s.codigo, 'plano', s.plano,
               'criado_em', s.criado_em, 'expira_em', s.expira_em,
               'ativa', s.expira_em > now(),
               'renovacoes', s.renovacoes, 'ultimo_uso', s.ultimo_uso,
               'valor_centavos', s.valor_centavos,
               'email', p.email, 'nome', p.nome, 'telefone', p.telefone,
               'aparelhos', coalesce(d.n, 0), 'leituras', coalesce(l.n, 0)
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

    -- Pacote de leituras avulsas (quem comprou crédito, não assinatura).
    'creditos', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'codigo', c.codigo, 'total', c.creditos_total, 'usados', c.creditos_usados,
               'criado_em', c.criado_em, 'ultimo_uso', c.ultimo_uso,
               'valor_centavos', c.valor_centavos,
               'email', p.email, 'nome', p.nome, 'telefone', p.telefone
             ) order by c.criado_em desc), '[]'::jsonb)
      from mercado_creditos c
      left join lateral (
        select email, nome, telefone from mercado_pagamentos
        where codigo = c.codigo
        order by (email is not null) desc, criado_em desc limit 1
      ) p on true
    ),

    -- ---------- DINHEIRO ----------
    'receita', (
      select jsonb_build_object(
        -- Só dinheiro que virou entrega conta como receita: o webhook grava
        -- também teste e erro, e somar isso inflaria o número que ela usa
        -- para decidir preço.
        'centavos_total', coalesce(sum(valor_centavos) filter (where status = 'entregue'), 0),
        'centavos_mes',   coalesce(sum(valor_centavos) filter (where status = 'entregue' and criado_em >= v_mes), 0),
        'pagamentos',     count(*) filter (where status = 'entregue'),
        'com_erro',       count(*) filter (where status not in ('entregue')),
        'assinaturas_ativas', (select count(*) from mercado_assinaturas where expira_em > now()),
        'assinaturas_vencidas', (select count(*) from mercado_assinaturas where expira_em <= now())
      )
      from mercado_pagamentos
    ),

    'pagamentos', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'criado_em', criado_em, 'email', email, 'nome', nome,
               'produto', produto, 'order_nsu', order_nsu,
               'valor_centavos', valor_centavos, 'codigo', codigo,
               'status', status, 'detalhe', detalhe
             ) order by criado_em desc), '[]'::jsonb)
      from (select * from mercado_pagamentos order by criado_em desc limit 30) t
    ),

    -- ---------- RECEITAS E AVALIAÇÕES ----------
    'receitas', (
      select jsonb_build_object(
        'aparelhos', (select count(distinct dispositivo) from mercado_receitas_vistas),
        'aberturas', (select count(*) from mercado_receitas_vistas),
        'top', (
          select coalesce(jsonb_agg(jsonb_build_object('slug', slug, 'n', n) order by n desc), '[]'::jsonb)
          from (select slug, count(*) n from mercado_receitas_vistas group by 1 order by n desc limit 8) r
        )
      )
    ),

    'avaliacoes', (
      select jsonb_build_object(
        'total', count(*),
        'media', round(coalesce(avg(nota), 0)::numeric, 2),
        'sem_tratar', count(*) filter (where tratada is not true),
        'ultimas', (
          select coalesce(jsonb_agg(jsonb_build_object(
                   'criado_em', criado_em, 'nota', nota, 'comentario', comentario,
                   'contato', contato, 'tela', tela, 'assinante', assinante
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
        from mercado_analises group by 1 order by n desc limit 10
      ) t
    ),

    'categorias', (
      select coalesce(jsonb_agg(jsonb_build_object('nome', nome, 'n', n) order by n desc), '[]'::jsonb)
      from (
        select coalesce(nullif(btrim(categoria), ''), 'sem categoria') nome, count(*) n
        from mercado_analises group by 1 order by n desc limit 10
      ) t
    ),

    'vereditos', (
      select coalesce(jsonb_object_agg(coalesce(veredito, 'sem veredito'), n), '{}'::jsonb)
      from (select veredito, count(*) n from mercado_analises group by 1) t
    )

  ) into v_out;

  return v_out;
end;
$$;

comment on function public.mercado_painel(int) is
  'Números do RotuLens para o painel da Ana. Só o service_role executa; a edge function mercado-painel confere is_admin antes.';

revoke all on function public.mercado_painel(int) from public;
revoke all on function public.mercado_painel(int) from anon;
revoke all on function public.mercado_painel(int) from authenticated;
grant execute on function public.mercado_painel(int) to service_role;
