import React, { useEffect, useMemo, useState } from 'react';
import { CircleCheck, TriangleAlert, LoaderCircle, Clock, ArrowRight, RefreshCw } from 'lucide-react';
import { readReturnRef, clearReturnRef, readPaymentStatus, verifyCreditPayment } from '../lib/billing/moneroo';
import { hasRealAccount } from '../lib/billing/credits';

const POLL_INTERVAL_MS = 3000;
const MAX_TICKS = 40; // ~2 minutes
// Si le webhook tarde, on demande au serveur d'interroger Moneroo à ces passages (≈ 9 s, 21 s, 39 s, 60 s, 90 s)
const VERIFY_TICKS = new Set([3, 7, 13, 20, 30]);

// Page de retour Moneroo : le retour du navigateur ne prouve rien, on attend la confirmation serveur
export default function PaymentReturnView({ currentUser, authReady, onRefreshCredits, onGoToDashboard, onRetry, onRequireAuth }) {
  const ref = useMemo(() => readReturnRef(), []);
  const [phase, setPhase] = useState(ref ? 'checking' : 'missing'); // checking | success | failed | timeout | login_required | missing
  const [balance, setBalance] = useState(null);
  const userId = currentUser?.id;

  useEffect(() => {
    if (!ref || !authReady) return;
    if (!hasRealAccount(currentUser)) {
      setPhase('login_required');
      return;
    }

    setPhase('checking');
    let stopped = false;
    let timer = null;

    const tick = async (n) => {
      if (stopped) return;
      let status = await readPaymentStatus(ref);
      if (status !== 'completed' && VERIFY_TICKS.has(n)) {
        status = (await verifyCreditPayment(ref)) ?? status;
      }
      if (stopped) return;

      if (status === 'completed') {
        // Succès affiché seulement une fois les crédits relus en base
        const credits = await onRefreshCredits();
        if (stopped) return;
        clearReturnRef();
        setBalance(credits);
        setPhase('success');
        return;
      }
      if (status === 'failed' || status === 'expired') {
        clearReturnRef();
        setPhase('failed');
        return;
      }
      if (n >= MAX_TICKS) {
        setPhase('timeout');
        return;
      }
      timer = setTimeout(() => tick(n + 1), POLL_INTERVAL_MS);
    };

    tick(1);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, authReady, userId]);

  const content = {
    checking: {
      icon: <LoaderCircle className="w-12 h-12 text-argile animate-spin" />,
      title: 'Confirmation du paiement…',
      text: 'Nous attendons la confirmation de Moneroo. Cela prend généralement quelques secondes.',
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
      text: "Le paiement a été refusé ou annulé. Si vous avez tout de même été débité, vos crédits seront ajoutés automatiquement dans quelques minutes.",
    },
    timeout: {
      icon: <Clock className="w-12 h-12 text-mousse" />,
      title: 'Paiement en cours de confirmation',
      text: 'Vous pouvez fermer cette page : vos crédits seront ajoutés automatiquement dès que Moneroo aura confirmé le paiement.',
    },
    login_required: {
      icon: <Clock className="w-12 h-12 text-mousse" />,
      title: 'Connectez-vous pour voir la confirmation',
      text: 'Vos crédits seront ajoutés automatiquement à votre compte dès que Moneroo aura confirmé le paiement.',
    },
    missing: {
      icon: <TriangleAlert className="w-12 h-12 text-gray-400" />,
      title: 'Aucun paiement à confirmer',
      text: "Ce lien ne correspond à aucun paiement en cours.",
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
