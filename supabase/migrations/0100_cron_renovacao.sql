-- ============================================================
--  Migração 0100 — o relógio da renovação assistida (17/09/2026).
--
--  Todo dia às 12h UTC (9h de Brasília) o banco chama a edge function
--  nutriplat-renovacao, que decide quem avisar e manda o e-mail.
--  O header x-cron-secret sai do cofre (vault.secrets, nome
--  'nutriplat_cron') — o mesmo valor está no secret CRON_SECRET da
--  function. O segredo NÃO fica neste arquivo.
--
--  Rodar duas vezes no mesmo dia não manda e-mail repetido: quem já foi
--  avisado está em renovacao_avisos (migração 0099).
-- ============================================================

select cron.unschedule(jobid) from cron.job where jobname = 'nutriplat-renovacao';

select cron.schedule('nutriplat-renovacao', '0 12 * * *', $cron$
  select net.http_post(
    url := 'https://btsqrpxzlkmucrfvsytl.supabase.co/functions/v1/nutriplat-renovacao',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'nutriplat_cron')),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000);
$cron$);
