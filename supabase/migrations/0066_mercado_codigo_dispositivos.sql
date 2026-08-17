-- Quantos aparelhos podem usar o MESMO código do RotuLens.
--
-- O buraco que isto fecha: o código é a única credencial do app (não há
-- login), então ele pode ser colado num grupo de WhatsApp e usado por 200
-- pessoas. Os tetos que já existiam seguram o VOLUME (25/dia no pacote
-- pré-pago, 100/mês na assinatura), mas não impedem que uma assinatura de
-- R$ 11,99 vire o app de meio bairro dentro desse volume.
--
-- Por que 3 e não 1: a mesma pessoa usa celular e tablet, troca de aparelho,
-- limpa os dados do navegador (o id do dispositivo é um uuid do localStorage —
-- limpar o site gera um id novo). Travar em 1 transformaria cada limpeza de
-- cache num pedido de suporte para a Ana.
--
-- Por que a janela de 30 dias: sem ela, três limpezas de cache queimariam as
-- três vagas PARA SEMPRE. Aqui a vaga de um aparelho que sumiu há mais de 30
-- dias volta sozinha para o bolo — o abuso real (muita gente ao mesmo tempo)
-- continua barrado, e o caso chato (a mesma pessoa trocando de aparelho ao
-- longo do tempo) se resolve sem ninguém precisar falar com a Ana.

create table if not exists public.mercado_codigo_dispositivos (
  codigo        text not null,
  dispositivo   text not null check (length(dispositivo) between 8 and 64),
  primeiro_uso  timestamptz not null default now(),
  ultimo_uso    timestamptz not null default now(),
  primary key (codigo, dispositivo)
);

-- A pergunta que a função faz é sempre "quantos aparelhos deste código estão
-- ativos", nesta ordem de colunas.
create index if not exists mercado_codigo_dispositivos_ativos
  on public.mercado_codigo_dispositivos (codigo, ultimo_uso desc);

alter table public.mercado_codigo_dispositivos enable row level security;
-- Sem policy nenhuma: com RLS ligado e nada liberado, anon e authenticated não
-- enxergam nem escrevem. Quem mexe é a edge function (service_role) pela
-- função abaixo. A tabela diz quantos aparelhos usam um código pago — é dado
-- de fiscalização, não pode ficar legível para o cliente.
revoke all on public.mercado_codigo_dispositivos from anon, authenticated;

-- Registra o aparelho e diz se ele pode usar o código.
--
-- Faz as duas coisas de uma vez de propósito: se a checagem e o registro
-- fossem chamadas separadas, duas leituras simultâneas de aparelhos
-- diferentes passariam as duas pela contagem antes de qualquer uma gravar.
create or replace function public.mercado_dispositivo_ok(
  p_codigo      text,
  p_dispositivo text,
  p_limite      int default 3,
  p_janela_dias int default 30
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cod    text := upper(btrim(coalesce(p_codigo, '')));
  v_desde  timestamptz := now() - make_interval(days => greatest(p_janela_dias, 1));
  v_ativos int;
begin
  if v_cod = '' or coalesce(length(p_dispositivo), 0) < 8 then
    return jsonb_build_object('ok', false, 'motivo', 'parametro');
  end if;

  -- Aparelho já conhecido: só renova o carimbo e passa. Ele nunca esbarra no
  -- limite, mesmo que o limite tenha sido baixado depois — quem já estava
  -- dentro não é expulso.
  update public.mercado_codigo_dispositivos
     set ultimo_uso = now()
   where codigo = v_cod and dispositivo = p_dispositivo;
  if found then
    return jsonb_build_object('ok', true, 'novo', false);
  end if;

  select count(*) into v_ativos
    from public.mercado_codigo_dispositivos
   where codigo = v_cod and ultimo_uso >= v_desde;

  if v_ativos >= p_limite then
    return jsonb_build_object(
      'ok', false, 'motivo', 'limite',
      'aparelhos', v_ativos, 'limite', p_limite
    );
  end if;

  insert into public.mercado_codigo_dispositivos (codigo, dispositivo)
  values (v_cod, p_dispositivo)
  on conflict (codigo, dispositivo) do update set ultimo_uso = now();

  return jsonb_build_object(
    'ok', true, 'novo', true,
    'aparelhos', v_ativos + 1, 'limite', p_limite
  );
end;
$$;

-- Só o servidor chama. Exposta ao anon, ela viraria um oráculo para descobrir
-- quantos aparelhos usam um código — e um jeito de queimar as vagas alheias.
revoke execute on function public.mercado_dispositivo_ok(text, text, int, int) from public, anon, authenticated;
grant execute on function public.mercado_dispositivo_ok(text, text, int, int) to service_role;

notify pgrst, 'reload schema';
