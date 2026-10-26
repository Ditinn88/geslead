// Job de rattrapage Maketou, appelé toutes les 5 minutes par pg_cron via pg_net (migration 0004).
// Maketou n'envoie aucun webhook : ce job crédite l'acheteur qui a payé puis fermé l'onglet,
// et clôt les paniers toujours impayés après 48 h.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.109.0';
import { maketouApiKeyProblem } from '../_shared/maketou.ts';
import { reconcile, syncPayment, type MaketouPaymentRow } from '../_shared/maketou-sync.ts';
import { claimPaymentCheck, makeMaketouSyncDeps, MAKETOU_PAYMENT_COLUMNS } from '../_shared/maketou-db.ts';
import { createAdminClient } from '../_shared/db.ts';
import { json } from '../_shared/http.ts';

const JOB = 'maketou-reconcile';
const BUDGET_MS = 45_000; // bien en dessous de la durée maximale d'une Edge Function
const CALL_TIMEOUT_MS = 15_000;
const LEASE_TTL_S = (2 * BUDGET_MS) / 1000; // toujours plus long que le plus long passage possible
const FAST_LIMIT = 30;
const TOTAL_LIMIT = 40;

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ code: 'METHOD_NOT_ALLOWED' }, 405);
  const admin = createAdminClient();

  // Authentification par secret uniquement : il est rangé dans le Vault, où pg_cron le lit
  const token = req.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1] ?? '';
  const { data: authorized } = await admin.rpc('verify_maketou_job_secret', { p_secret: token });
  if (authorized !== true) return json({ code: 'UNAUTHORIZED' }, 401);

  // Bail : deux passages ne se chevauchent jamais
  const holder = crypto.randomUUID();
  const { data: acquired, error: leaseError } = await admin.rpc('acquire_job_lease', {
    p_name: JOB,
    p_holder: holder,
    p_ttl_seconds: LEASE_TTL_S,
  });
  if (leaseError) {
    console.error('rattrapage Maketou : bail impossible :', leaseError.message);
    return json({ code: 'LEASE_FAILED' }, 500);
  }
  if (acquired !== true) return json({ skipped: 'already_running' });

  let stopReason = 'crash';
  try {
    if (maketouApiKeyProblem()) {
      console.error('rattrapage Maketou : MAKETOU_API_KEY manquante ou mal formée');
      stopReason = 'config';
      return json({ stopReason }, 503);
    }
    const syncDeps = makeMaketouSyncDeps(admin);
    const summary = await reconcile(
      {
        listDue: () => listDue(admin),
        claim: (id) => claimPaymentCheck(admin, id, null),
        sync: (row) => syncPayment(row, CALL_TIMEOUT_MS, syncDeps),
        expire: async (id, reason) => {
          const { error } = await admin
            .from('payments')
            .update({ status: 'expired', failure_reason: reason, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('status', 'pending');
          if (error) throw new Error(error.message);
        },
        log: (message) => console.error(message),
        now: () => Date.now(),
      },
      { budgetMs: BUDGET_MS, callTimeoutMs: CALL_TIMEOUT_MS },
    );
    stopReason = summary.stopReason;
    return json(summary);
  } catch (e) {
    console.error('rattrapage Maketou interrompu :', (e as Error).message);
    return json({ stopReason }, 500);
  } finally {
    // Heartbeat (last_run_at, last_stop_reason) lu par npm run check:maketou
    await admin.rpc('release_job_lease', { p_name: JOB, p_holder: holder, p_stop_reason: stopReason });
  }
});

// Paniers en attente : les jeunes d'abord (l'acheteur vient de payer), avec des places réservées aux anciens
async function listDue(admin: SupabaseClient): Promise<MaketouPaymentRow[]> {
  const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
  const due = (createdFilter: 'gte' | 'lt', recheckAfterMs: number, limit: number) =>
    admin
      .from('payments')
      .select(MAKETOU_PAYMENT_COLUMNS)
      .eq('provider', 'maketou')
      .eq('status', 'pending')
      .not('provider_transaction_id', 'is', null)
      [createdFilter]('created_at', ago(3600_000))
      .or(`last_checked_at.is.null,last_checked_at.lt."${ago(recheckAfterMs)}"`)
      .order('last_checked_at', { ascending: true, nullsFirst: true })
      .order('created_at', { ascending: true })
      .limit(limit);

  const { data: fast, error: fastError } = await due('gte', 4 * 60_000, FAST_LIMIT);
  if (fastError) throw new Error(fastError.message);
  const { data: slow, error: slowError } = await due('lt', 55 * 60_000, TOTAL_LIMIT - (fast?.length ?? 0));
  if (slowError) throw new Error(slowError.message);
  return [...(fast ?? []), ...(slow ?? [])] as MaketouPaymentRow[];
}
