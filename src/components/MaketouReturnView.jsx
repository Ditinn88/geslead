import React, { useEffect, useMemo, useState } from 'react';
import { CircleCheck, TriangleAlert, LoaderCircle, Clock, ArrowRight, RefreshCw } from 'lucide-react';
import { readReturnCartId, clearReturnCartId, confirmCreditPayment } from '../lib/billing/maketou';
import { hasRealAccount } from '../lib/billing/credits';

const BASE_DELAY_MS = 4000;
const MAX_DELAY_MS = 15000;
const MAX_ATTEMPTS = 30; // ≈ 2 minutes au rythme normal

// Page de retour Maketou : le retour du navigateur ne prouve rien, on attend que le serveur ait lu le panier chez Maketou.
// Si l'acheteur ferme la page, le job de rattrapage (toutes les 5 min) ajoute ses crédits.
export default function MaketouReturnView({ currentUser, authReady, onRefreshCredits, onGoToDashboard, onRetry, onRequireAuth }) {
  const cartId = useMemo(() => readReturnCartId(), []);
  const [phase, setPhase] = useState('checking'); // checking | success | failed | timeout | login_required | missing
  const [balance, setBalance] = useState(null);
  const userId = currentUser?.id;

  useEffect(() => {
    if (!authReady) return;
    if (!hasRealAccount(currentUser)) {
      setPhase('login_required');
      return;
    }

    setPhase('checking');
    let stopped = false;
    let timer = null;

    const attempt = async (n, delay) => {
      if (stopped) return;
      const answer = await confirmCreditPayment(cartId);
      if (stopped) return;

      if (answer.status === 'completed') {
        // Succès affiché seulement une fois le solde relu en base
        const credits = await onRefreshCredits();
        if (stopped) return;
        clearReturnCartId();
        setBalance(credits);
        setPhase('success');
        return;
      }
      if (answer.status === 'payment_failed' || answer.status === 'abandoned') {
        setPhase('failed');
        return;
      }
      if (answer.error === 'not_authenticated') {
        setPhase('login_required');
        return;
      }
      if (answer.error === 'not_found') {
        setPhase(cartId ? 'timeout' : 'missing');
        return;
      }
      if (answer.error === 'not_configured' || n >= MAX_ATTEMPTS) {
        setPhase('timeout');
        return;
      }

      // En attente : rythme normal, ou celui demandé par le serveur ; erreur : on espace les appels
      const next = answer.error
        ? Math.min(MAX_DELAY_MS, Math.round(delay * 1.5))
        : Math.max(BASE_DELAY_MS, answer.retryAfterMs ?? 0);
      timer = setTimeout(() => attempt(n + 1, next), next);
    };

    attempt(1, BASE_DELAY_MS);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartId, authReady, userId]);

  const content = {
    checking: {
      icon: <LoaderCircle className="w-12 h-12 text-argile animate-spin" />,
      title: 'Confirmation du paiement…',
      text: 'Nous vérifions votre paiement auprès de Maketou. Cela prend généralement quelques secondes.',
    },
    success: {
      icon: <CircleCheck className="w-12 h-12 text-emerald-600" />,
      title: 'Paiement confirmé, crédits ajoutés',
      text:
        balance !== null
          ? `Votre solde est maintenant de ${balance} crédits.`
          : 'Vos crédits ont été ajoutés à votre compte.',
    },
    failed: {
      icon: <TriangleAlert className="w-12 h-12 text-amber-500" />,
      title: 'Paiement non abouti',
      text: 'Si vous avez été débité, vos crédits seront ajoutés automatiquement dans quelques minutes.',
    },
    timeout: {
      icon: <Clock className="w-12 h-12 text-mousse" />,
      title: 'Paiement en cours de confirmation',
      text: 'Vous pouvez fermer cette page : vos crédits seront ajoutés automatiquement dès que Maketou aura confirmé le paiement.',
    },
    login_required: {
      icon: <Clock className="w-12 h-12 text-mousse" />,
      title: 'Connectez-vous pour voir la confirmation',
      text: 'Vos crédits seront ajoutés automatiquement à votre compte dès que Maketou aura confirmé le paiement.',
    },
    missing: {
      icon: <TriangleAlert className="w-12 h-12 text-gray-400" />,
      title: 'Aucun paiement à confirmer',
      text: 'Ce lien ne correspond à aucun paiement récent sur votre compte.',
    },
  }[phase];

  return (
    <div className="min-h-screen bg-creme flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
        <div className="flex justify-center">{content.icon}</div>
        <h1 className="mt-5 text-xl sm:text-2xl font-bold text-charbon">{content.title}</h1>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">{content.text}</p>

        <div className="mt-7 flex flex-col gap-2.5">
          {phase === 'failed' && (
            <button
              onClick={onRetry}
              className="w-full py-3 rounded-xl bg-argile hover:bg-argile-dark text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </button>
          )}
          {phase === 'login_required' && (
            <button
              onClick={onRequireAuth}
              className="w-full py-3 rounded-xl bg-argile hover:bg-argile-dark text-white font-semibold text-sm cursor-pointer transition-colors"
            >
              Se connecter
            </button>
          )}
          {phase !== 'checking' && (
            <button
              onClick={onGoToDashboard}
              className="w-full py-3 rounded-xl bg-[#1C2E24] hover:bg-[#121e17] text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span>{phase === 'success' ? 'Lancer une génération de leads' : 'Retour au tableau de bord'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
