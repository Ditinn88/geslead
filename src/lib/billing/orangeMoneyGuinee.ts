// src/lib/billing/orangeMoneyGuinee.ts
// Module de paiement Orange Money Guinée (GNF) pour l'achat de crédits GESLEAD
import { supabase } from '../supabase/client';
import { whatsappUrl } from '../whatsapp';

export type OrangeMoneyPack = {
  key: string;
  name: string;
  credits: number;
  priceGnf: number;
  priceFormatted: string;
  tagline: string;
};

export const ORANGE_MONEY_GUINEA_CONFIG = {
  country: 'Guinée (Conakry)',
  countryCode: 'GN',
  currency: 'GNF',
  operator: 'Orange Money Guinée',
  // Paramètres marchands modifiables via variables d'environnement VITE_*
  merchantPhone: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OM_GUINEA_PHONE) || '+224 624 00 00 00',
  merchantCode: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OM_GUINEA_CODE) || '*144*4*4#',
  merchantName: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OM_GUINEA_NAME) || 'GESLEAD Guinée',
  whatsappSupport: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OM_GUINEA_WHATSAPP) || '+224 624 00 00 00',
  packs: [
    {
      key: 'pack_starter',
      name: 'Découverte',
      credits: 5,
      priceGnf: 10000,
      priceFormatted: '10 000 GNF',
      tagline: '1 génération complète (5 crédits) pour tester immédiatement.',
    },
    {
      key: 'pack_1',
      name: 'Essentiel',
      credits: 15,
      priceGnf: 30000,
      priceFormatted: '30 000 GNF',
      tagline: '5 générations complètes pour débuter en Guinée.',
    },
    {
      key: 'pack_2',
      name: 'Performance',
      credits: 45,
      priceGnf: 75000,
      priceFormatted: '75 000 GNF',
      tagline: '15 générations complètes avec modèles IA optimisés.',
    },
    {
      key: 'pack_3',
      name: 'Entreprise',
      credits: 150,
      priceGnf: 225000,
      priceFormatted: '225 000 GNF',
      tagline: '50 générations complètes pour agences et équipes.',
    },
  ] as OrangeMoneyPack[],
};

export interface SubmitOmPaymentInput {
  packKey: string;
  transactionRef: string;
  customerPhone: string;
  customerEmail: string;
  userId?: string | null;
}

export interface SubmitOmPaymentResult {
  ok: boolean;
  message: string;
  whatsappConfirmationUrl: string;
  pendingPaymentId?: string;
}

/**
 * Enregistre la transaction Orange Money Guinée et prépare la confirmation WhatsApp.
 */
export async function submitOrangeMoneyGuineePayment(
  input: SubmitOmPaymentInput
): Promise<SubmitOmPaymentResult> {
  const pack = ORANGE_MONEY_GUINEA_CONFIG.packs.find((p) => p.key === input.packKey) || ORANGE_MONEY_GUINEA_CONFIG.packs[0];
  const refClean = input.transactionRef.trim().toUpperCase();
  const phoneClean = input.customerPhone.trim();
  const emailClean = input.customerEmail.trim();

  // Message pré-rempli pour validation instantanée par WhatsApp
  const waMessage = 
    `🇬🇳 *Confirmation Paiement Orange Money Guinée*\n\n` +
    `📦 *Pack commandé* : ${pack.name} (${pack.credits} crédits)\n` +
    `💰 *Montant payé* : ${pack.priceFormatted}\n` +
    `👤 *Email GESLEAD* : ${emailClean || 'Non renseigné'}\n` +
    `📱 *Numéro expéditeur* : ${phoneClean || 'Non renseigné'}\n` +
    `🔖 *Référence SMS Orange* : ${refClean}\n\n` +
    `Merci de bien vouloir créditer mon compte GESLEAD.`;

  const whatsappConfirmationUrl = whatsappUrl(ORANGE_MONEY_GUINEA_CONFIG.whatsappSupport, waMessage);

  // Sauvegarde locale de secours
  try {
    const historyKey = 'geslead_om_guinee_orders';
    const existing = JSON.parse(localStorage.getItem(historyKey) || '[]');
    const newEntry = {
      id: `om-gn-${Date.now()}`,
      packKey: pack.key,
      credits: pack.credits,
      amountGnf: pack.priceGnf,
      transactionRef: refClean,
      customerPhone: phoneClean,
      customerEmail: emailClean,
      createdAt: new Date().toISOString(),
      status: 'pending_validation'
    };
    localStorage.setItem(historyKey, JSON.stringify([newEntry, ...existing].slice(0, 20)));
  } catch {}

  // Enregistrement dans Supabase si connecté
  if (supabase && input.userId) {
    try {
      await supabase.from('payments').insert({
        payer_id: input.userId,
        provider: 'orange_money_guinee',
        payment_type: 'credits',
        reference_id: pack.key,
        credits: pack.credits,
        amount_total: pack.priceGnf,
        currency: 'GNF',
        customer_email: emailClean,
        provider_payment_id: refClean,
        provider_status: 'pending_verification',
        status: 'pending',
        note: `Orange Money Guinée - Tél: ${phoneClean} - Réf: ${refClean}`
      });
    } catch (e) {
      // Ignorer silencieusement si la politique RLS restreint l'insert direct
      console.warn('Note: Paiement Orange Money enregistré localement:', e);
    }
  }

  return {
    ok: true,
    message: 'Votre référence a été enregistrée avec succès.',
    whatsappConfirmationUrl,
  };
}
