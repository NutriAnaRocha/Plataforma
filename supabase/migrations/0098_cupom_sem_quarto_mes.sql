-- 0098 · O cupom da embaixadora não dá mais o 4º mês com 50% off (17/09/2026).
-- Todo mundo paga R$ 39,95 nos 3 primeiros meses; o cupom só registra a indicação.
create or replace function public.nutriplat_preco(p_user uuid, p_ciclo text)
returns int language sql stable security definer set search_path = public as $$
  select case
    when p_ciclo = 'anual'     then 71900
    when p_ciclo = 'semestral' then 41940
    when coalesce(p.assinatura_pagamentos, 0) < 3 then 3995
    else 7990 end
  from public.profiles p where p.id = p_user;
$$;

notify pgrst, 'reload schema';
