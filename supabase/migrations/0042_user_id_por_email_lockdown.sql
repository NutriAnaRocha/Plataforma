-- ============================================================
--  Plataforma Nutri — Migração 0042
--  Correção de segurança: travar public.user_id_por_email.
--
--  A função é SECURITY DEFINER e lê auth.users (email → id). Por padrão o
--  EXECUTE ia para PUBLIC, então dava para chamá-la só com a chave anon
--  (que fica no front) e descobrir se um e-mail tem conta + o uuid interno
--  — enumeração de contas e vazamento de id. Só os webhooks (service_role)
--  precisam dela (infinitepay-webhook, assinatura-webhook).
-- ============================================================

revoke execute on function public.user_id_por_email(text) from public, anon, authenticated;
grant execute on function public.user_id_por_email(text) to service_role;

notify pgrst, 'reload schema';
