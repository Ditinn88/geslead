// Accès base des fonctions Maketou (Edge Functions uniquement, client admin).
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.109.0';
import type { SyncDeps } from './maketou-sync.ts';

export const MAKETOU_PAYMENT_COLUMNS = 'id, payer_id, status, provider_transaction_id, created_at';

export function makeMaketouSyncDeps(admin: SupabaseClient): SyncDeps {
  return {
    async complete(paymentId, providerPaymentId) {
      const { data, error } = await admin.rpc('complete_credit_payment', {
        p_payment: paymentId,
        p_provider_payment_id: providerPaymentId,
      });
      if (error) throw new Error(error.message);
      return data === true;
    },
    async recordStatus(paymentId, providerStatus, close) {
      const { error } = await admin
        .from('payments')
        .update({
          provider_status: providerStatus,
          ...(close ? { status: close, failure_reason: providerStatus } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentId)
        .neq('status', 'completed');
      if (error) throw new Error(error.message);
    },
    log: (message) => console.error(message),
  };
}

// Créneau par panier (4 s), plus porte par acheteur quand userId est fourni.
// false = Maketou vient d'être interrogé pour ce panier ou cet acheteur.
export async function claimPaymentCheck(admin: SupabaseClient, paymentId: string, userId: string | null): Promise<boolean> {
  const { data, error } = await admin.rpc('claim_payment_check', { p_payment: paymentId, p_user: userId });
  if (error) throw new Error(error.message);
  return data === true;
}
