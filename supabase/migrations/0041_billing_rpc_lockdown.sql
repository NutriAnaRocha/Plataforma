-- ============================================================
--  Plataforma Nutri — Migração 0041
--  Correção de segurança: travar as RPCs de billing.
--
--  ativar_assinatura / encerrar_assinatura são SECURITY DEFINER e
--  levantam app.allow_billing (contornam o trigger guard_billing_cols).
--  Por padrão o Postgres concede EXECUTE a PUBLIC, então QUALQUER usuária
--  autenticada podia chamá-las via PostgREST e se auto-ativar — furando o
--  paywall. Aqui removemos o acesso de anon/authenticated/public; só o
--  service_role (webhook e edge functions de admin) pode executar.
-- ============================================================

revoke execute on function public.ativar_assinatura(text, int, text, text) from public, anon, authenticated;
revoke execute on function public.encerrar_assinatura(text, text) from public, anon, authenticated;

grant execute on function public.ativar_assinatura(text, int, text, text) to service_role;
grant execute on function public.encerrar_assinatura(text, text) to service_role;

notify pgrst, 'reload schema';
