-- ============================================================
--  Plataforma Nutri — Migração 0018
--  Papel 'comprador': quem chega comprando um e-book.
--
--  Problema: o webhook do InfinitePay convida o comprador sem 'tipo', e
--  handle_new_user faz coalesce(..., 'nutri') — então quem compra um e-book
--  vira NUTRI e, ao logar na plataforma, cai no dashboard da Ana
--  (Pacientes / Financeiro / Prontuário). Não é vazamento — o RLS escopa
--  tudo por auth.uid(), ela veria um painel vazio — mas é péssimo.
--
--  Aqui só abrimos o papel no banco. O webhook passa a mandar
--  tipo='comprador' e o auth-guard.js passa a usar allowlist (só 'nutri'
--  entra no painel).
-- ============================================================

-- 1) O CHECK só permitia ('nutri','paciente'). Abre para 'comprador'.
alter table public.profiles drop constraint if exists profiles_tipo_chk;
alter table public.profiles add constraint profiles_tipo_chk
  check (tipo in ('nutri', 'paciente', 'comprador'));

-- 2) Backfill do comprador de teste criado pelo webhook (era 'nutri').
--    CUIDADO deliberado: não fazemos um update genérico do tipo
--    "todo mundo com acesso origem='infinitepay' vira comprador". A Ana pode
--    comprar o próprio e-book para testar — e isso a rebaixaria para
--    'comprador', trancando-a para fora do painel dela. Update cirúrgico.
update public.profiles
   set tipo = 'comprador'
 where email = 'nutrianalrocha+testewebhook@gmail.com'
   and tipo = 'nutri';
