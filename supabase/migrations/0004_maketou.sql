-- =========================================================
-- GESLEAD : achat de crédits via Maketou
-- =========================================================
-- Maketou n'envoie aucun webhook : la page de retour (maketou-confirm) et un job toutes les 5 minutes
-- (maketou-reconcile) interrogent son API. On réutilise payments / credit_ledger / complete_credit_payment()
-- de 0002 : provider = 'maketou', provider_transaction_id = id du panier Maketou.

create extension if not exists pg_net;

-- =========================================================
-- PAIEMENTS : suivi des paniers Maketou
-- =========================================================
alter table public.payments
  add column if not exists provider_status     text,                    -- dernier statut lu chez le prestataire
  add column if not exists provider_payment_id text,                    -- paymentId Maketou (support) : jamais une preuve
  add column if not exists check_attempts      int not null default 0,  -- interrogations de Maketou
  add column if not exists last_checked_at     timestamptz,             -- rythme des interrogations + ordre du job
  add column if not exists note                text;                    -- ex. « remboursé à la main »

-- Ouverture d'un paiement : plafond d'achats ouverts par heure, atomique (deux clics simultanés ne le dépassent pas)
create or replace function public.open_credit_payment(
  p_payer uuid, p_provider text, p_reference text, p_credits int, p_amount int, p_currency text,
  p_email text, p_max_open_per_hour int
) returns uuid
language plpgsql set search_path = '' as $$
declare
  v_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('open_credit_payment:' || p_payer::text));

  if (select count(*) from public.payments
       where payer_id = p_payer and status = 'pending' and created_at > now() - interval '1 hour') >= p_max_open_per_hour then
    raise exception 'TOO_MANY_CHECKOUTS';
  end if;

  insert into public.payments (payer_id, provider, amount_total, currency, payment_type, reference_id, credits, customer_email)
  values (p_payer, p_provider, p_amount, p_currency, 'credits', p_reference, p_credits, p_email)
  returning id into v_id;
  return v_id;
end $$;

-- =========================================================
-- RYTHME DES INTERROGATIONS (quota Maketou partagé par tous les acheteurs et le job)
-- =========================================================
create table if not exists public.payment_check_gates (
  user_id      uuid primary key references auth.users on delete cascade,
  last_call_at timestamptz not null
);
alter table public.payment_check_gates enable row level security;
revoke all on public.payment_check_gates from anon, authenticated;
grant select, insert, update on public.payment_check_gates to service_role;

-- true = l'appelant peut interroger Maketou maintenant pour ce paiement.
-- Porte par acheteur (page de retour, p_user renseigné) puis créneau par paiement, partagé avec le job : 4 s minimum.
create or replace function public.claim_payment_check(p_payment uuid, p_user uuid default null)
returns boolean
language plpgsql set search_path = '' as $$
begin
  if p_user is not null then
    insert into public.payment_check_gates as g (user_id, last_call_at)
    values (p_user, now())
    on conflict (user_id) do update set last_call_at = now()
      where g.last_call_at < now() - interval '4 seconds';
    if not found then
      return false;
    end if;
  end if;

  update public.payments
     set last_checked_at = now(), check_attempts = check_attempts + 1
   where id = p_payment and status <> 'completed'
     and (last_checked_at is null or last_checked_at < now() - interval '4 seconds');
  return found;
end $$;

-- =========================================================
-- OCTROI : complete_credit_payment() garde sa logique de 0002 (transition gardée + ledger unique)
-- et enregistre en plus le paymentId du prestataire
-- =========================================================
drop function if exists public.complete_credit_payment(uuid);
create or replace function public.complete_credit_payment(p_payment uuid, p_provider_payment_id text default null)
returns boolean
language plpgsql set search_path = '' as $$
declare
  v_row public.payments%rowtype;
begin
  update public.payments
     set status = 'completed', completed_at = now(), failure_reason = null, updated_at = now(),
         provider_status = 'completed',
         provider_payment_id = coalesce(p_provider_payment_id, provider_payment_id)
   where id = p_payment and status in ('pending', 'failed', 'expired')
  returning * into v_row;
  if not found then
    return false;
  end if;

  update public.profiles set credits = credits + v_row.credits where id = v_row.payer_id;
  if not found then
    raise exception 'GRANT_TARGET_MISSING';
  end if;

  insert into public.credit_ledger (user_id, delta, reason, payment_id)
  values (v_row.payer_id, v_row.credits, 'purchase', v_row.id);
  return true;
end $$;

-- =========================================================
-- JOB DE RATTRAPAGE : bail (jamais deux passages en même temps) + heartbeat
-- =========================================================
create table if not exists public.job_leases (
  name             text primary key,
  holder           text,
  held_until       timestamptz not null default now(),
  last_run_at      timestamptz,
  last_stop_reason text
);
alter table public.job_leases enable row level security;
revoke all on public.job_leases from anon, authenticated;
grant select, insert, update on public.job_leases to service_role;

-- true = bail obtenu (null sinon)
create or replace function public.acquire_job_lease(p_name text, p_holder text, p_ttl_seconds int)
returns boolean
language sql set search_path = '' as $$
  insert into public.job_leases as l (name, holder, held_until)
  values (p_name, p_holder, now() + make_interval(secs => p_ttl_seconds))
  on conflict (name) do update set holder = excluded.holder, held_until = excluded.held_until
    where l.held_until < now()
  returning true;
$$;

create or replace function public.release_job_lease(p_name text, p_holder text, p_stop_reason text)
returns void
language sql set search_path = '' as $$
  update public.job_leases
     set held_until = now(), last_run_at = now(), last_stop_reason = left(p_stop_reason, 100)
   where name = p_name and holder = p_holder;
$$;

-- Secret partagé entre pg_cron et l'Edge Function, généré ici et rangé dans le Vault (personne n'a à le copier)
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'maketou_job_secret') then
    perform vault.create_secret(
      replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
      'maketou_job_secret',
      'Authentifie l''appel de pg_cron à l''Edge Function maketou-reconcile');
  end if;
  -- Adresse du projet Supabase GESLEAD (à corriger dans le Vault si le projet change)
  if not exists (select 1 from vault.secrets where name = 'project_url') then
    perform vault.create_secret(
      'https://mlshntuonyoylpilivay.supabase.co',
      'project_url',
      'URL du projet, pour les appels pg_cron vers les Edge Functions');
  end if;
end $$;

create or replace function public.verify_maketou_job_secret(p_secret text)
returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(
    length(p_secret) >= 32
    and p_secret = (select decrypted_secret from vault.decrypted_secrets where name = 'maketou_job_secret' limit 1),
    false);
$$;

-- =========================================================
-- DROITS : fonctions réservées au serveur (clé service_role des Edge Functions)
-- =========================================================
revoke execute on function public.open_credit_payment(uuid, text, text, int, int, text, text, int) from public, anon, authenticated;
revoke execute on function public.claim_payment_check(uuid, uuid)                     from public, anon, authenticated;
revoke execute on function public.complete_credit_payment(uuid, text)                 from public, anon, authenticated;
revoke execute on function public.acquire_job_lease(text, text, int)                  from public, anon, authenticated;
revoke execute on function public.release_job_lease(text, text, text)                 from public, anon, authenticated;
revoke execute on function public.verify_maketou_job_secret(text)                     from public, anon, authenticated;
grant execute on function public.open_credit_payment(uuid, text, text, int, int, text, text, int) to service_role;
grant execute on function public.claim_payment_check(uuid, uuid)                     to service_role;
grant execute on function public.complete_credit_payment(uuid, text)                 to service_role;
grant execute on function public.acquire_job_lease(text, text, int)                  to service_role;
grant execute on function public.release_job_lease(text, text, text)                 to service_role;
grant execute on function public.verify_maketou_job_secret(text)                     to service_role;

-- =========================================================
-- PLANIFICATION
-- =========================================================
-- Rattrapage toutes les 5 minutes (pg_net est asynchrone : l'appel ne bloque pas pg_cron)
select cron.schedule(
  'maketou-reconcile',
  '*/5 * * * *',
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
               || '/functions/v1/maketou-reconcile',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'maketou_job_secret')),
    body    := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- Entretien quotidien (remplace celui de 0003) : les paniers Maketou restent en attente 48 h et c'est
-- le job qui les clôt ; seule une ligne Maketou sans panier enregistré expire ici
select cron.schedule(
  'payments-housekeeping',
  '15 3 * * *',
  $$
  delete from public.processed_events where processed_at < now() - interval '24 hours';
  update public.payments set status = 'expired', updated_at = now()
   where status = 'pending' and created_at < now() - interval '24 hours'
     and (provider <> 'maketou' or provider_transaction_id is null);
  $$
);
