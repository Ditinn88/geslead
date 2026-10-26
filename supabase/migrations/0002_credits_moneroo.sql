-- =========================================================
-- GESLEAD : crédits de prospection + paiement Moneroo
-- =========================================================
-- 5 crédits offerts à chaque compte (nouveaux ET existants),
-- 3 crédits par génération de leads, achat de packs via Moneroo.
-- Les crédits ne changent que par des fonctions : jamais par une mise à jour directe du client.

-- =========================================================
-- CRÉDITS
-- =========================================================
-- La valeur par défaut s'applique aussi aux lignes existantes : chaque profil reçoit 5 crédits
alter table public.profiles
  add column if not exists credits int not null default 5 check (credits >= 0);

-- Comptes créés avant le trigger handle_new_user : on leur crée leur profil (donc leurs 5 crédits)
insert into public.profiles (id, full_name, company_name)
select u.id, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'company_name'
from auth.users u
on conflict (id) do nothing;

-- L'utilisateur ne modifie que ses informations, jamais son plan ni ses crédits
revoke insert, update, delete, truncate on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, company_name, offer_description, value_proposition,
              social_proof, signature, default_language, default_country)
  on public.profiles to authenticated;
grant select, insert, update on public.profiles to service_role;

-- =========================================================
-- PAIEMENTS (une ligne par tentative, pending → completed / failed / expired)
-- =========================================================
create table if not exists public.payments (
  id                       uuid primary key default gen_random_uuid(),
  payer_id                 uuid not null references auth.users on delete cascade,
  provider                 text not null default 'moneroo',
  amount_total             int  not null check (amount_total > 0),  -- XOF/XAF : francs entiers
  currency                 text not null,
  status                   text not null default 'pending'
                           check (status in ('pending', 'completed', 'failed', 'expired', 'refunded')),
  payment_type             text not null default 'credits',
  reference_id             text not null,                            -- pack acheté (clé du catalogue)
  credits                  int  not null check (credits > 0),        -- crédits à accorder (instantané)
  provider_transaction_id  text unique,                              -- id Moneroo (py_…)
  checkout_url             text,
  webhook_received_at      timestamptz,
  completed_at             timestamptz,
  failure_reason           text,
  customer_email           text,
  metadata                 jsonb not null default '{}'::jsonb,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index if not exists payments_payer_created_idx  on public.payments (payer_id, created_at desc);
create index if not exists payments_status_created_idx on public.payments (status, created_at);

-- L'acheteur lit ses paiements (page de retour) ; seul le serveur écrit
alter table public.payments enable row level security;
drop policy if exists "paiements : lecture" on public.payments;
create policy "paiements : lecture" on public.payments
  for select to authenticated using ((select auth.uid()) = payer_id);
revoke all on public.payments from anon, authenticated;
grant select on public.payments to authenticated;
grant select, insert, update on public.payments to service_role;

-- =========================================================
-- DÉDOUBLONNAGE DES WEBHOOKS (24 h)
-- =========================================================
create table if not exists public.processed_events (
  provider     text not null,
  event_id     text not null,
  processed_at timestamptz not null default now(),
  primary key (provider, event_id)
);
create index if not exists processed_events_processed_at_idx on public.processed_events (processed_at);

alter table public.processed_events enable row level security;
revoke all on public.processed_events from anon, authenticated;
grant select, insert, delete on public.processed_events to service_role;

-- =========================================================
-- HISTORIQUE DES CRÉDITS
-- =========================================================
create table if not exists public.credit_ledger (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  delta       int  not null check (delta <> 0),
  reason      text not null check (reason in ('search', 'purchase')),
  -- Un paiement ne crédite qu'une fois : la contrainte unique rend l'octroi idempotent
  payment_id  uuid unique references public.payments on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists credit_ledger_user_created_idx on public.credit_ledger (user_id, created_at desc);

alter table public.credit_ledger enable row level security;
drop policy if exists "historique crédits : lecture" on public.credit_ledger;
create policy "historique crédits : lecture" on public.credit_ledger
  for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.credit_ledger from anon, authenticated;
grant select on public.credit_ledger to authenticated;
grant select, insert on public.credit_ledger to service_role;

-- =========================================================
-- DÉPENSE : 3 crédits par génération de leads (appelée par l'utilisateur)
-- =========================================================
create or replace function public.spend_search_credits()
returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_uid     uuid := auth.uid();
  v_cost    constant int := 3;
  v_balance int;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  update public.profiles set credits = credits - v_cost
   where id = v_uid and credits >= v_cost
  returning credits into v_balance;

  if not found then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  insert into public.credit_ledger (user_id, delta, reason) values (v_uid, -v_cost, 'search');
  return v_balance;
end $$;

revoke execute on function public.spend_search_credits() from public, anon;
grant execute on function public.spend_search_credits() to authenticated;

-- =========================================================
-- OCTROI D'UN ACHAT (serveur uniquement, après vérification auprès de Moneroo)
-- =========================================================
-- Renvoie true si les crédits viennent d'être accordés, false s'ils l'étaient déjà.
-- Une ligne failed / expired peut encore être complétée : si Moneroo confirme le paiement, l'acheteur a payé.
-- Lève une exception (donc annule tout) si le profil est introuvable.
create or replace function public.complete_credit_payment(p_payment uuid)
returns boolean
language plpgsql set search_path = '' as $$
declare
  v_row public.payments%rowtype;
begin
  update public.payments
     set status = 'completed', completed_at = now(), failure_reason = null, updated_at = now()
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

-- Échec / annulation : seulement depuis pending (un paiement confirmé ne repasse jamais en échec)
create or replace function public.fail_credit_payment(p_payment uuid, p_reason text)
returns boolean
language sql set search_path = '' as $$
  update public.payments
     set status = 'failed', failure_reason = left(p_reason, 200), updated_at = now()
   where id = p_payment and status = 'pending'
  returning true;
$$;

revoke execute on function public.complete_credit_payment(uuid)   from public, anon, authenticated;
revoke execute on function public.fail_credit_payment(uuid, text) from public, anon, authenticated;
grant execute on function public.complete_credit_payment(uuid)   to service_role;
grant execute on function public.fail_credit_payment(uuid, text) to service_role;
