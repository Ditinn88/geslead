-- =========================================================
-- GESLEAD : entretien quotidien des paiements
-- =========================================================
-- • purge du dédoublonnage des webhooks (Moneroo cesse de réessayer bien avant 24 h)
-- • passe en « expired » les paiements jamais confirmés après 24 h
--   (un webhook tardif confirmé par Moneroo peut encore les compléter)

create extension if not exists pg_cron;

-- cron.schedule remplace la tâche si elle existe déjà sous ce nom
select cron.schedule(
  'payments-housekeeping',
  '15 3 * * *',
  $$
  delete from public.processed_events where processed_at < now() - interval '24 hours';
  update public.payments set status = 'expired', updated_at = now()
   where status = 'pending' and created_at < now() - interval '24 hours';
  $$
);
