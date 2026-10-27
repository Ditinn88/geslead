import React, { useEffect, useState } from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  Smartphone,
  CreditCard,
  TriangleAlert,
  LoaderCircle,
  Coins,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  ArrowRight
} from 'lucide-react';
import { fetchCreditPacks, startCreditCheckout, CHECKOUT_ERROR_MESSAGES } from '../lib/billing/maketou';
import { SEARCH_CREDIT_COST, formatPrice } from '../lib/billing/credits';
import {
  ORANGE_MONEY_GUINEA_CONFIG,
  submitOrangeMoneyGuineePayment
} from '../lib/billing/orangeMoneyGuinee';
import { whatsappUrl } from '../lib/whatsapp';

export default function BuyCreditsModal({
  isOpen,
  onClose,
  userCredits = 0,
  canPurchase = false,
  reason = null, // 'insufficient' quand une génération a été bloquée
  defaultTab = 'guinee', // 'guinee' | 'maketou'
  isCreator = false,
  onRequireAuth
}) {
  // Navigation entre zones de paiement - Guinée GNF par défaut
  const [activeTab, setActiveTab] = useState(defaultTab === 'maketou' ? 'maketou' : 'guinee');
  const [guineaMethod, setGuineaMethod] = useState('orange'); // 'orange' | 'momo' | 'card'

  // Maketou State
  const [catalog, setCatalog] = useState(null);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [pendingPackKey, setPendingPackKey] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Orange Money Guinée State
  const [selectedOmPackKey, setSelectedOmPackKey] = useState('pack_starter'); // Pack Découverte 5 crédits par défaut
  const [omPhone, setOmPhone] = useState('');
  const [omRef, setOmRef] = useState('');
  const [isSubmittingOm, setIsSubmittingOm] = useState(false);
  const [omSuccessData, setOmSuccessData] = useState(null);
  const [omError, setOmError] = useState(null);
  const [copiedNumber, setCopiedNumber] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(defaultTab === 'maketou' ? 'maketou' : 'guinee');
    setErrorMessage(null);
    setPendingPackKey(null);
    setOmSuccessData(null);
    setOmError(null);
    setIsLoadingCatalog(true);
    fetchCreditPacks().then((result) => {
      setCatalog(result);
      setIsLoadingCatalog(false);
    });
  }, [isOpen, defaultTab]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !pendingPackKey && !isSubmittingOm) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pendingPackKey, isSubmittingOm, onClose]);

  if (!isOpen) return null;

  const handleBuyMaketou = async (pack) => {
    if (!canPurchase) {
      onRequireAuth?.();
      return;
    }
    setErrorMessage(null);
    setPendingPackKey(pack.key);
    const result = await startCreditCheckout(pack.key);
    if (!result.ok) {
      setPendingPackKey(null);
      setErrorMessage(CHECKOUT_ERROR_MESSAGES[result.code] || CHECKOUT_ERROR_MESSAGES.MAKETOU_CHECKOUT_FAILED);
    }
  };

  const handleCopyMerchantNumber = () => {
    navigator.clipboard.writeText(ORANGE_MONEY_GUINEA_CONFIG.merchantPhone.replace(/\s+/g, ''));
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2200);
  };

  const handleSubmitOm = async (e) => {
    e.preventDefault();
    if (!omRef.trim()) {
      setOmError('Veuillez saisir le numéro ou la référence de transaction SMS reçue.');
      return;
    }

    setIsSubmittingOm(true);
    setOmError(null);

    try {
      const res = await submitOrangeMoneyGuineePayment({
        packKey: selectedOmPackKey,
        transactionRef: omRef,
        customerPhone: omPhone,
        customerEmail: currentUser?.email || '',
        userId: currentUser?.id || null
      });

      setOmSuccessData(res);
    } catch (err) {
      setOmError("Une erreur est survenue lors de l'enregistrement de votre transaction.");
    } finally {
      setIsSubmittingOm(false);
    }
  };

  const selectedOmPack =
    ORANGE_MONEY_GUINEA_CONFIG.packs.find((p) => p.key === selectedOmPackKey) ||
    ORANGE_MONEY_GUINEA_CONFIG.packs[0];

  return (
    <div
      className="fixed inset-0 z-[120] bg-charbon/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={() => !pendingPackKey && !isSubmittingOm && onClose()}
    >
      <div
        className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[94vh] flex flex-col overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="buy-credits-title"
      >
        {/* En-tête */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 id="buy-credits-title" className="text-lg sm:text-xl font-bold text-charbon flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-argile" />
              Recharger vos crédits GESLEAD
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              1 génération de leads = {SEARCH_CREDIT_COST} crédits · Solde actuel :{' '}
              <span className="font-semibold text-emerald-700">{userCredits} crédits</span>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={Boolean(pendingPackKey) || isSubmittingOm}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-40"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sélecteur de méthode / Pays */}
        <div className="px-5 sm:px-6 pt-3 pb-2 border-b border-gray-100 bg-gray-50/70 flex-shrink-0 space-y-2">
          <div className="flex items-center gap-1.5 p-1 bg-gray-200/70 rounded-2xl">
            <button
              onClick={() => {
                setActiveTab('guinee');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'guinee'
                  ? 'bg-[#FF7900] text-white shadow-xs'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <span className="text-base leading-none">🇬🇳</span>
              <span>Guinée (OM · MoMo · Carte)</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ml-1 ${
                activeTab === 'guinee' ? 'bg-white text-[#FF7900]' : 'bg-[#FF7900]/15 text-[#FF7900]'
              }`}>
                GNF
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('maketou');
                setOmSuccessData(null);
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'maketou'
                  ? 'bg-white text-charbon shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>🌍 Autres Pays (FCFA & CB)</span>
            </button>
          </div>
        </div>

        {/* Corps déroulant */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {isCreator && (
            <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm font-medium shadow-xs">
              <span className="text-xl">👑</span>
              <div>
                <strong>Accès Créateur Actif :</strong> Vous bénéficiez d'un accès 100% gratuit et illimité à toutes les extractions et fonctionnalités de GESLEAD sans consommer de crédits.
              </div>
            </div>
          )}

          {reason === 'insufficient' && !isCreator && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
              <TriangleAlert className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
              <span>
                Crédits insuffisants : il faut au moins {SEARCH_CREDIT_COST} crédits pour extraire et analyser des prospects.
              </span>
            </div>
          )}

          {!canPurchase && (
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-700 text-xs sm:text-sm flex items-center justify-between">
              <span>Connectez-vous avec votre compte pour acheter des crédits.</span>
              {onRequireAuth && (
                <button
                  onClick={onRequireAuth}
                  className="px-3 py-1 rounded-lg bg-argile text-white font-bold text-xs hover:bg-argile-dark transition-colors cursor-pointer"
                >
                  Connexion
                </button>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ONGLET 1 : MAKETOU (Sénégal, CI, Mali, Bénin, MoMo, Wave, Carte)           */}
          {/* ========================================================================= */}
          {activeTab === 'maketou' && (
            <>
              {/* Information Carte Bancaire & Mobile Money */}
              <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/90 text-xs text-blue-950 space-y-1">
                <div className="flex items-center gap-2 font-bold text-blue-900">
                  <CreditCard className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Paiement par Carte Bancaire (Visa / MasterCard) :</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed pl-6">
                  Sur la page de paiement sécurisée, cliquez sur <strong>« Visa / MasterCard »</strong>. La passerelle vous demandera d'abord votre <strong>numéro de téléphone</strong> pour la vérification de sécurité <strong>3D Secure (code OTP par SMS)</strong>. Une fois le numéro validé, le formulaire de saisie des <strong>16 chiffres de votre carte bancaire, date d'expiration et CVV</strong> apparaîtra directement.
                </p>
              </div>

              {isLoadingCatalog ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
                  <LoaderCircle className="w-5 h-5 animate-spin" />
                  Chargement des packs…
                </div>
              ) : !catalog ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  Les packs de crédits ne sont pas disponibles pour le moment. Réessayez un peu plus tard.
                </div>
              ) : (
                <div className="space-y-3">
                  {catalog.packs.map((pack) => {
                    const isPending = pendingPackKey === pack.key;
                    return (
                      <div
                        key={pack.key}
                        className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-gray-200 hover:border-argile/50 transition-colors bg-white shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-argile-soft text-argile flex items-center justify-center flex-shrink-0">
                            <Coins className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-charbon text-sm sm:text-base flex items-center gap-1.5 flex-wrap">
                              <span>
                                {pack.key === 'pack_1'
                                  ? 'Essentiel'
                                  : pack.key === 'pack_2'
                                  ? 'Performance'
                                  : pack.key === 'pack_3'
                                  ? 'Entreprise'
                                  : `${pack.credits} crédits`}
                              </span>
                              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-mono">
                                {pack.credits} crédits
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {Math.floor(pack.credits / SEARCH_CREDIT_COST)} générations complètes de leads
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleBuyMaketou(pack)}
                          disabled={Boolean(pendingPackKey)}
                          className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-argile hover:bg-argile-dark text-white text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
                        >
                          {isPending && <LoaderCircle className="w-4 h-4 animate-spin" />}
                          <span>{isPending ? 'Redirection…' : formatPrice(pack.price, catalog.currency)}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {errorMessage && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm" role="alert">
                  <TriangleAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </>
          )}

          {/* ========================================================================= */}
          {/* ONGLET 2 : GUINÉE — ORANGE MONEY (GNF)                                     */}
          {/* ========================================================================= */}
          {activeTab === 'guinee' && (
            <div className="space-y-4">
              {omSuccessData ? (
                /* Écran de confirmation de soumission */
                <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-emerald-950">
                      Paiement Orange Money Guinée enregistré !
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-800 mt-1 max-w-md mx-auto">
                      Votre demande pour le <strong>{selectedOmPack.name} ({selectedOmPack.credits} crédits)</strong> a été transmise. Vos crédits seront crédités sur votre compte après vérification du SMS.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-emerald-100 text-xs font-mono text-gray-700 text-left space-y-1">
                    <div><strong>Montant :</strong> {selectedOmPack.priceFormatted}</div>
                    <div><strong>Référence :</strong> {omRef.toUpperCase()}</div>
                    <div><strong>Bénéficiaire :</strong> {ORANGE_MONEY_GUINEA_CONFIG.merchantName}</div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                    <a
                      href={omSuccessData.whatsappConfirmationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Confirmer sur WhatsApp (+224)</span>
                    </a>
                    <button
                      onClick={onClose}
                      className="w-full sm:w-auto py-3 px-5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Sélecteur du mode de paiement pour la Guinée */}
                  <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-2xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setGuineaMethod('orange')}
                      className={`flex-1 py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        guineaMethod === 'orange'
                          ? 'bg-[#FF7900] text-white shadow-xs'
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      <span>🟠 Orange Money</span>
                      <span className="text-[10px] bg-black/20 text-white px-1.5 py-0.2 rounded-full font-mono">GNF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGuineaMethod('momo')}
                      className={`flex-1 py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        guineaMethod === 'momo'
                          ? 'bg-amber-400 text-gray-950 shadow-xs'
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      <span>🟡 MTN MoMo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGuineaMethod('card')}
                      className={`flex-1 py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        guineaMethod === 'card'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      <span>💳 Carte Bancaire</span>
                    </button>
                  </div>

                  {/* CAS 1 : ORANGE MONEY GUINÉE (DIRECT GNF) */}
                  {guineaMethod === 'orange' && (
                    <>
                      {/* Bannière Orange Money Guinée */}
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FF7900] to-[#E05300] text-white flex items-center justify-between shadow-md">
                        <div>
                          <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
                            <span>Orange Money Guinée</span>
                            <span className="px-2 py-0.5 rounded-full bg-black/25 text-[10px] font-mono">GNF</span>
                          </div>
                          <p className="text-xs text-white/90 mt-0.5">
                            Paiement direct en Francs Guinéens par USSD (*144*4*4#) ou transfert mobile.
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold text-lg">
                          🇬🇳
                        </div>
                      </div>

                      {/* Choix des packs en GNF (incluant 5 crédits) */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 font-mono uppercase tracking-wider">
                          1. Choisissez votre pack en Francs Guinéens (GNF) :
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {ORANGE_MONEY_GUINEA_CONFIG.packs.map((pack) => {
                            const isSelected = selectedOmPackKey === pack.key;
                            return (
                              <div
                                key={pack.key}
                                onClick={() => setSelectedOmPackKey(pack.key)}
                                className={`p-2.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                                  isSelected
                                    ? 'border-[#FF7900] bg-orange-50/50 shadow-xs ring-1 ring-[#FF7900]'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-charbon">{pack.name}</span>
                                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded-full">
                                      {pack.credits} cr.
                                    </span>
                                  </div>
                                  <div className="text-xs sm:text-sm font-extrabold text-[#FF7900] mt-1 font-mono">
                                    {pack.priceFormatted}
                                  </div>
                                </div>
                                <div className="text-[10px] text-gray-500 mt-1 line-clamp-1">
                                  {pack.tagline}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Coordonnées de paiement Orange Money Guinée */}
                      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/90 space-y-2.5 text-xs">
                        <div className="font-bold text-gray-800 flex items-center justify-between">
                          <span>2. Effectuez le paiement Orange Money :</span>
                          <span className="text-[11px] font-mono font-semibold text-[#FF7900]">
                            Montant : {selectedOmPack.priceFormatted}
                          </span>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-2 font-mono">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Numéro Marchand :</span>
                            <div className="flex items-center gap-1.5 font-bold text-gray-900">
                              <span>{ORANGE_MONEY_GUINEA_CONFIG.merchantPhone}</span>
                              <button
                                type="button"
                                onClick={handleCopyMerchantNumber}
                                className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
                                title="Copier le numéro"
                              >
                                {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Code USSD Direct :</span>
                            <span className="font-bold text-gray-900">{ORANGE_MONEY_GUINEA_CONFIG.merchantCode}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Bénéficiaire :</span>
                            <span className="font-bold text-emerald-700">{ORANGE_MONEY_GUINEA_CONFIG.merchantName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Formulaire de confirmation Orange Money */}
                      <form onSubmit={handleSubmitOm} className="space-y-3">
                        <label className="text-xs font-bold text-gray-700 font-mono uppercase tracking-wider block">
                          3. Renseignez la référence de transaction SMS :
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[11px] text-gray-600 block mb-1">
                              Votre numéro expéditeur :
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: 624 00 00 00"
                              value={omPhone}
                              onChange={(e) => setOmPhone(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-[#FF7900]"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-gray-600 block mb-1">
                              Référence SMS Orange <span className="text-red-500">*</span> :
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Ex: CI2408... ou ID transaction"
                              value={omRef}
                              onChange={(e) => setOmRef(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-[#FF7900] font-mono font-bold text-gray-800"
                            />
                          </div>
                        </div>

                        {omError && (
                          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                            {omError}
                          </div>
                        )}

                        <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
                          <button
                            type="submit"
                            disabled={isSubmittingOm}
                            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#FF7900] hover:bg-[#E05300] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
                          >
                            {isSubmittingOm ? (
                              <>
                                <LoaderCircle className="w-4 h-4 animate-spin" />
                                <span>Vérification...</span>
                              </>
                            ) : (
                              <>
                                <span>Valider mon paiement Orange Money</span>
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </button>

                          <a
                            href={whatsappUrl(
                              ORANGE_MONEY_GUINEA_CONFIG.whatsappSupport,
                              `Bonjour GESLEAD, je souhaite payer le Pack ${selectedOmPack.name} (${selectedOmPack.priceFormatted}) par Orange Money Guinée.`
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full sm:w-auto py-3 px-3.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            title="Besoin d'aide sur WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4 text-emerald-600" />
                            <span>Aide WhatsApp</span>
                          </a>
                        </div>
                      </form>
                    </>
                  )}

                  {/* CAS 2 : MTN MOMO GUINÉE (VIA MAKETOU) */}
                  {guineaMethod === 'momo' && (
                    <div className="space-y-3">
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 text-amber-950 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold text-sm">
                            <span>🟡 MTN MoMo Guinée</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-mono">Passerelle Officielle</span>
                          </div>
                          <span className="text-xs font-bold text-amber-800">🇬🇳 Guinée</span>
                        </div>
                        <p className="text-xs text-amber-900/80 leading-relaxed mt-1">
                          Le paiement par <strong>MTN MoMo Guinée</strong> s'effectue via notre passerelle agréée Maketou. Choisissez votre pack ci-dessous pour ouvrir la page sécurisée où vous validerez sur votre téléphone.
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        <label className="text-xs font-bold text-gray-700 font-mono uppercase tracking-wider block">
                          Choisissez votre pack de crédits :
                        </label>
                        {(catalog?.packs || DEFAULT_CREDIT_CATALOG.packs).map((pack) => {
                          const isPending = pendingPackKey === pack.key;
                          return (
                            <div
                              key={pack.key}
                              className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-amber-200 hover:border-amber-400 transition-colors bg-amber-50/30"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-amber-400 text-amber-950 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                                  MoMo
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-charbon text-xs sm:text-sm flex items-center gap-1.5">
                                    <span>
                                      {pack.key === 'pack_1'
                                        ? 'Essentiel'
                                        : pack.key === 'pack_2'
                                        ? 'Performance'
                                        : pack.key === 'pack_3'
                                        ? 'Entreprise'
                                        : `${pack.credits} crédits`}
                                    </span>
                                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full font-mono">
                                      {pack.credits} cr.
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-gray-500">
                                    {Math.floor(pack.credits / SEARCH_CREDIT_COST)} générations de leads
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => handleBuyMaketou(pack)}
                                disabled={Boolean(pendingPackKey)}
                                className="flex-shrink-0 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-gray-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60 shadow-xs"
                              >
                                {isPending && <LoaderCircle className="w-3.5 h-3.5 animate-spin" />}
                                <span>{isPending ? 'Redirection…' : `Payer ${formatPrice(pack.price, catalog?.currency || 'XOF')}`}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* CAS 3 : CARTE BANCAIRE GUINÉE / INTERNATIONAL */}
                  {guineaMethod === 'card' && (
                    <div className="space-y-3">
                      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold text-sm">
                            <CreditCard className="w-4 h-4 text-blue-600" />
                            <span>💳 Carte Bancaire (Visa / MasterCard)</span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono">3D Secure</span>
                        </div>
                        <p className="text-xs text-blue-900/80 leading-relaxed mt-1">
                          Pour payer par carte Visa ou MasterCard depuis la Guinée ou l'étranger, cliquez sur votre pack. Sur la page sécurisée, renseignez votre numéro pour la vérification <strong>3D Secure (SMS OTP)</strong>, puis saisissez les <strong>16 chiffres de votre carte bancaire</strong>.
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        <label className="text-xs font-bold text-gray-700 font-mono uppercase tracking-wider block">
                          Choisissez votre pack de crédits :
                        </label>
                        {(catalog?.packs || DEFAULT_CREDIT_CATALOG.packs).map((pack) => {
                          const isPending = pendingPackKey === pack.key;
                          return (
                            <div
                              key={pack.key}
                              className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-blue-200 hover:border-blue-400 transition-colors bg-blue-50/20"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                                  <CreditCard className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-charbon text-xs sm:text-sm flex items-center gap-1.5">
                                    <span>
                                      {pack.key === 'pack_1'
                                        ? 'Essentiel'
                                        : pack.key === 'pack_2'
                                        ? 'Performance'
                                        : pack.key === 'pack_3'
                                        ? 'Entreprise'
                                        : `${pack.credits} crédits`}
                                    </span>
                                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full font-mono">
                                      {pack.credits} cr.
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-gray-500">
                                    {Math.floor(pack.credits / SEARCH_CREDIT_COST)} générations de leads
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => handleBuyMaketou(pack)}
                                disabled={Boolean(pendingPackKey)}
                                className="flex-shrink-0 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60 shadow-xs"
                              >
                                {isPending && <LoaderCircle className="w-3.5 h-3.5 animate-spin" />}
                                <span>{isPending ? 'Redirection…' : `Payer ${formatPrice(pack.price, catalog?.currency || 'XOF')}`}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Pied d'information */}
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex-shrink-0">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-creme-pure border border-mousse/10 text-[11px] sm:text-xs text-charbon/70">
            <ShieldCheck className="w-5 h-5 text-mousse flex-shrink-0" />
            <span>
              Paiements sécurisés par <strong>Maketou</strong> & <strong>Orange Money Guinée</strong>.
              Vos crédits sont valables à vie sans expiration et peuvent être utilisés sur toutes les villes d'Afrique.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
