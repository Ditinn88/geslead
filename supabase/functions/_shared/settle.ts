// Applique un statut Moneroo vérifié à une ligne `payments` : seul code qui accorde des crédits.
// Utilisé par le webhook et par la vérification depuis la page de retour.
export type PaymentRow = {
  id: string;
  payer_id: string;
  amount_total: number;
  currency: string;
  status: string;
  credits: number;
  provider_transaction_id: string | null;
};

export type Settlement = 'completed' | 'already_completed' | 'failed' | 'pending' | 'amount_mismatch';

export interface SettleDeps {
  complete(paymentId: string): Promise<boolean>; // true = crédits accordés maintenant
  fail(paymentId: string, reason: string): Promise<boolean>;
  log(message: string): void;
}

export async function settlePayment(
  payment: PaymentRow,
  outcome: { status: 'completed' | 'failed' | 'pending'; amount?: number; currency?: string; failureReason?: string },
  deps: SettleDeps,
): Promise<Settlement> {
  if (outcome.status === 'pending') return 'pending';

  if (outcome.status === 'failed') {
    await deps.fail(payment.id, outcome.failureReason ?? 'failed');
    return 'failed';
  }

  // Montant et devise : Moneroo règle en totalité, toute différence est refusée
  if (typeof outcome.amount === 'number' && Number.isFinite(outcome.amount) && outcome.amount !== payment.amount_total) {
    deps.log(`paiement ${payment.id} : montant différent (attendu ${payment.amount_total}, reçu ${outcome.amount})`);
    return 'amount_mismatch';
  }
  if (outcome.currency && outcome.currency.toUpperCase() !== payment.currency.toUpperCase()) {
    deps.log(`paiement ${payment.id} : devise différente (attendu ${payment.currency}, reçu ${outcome.currency})`);
    return 'amount_mismatch';
  }

  return (await deps.complete(payment.id)) ? 'completed' : 'already_completed';
}

// Statut Moneroo de l'API verify → statut interne
export function liveStatus(status: string): 'completed' | 'failed' | 'pending' {
  if (status === 'success' || status === 'succeeded') return 'completed';
  if (status === 'failed' || status === 'cancelled' || status === 'canceled') return 'failed';
  return 'pending';
}
