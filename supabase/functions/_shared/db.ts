// Client Supabase « admin » (clé secrète, contourne la RLS) : Edge Functions uniquement.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.109.0';
import type { SettleDeps } from './settle.ts';

export function createAdminClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  let key: string | undefined;
  try {
    key = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}')?.default;
  } catch {
    key = undefined;
  }
  key ||= Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('SUPABASE_URL ou clé secrète absente des Edge Functions');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const PAYMENT_COLUMNS = 'id, payer_id, amount_total, currency, status, credits, provider_transaction_id';

export function makeSettleDeps(admin: SupabaseClient): SettleDeps {
  return {
    async complete(paymentId) {
      const { data, error } = await admin.rpc('complete_credit_payment', { p_payment: paymentId });
      if (error) throw new Error(error.message);
      return data === true;
    },
    async fail(paymentId, reason) {
      const { data, error } = await admin.rpc('fail_credit_payment', { p_payment: paymentId, p_reason: reason });
      if (error) throw new Error(error.message);
      return data === true;
    },
    log: (message) => console.error(message),
  };
}
