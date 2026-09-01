-- ============================================================
--  0078 — A nutri dona do RotuLens não precisa de código
--
--  A leitura de rótulo já reconhece a Ana: `mercado_acesso_liberado`
--  devolve true para ela e para as pacientes, e é isso que libera o
--  limite maior. O ACERVO DE RECEITAS não tinha essa porta — ele só
--  conhece código de assinatura —, então a criadora do app tinha de
--  emitir um código para si mesma e carregá-lo de aparelho em aparelho.
--  Código se perde, vence e some quando ela limpa o navegador.
--
--  Esta função separa "é a nutri" de "é paciente" de propósito. As
--  duas coisas moram juntas em `mercado_acesso_liberado`, e reusá-la
--  aqui abriria o acervo inteiro para todas as pacientes — o acervo é
--  produto pago, e quem decide isso é a Ana, não uma migração.
--
--  Sem grant para anon/authenticated: quem pergunta é a edge function
--  com a service_role, igual à `mercado_acesso_liberado` (0051). O app
--  nunca chama esta função direto.
-- ============================================================

create or replace function public.mercado_e_nutri(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles f
     where f.id = p_uid and f.tipo = 'nutri'
  );
$$;

revoke all on function public.mercado_e_nutri(uuid) from public, anon, authenticated;

notify pgrst, 'reload schema';
