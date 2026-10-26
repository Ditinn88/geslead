-- =========================================================
-- GESLEAD : Initial Schema & RLS Policies
-- =========================================================

-- Enable uuid extension
create extension if not exists "uuid-ossp";

-- =========================================================
-- PROFILS
-- =========================================================
create table if not exists public.profiles (
  id                 uuid primary key references auth.users on delete cascade,
  full_name          text,
  company_name       text,
  offer_description  text,          -- ce que l'utilisateur vend (utilisé par l'IA)
  value_proposition  text,
  social_proof       text,          -- références, clients, chiffres réels
  signature          text,
  default_language   text not null default 'fr',
  default_country    char(2) not null default 'SN',
  plan               text not null default 'free',
  lead_credits       int  not null default 200 check (lead_credits >= 0),
  ai_credits         int  not null default 50  check (ai_credits >= 0),
  created_at         timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, company_name)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'company_name')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- RECHERCHES
-- =========================================================
do $$ begin
  create type public.search_status as enum ('pending', 'running', 'ingesting', 'succeeded', 'failed');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.searches (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  sector         text not null,
  city           text not null,
  district       text,
  country_code   char(2) not null,
  language       text not null default 'fr',
  max_results    int  not null check (max_results between 1 and 500),
  status         public.search_status not null default 'pending',
  apify_run_id   text unique,
  results_count  int  not null default 0,
  error          text,
  created_at     timestamptz not null default now(),
  finished_at    timestamptz
);
create index if not exists searches_user_created_idx on public.searches (user_id, created_at desc);

-- =========================================================
-- LEADS
-- =========================================================
create table if not exists public.leads (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  place_id       text not null,
  name           text not null,
  category       text,
  address        text,
  city           text,
  country_code   char(2),
  phone_raw      text,
  phone_e164     text,
  is_mobile      boolean,
  website        text,
  email          text,
  rating         numeric(2,1),
  reviews_count  int,
  maps_url       text,
  lat            double precision,
  lng            double precision,
  status         text not null default 'new'
                 check (status in ('new', 'contacted', 'replied', 'won', 'lost')),
  notes          text,
  raw            jsonb,
  created_at     timestamptz not null default now(),
  unique (user_id, place_id)
);

create table if not exists public.search_leads (
  search_id  uuid not null references public.searches on delete cascade,
  lead_id    uuid not null references public.leads on delete cascade,
  primary key (search_id, lead_id)
);
create index if not exists search_leads_lead_idx on public.search_leads (lead_id);

-- =========================================================
-- MESSAGES IA
-- =========================================================
do $$ begin
  create type public.message_channel as enum ('whatsapp', 'email', 'sms', 'linkedin');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.messages (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  lead_id        uuid not null references public.leads on delete cascade,
  channel        public.message_channel not null,
  language       text not null,
  tone           text,
  subject        text,
  body           text not null,
  model          text,
  input_tokens   int,
  output_tokens  int,
  created_at     timestamptz not null default now()
);
create index if not exists messages_lead_created_idx on public.messages (lead_id, created_at desc);

-- =========================================================
-- VUE : leads d'une recherche + dernier message
-- =========================================================
create or replace view public.leads_by_search with (security_invoker = true) as
select
  sl.search_id,
  l.id, l.name, l.category, l.address, l.city, l.country_code,
  l.phone_e164, l.is_mobile, l.website, l.email, l.rating, l.reviews_count,
  l.maps_url, l.status, l.notes, l.created_at,
  m.channel as last_message_channel,
  m.subject as last_message_subject,
  m.body    as last_message
from public.search_leads sl
join public.leads l on l.id = sl.lead_id
left join lateral (
  select channel, subject, body
  from public.messages
  where lead_id = l.id
  order by created_at desc
  limit 1
) m on true;

-- =========================================================
-- RLS
-- =========================================================
alter table public.profiles     enable row level security;
alter table public.searches     enable row level security;
alter table public.leads        enable row level security;
alter table public.search_leads enable row level security;
alter table public.messages     enable row level security;

-- Profils
create policy "profil : lecture"     on public.profiles for select using (id = (select auth.uid()));
create policy "profil : mise à jour" on public.profiles for update using (id = (select auth.uid()));

-- Recherches
create policy "recherches : lecture" on public.searches for select using (user_id = (select auth.uid()));

-- Leads
create policy "leads : lecture"     on public.leads for select using (user_id = (select auth.uid()));
create policy "leads : mise à jour" on public.leads for update using (user_id = (select auth.uid()));

-- Search Leads
create policy "search_leads : lecture" on public.search_leads for select using (
  exists (select 1 from public.searches s where s.id = search_id and s.user_id = (select auth.uid()))
);

-- Messages
create policy "messages : lecture"  on public.messages for select using (user_id = (select auth.uid()));
create policy "messages : insertion" on public.messages for insert with check (user_id = (select auth.uid()));

-- =========================================================
-- CRÉDITS (RPC)
-- =========================================================
create or replace function public.consume_credits(p_kind text, p_amount int)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if p_amount <= 0 then return false; end if;
  if p_kind = 'lead' then
    update public.profiles set lead_credits = lead_credits - p_amount
     where id = auth.uid() and lead_credits >= p_amount;
  elsif p_kind = 'ai' then
    update public.profiles set ai_credits = ai_credits - p_amount
     where id = auth.uid() and ai_credits >= p_amount;
  else
    raise exception 'type de crédit inconnu : %', p_kind;
  end if;
  return found;
end $$;

create or replace function public.refund_credits(p_user uuid, p_kind text, p_amount int)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_amount <= 0 then return; end if;
  if p_kind = 'lead' then
    update public.profiles set lead_credits = lead_credits + p_amount where id = p_user;
  elsif p_kind = 'ai' then
    update public.profiles set ai_credits = ai_credits + p_amount where id = p_user;
  end if;
end $$;

-- Revoke refund from client
revoke execute on function public.refund_credits(uuid, text, int) from public, anon, authenticated;
