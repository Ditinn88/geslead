import React, { useEffect, useState } from 'react';
import { Check, Smartphone, Sparkles } from 'lucide-react';
import { fetchCreditPacks } from '../lib/billing/maketou';
import { WELCOME_CREDITS, SEARCH_CREDIT_COST, formatPrice } from '../lib/billing/credits';
import { ORANGE_MONEY_GUINEA_CONFIG } from '../lib/billing/orangeMoneyGuinee';

const PACK_DETAILS = {
  pack_1: {
    name: 'Découverte',
    tagline: 'Idéal pour tester 5 générations complètes et signer vos premiers prospects.',
    features: [
      '5 générations complètes (15 crédits)',
      'Détection automatique numéros WhatsApp',
      'Export CSV complet (Excel FR)',
      'Liens directs wa.me illimités',
      'Crédits valables à vie sans expiration',
    ],
    buttonText: 'Choisir Découverte',
  },
  pack_2: {
    name: 'Essentiel',
    tagline: 'Idéal pour valider votre secteur et accélérer votre prospection.',
    features: [
      '15 générations complètes (45 crédits)',
      'Modèles de messages IA personnalisés',
      'Détection automatique numéros WhatsApp',
      'Export CSV illimité (Excel FR)',
      'Crédits valables à vie sans expiration',
    ],
    buttonText: 'Choisir Essentiel',
  },
  pack_3: {
    name: 'Performance',
    tagline: 'Pour les indépendants et commerciaux en prospection continue.',
    features: [
      '45 générations complètes (135 crédits)',
      'Modèles de messages IA haute conversion',
      'Détection automatique numéros WhatsApp',
      'Export CSV illimité (Excel FR)',
      'Support prioritaire WhatsApp',
      'Crédits valables à vie sans expiration',
    ],
    buttonText: 'Choisir Performance',
  },
  pack_4: {
    name: 'Entreprise',
    tagline: 'Volume massif pour équipes commerciales et prospection multi-villes.',
    features: [
      '135 générations complètes (405 crédits)',
      'Scraping multi-villes et multi-secteurs',
      'Accès IA modèles haute conversion',
      'Export CSV sans restriction',
      'Accompagnement & support dédié',
      'Crédits valables à vie sans expiration',
    ],
    buttonText: 'Choisir Entreprise',
  },
};

// Cartes de la section Tarifs : essai gratuit + packs de crédits (FCFA Maketou ou GNF Orange Money Guinée)
export default function CreditPricingCards({ onStartFree, onBuyCredits }) {
  const [catalog, setCatalog] = useState(null);
  const [currencyZone, setCurrencyZone] = useState('gnf'); // 'gnf' par défaut | 'xof'

  useEffect(() => {
    let cancelled = false;
    fetchCreditPacks().then((result) => {
      if (!cancelled) setCatalog(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const maketouPacks = catalog?.packs ?? [];
  const gnfPacks = ORANGE_MONEY_GUINEA_CONFIG.packs;
  const isGuinea = currencyZone === 'gnf';

  // Le pack Essentiel (30 000 GNF / 45 crédits) est mis en avant
  const highlightIndex = 1;

  return (
    <div className="space-y-8">
      {/* Sélecteur de Devise & Zone Géographique - GNF prioritaire */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center p-1.5 rounded-full bg-white border border-gray-200 shadow-sm gap-1">
          <button
            onClick={() => setCurrencyZone('gnf')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              isGuinea
                ? 'bg-[#FF7900] text-white shadow-xs'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <span>🇬🇳 Tarifs en Franc Guinéen (GNF · Orange Money)</span>
          </button>

          <button
            onClick={() => setCurrencyZone('xof')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              !isGuinea
                ? 'bg-argile text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>🌍 Autres Pays (FCFA & Carte Bancaire)</span>
          </button>
        </div>
      </div>

      {/* Grille des cartes de tarifs (1 essai gratuit + 4 packs payants = 5 colonnes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 lg:gap-6 items-stretch max-w-7xl mx-auto">
        {/* Carte Essai gratuit */}
        <div className="rounded-[2.5rem] bg-creme-pure border border-mousse/10 p-7 sm:p-8 flex flex-col justify-between shadow-md">
          <div>
            <span className="font-mono text-xs text-charbon/60 uppercase">Démarrage</span>
            <h3 className="text-2xl font-bold text-charbon mt-1">Essai gratuit</h3>
            <p className="text-xs text-charbon/70 mt-2">Testez la pertinence des leads dans votre secteur.</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold font-sans text-charbon">Gratuit</span>
              <span className="text-xs text-charbon/60 font-mono">/ à l'inscription</span>
            </div>
            <ul className="mt-8 space-y-3 text-xs text-charbon/80">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-700 flex-shrink-0" />
                <strong>{WELCOME_CREDITS} crédits offerts</strong>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-700 flex-shrink-0" />1 génération de leads = {SEARCH_CREDIT_COST} crédits
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-700 flex-shrink-0" />
                Export CSV complet (Excel FR)
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-700 flex-shrink-0" />
                Liens WhatsApp wa.me illimités
              </li>
            </ul>
          </div>
          <button
            onClick={onStartFree}
            className="mt-8 w-full py-3 rounded-full border border-charbon/20 hover:border-charbon text-charbon font-semibold text-xs transition-colors cursor-pointer"
          >
            Commencer gratuitement
          </button>
        </div>

        {/* Packs : Mode Guinée (Orange Money GNF) ou Mode FCFA (Maketou) */}
        {isGuinea ? (
          // Affichage des packs Orange Money Guinée en GNF
          gnfPacks.map((pack, index) => {
            const isHighlighted = index === highlightIndex;
            const details = PACK_DETAILS[pack.key];
            return (
              <div
                key={pack.key}
                className={
                  isHighlighted
                    ? 'rounded-[2.5rem] bg-[#142319] text-creme border-2 border-[#FF7900] p-7 sm:p-8 flex flex-col justify-between shadow-2xl relative transform md:-translate-y-3'
                    : 'rounded-[2.5rem] bg-creme-pure border border-mousse/10 p-7 sm:p-8 flex flex-col justify-between shadow-md'
                }
              >
                {isHighlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#FF7900] text-white font-mono text-[10px] uppercase font-bold tracking-widest px-4 py-1 rounded-full shadow-md whitespace-nowrap">
                    LE PLUS POPULAIRE EN GUINÉE
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-xs uppercase ${isHighlighted ? 'text-creme/70' : 'text-charbon/60'}`}>
                      {details.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FF7900]/20 text-[#FF7900] font-bold">
                      Orange Money
                    </span>
                  </div>

                  <h3 className={`text-2xl font-bold mt-1 ${isHighlighted ? 'text-creme' : 'text-charbon'}`}>
                    {pack.credits} crédits
                  </h3>
                  <p className={`text-xs mt-1.5 min-h-[32px] ${isHighlighted ? 'text-creme/80' : 'text-charbon/70'}`}>
                    {details.tagline}
                  </p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className={`text-3xl sm:text-4xl font-extrabold font-sans ${isHighlighted ? 'text-creme' : 'text-charbon'}`}>
                      {pack.priceFormatted}
                    </span>
                  </div>
                  <ul className={`mt-6 space-y-2.5 text-xs ${isHighlighted ? 'text-creme/90' : 'text-charbon/80'}`}>
                    {details.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2">
                        <Check className={`w-4 h-4 flex-shrink-0 ${isHighlighted ? 'text-[#FF7900]' : 'text-green-700'}`} />
                        <span>{feat}</span>
                      </li>
                    ))}
                    <li className="flex items-center gap-2">
                      <Smartphone className={`w-4 h-4 flex-shrink-0 ${isHighlighted ? 'text-[#FF7900]' : 'text-green-700'}`} />
                      <span>Orange Money Guinée (*144# ou transfert)</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => onBuyCredits(pack.key, 'guinee')}
                  className={
                    isHighlighted
                      ? 'mt-8 w-full py-3.5 rounded-full bg-[#FF7900] hover:bg-[#E05300] text-white font-semibold text-xs shadow-lg transition-colors cursor-pointer'
                      : 'mt-8 w-full py-3 rounded-full border border-[#FF7900] text-[#FF7900] hover:bg-[#FF7900] hover:text-white font-semibold text-xs transition-colors cursor-pointer'
                  }
                >
                  Payer avec Orange Money ({pack.priceFormatted})
                </button>
              </div>
            );
          })
        ) : (
          // Affichage des packs Maketou en FCFA
          maketouPacks.map((pack, index) => {
            const isHighlighted = index === highlightIndex;
            const details = PACK_DETAILS[pack.key] || {
              name: `Pack ${index + 1}`,
              tagline: 'Rechargez vos crédits selon vos besoins.',
              features: [
                `${Math.floor(pack.credits / SEARCH_CREDIT_COST)} générations de leads`,
                'Crédits sans date d\'expiration',
                'Mobile Money ou carte via Maketou',
              ],
              buttonText: `Acheter ${pack.credits} crédits`,
            };
            return (
              <div
                key={pack.key}
                className={
                  isHighlighted
                    ? 'rounded-[2.5rem] bg-mousse text-creme border-2 border-argile p-7 sm:p-8 flex flex-col justify-between shadow-2xl relative transform md:-translate-y-3'
                    : 'rounded-[2.5rem] bg-creme-pure border border-mousse/10 p-7 sm:p-8 flex flex-col justify-between shadow-md'
                }
              >
                {isHighlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-argile text-white font-mono text-[10px] uppercase font-bold tracking-widest px-4 py-1 rounded-full shadow-md whitespace-nowrap">
                    LE PLUS POPULAIRE
                  </div>
                )}
                <div>
                  <span className={`font-mono text-xs uppercase ${isHighlighted ? 'text-creme/70' : 'text-charbon/60'}`}>
                    {details.name}
                  </span>
                  <h3 className={`text-2xl font-bold mt-1 ${isHighlighted ? 'text-creme' : 'text-charbon'}`}>
                    {pack.credits} crédits
                  </h3>
                  <p className={`text-xs mt-1.5 min-h-[32px] ${isHighlighted ? 'text-creme/80' : 'text-charbon/70'}`}>
                    {details.tagline}
                  </p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className={`text-3xl sm:text-4xl font-extrabold font-sans ${isHighlighted ? 'text-creme' : 'text-charbon'}`}>
                      {formatPrice(pack.price, catalog?.currency || 'XOF')}
                    </span>
                  </div>
                  <ul className={`mt-6 space-y-2.5 text-xs ${isHighlighted ? 'text-creme/90' : 'text-charbon/80'}`}>
                    {details.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2">
                        <Check className={`w-4 h-4 flex-shrink-0 ${isHighlighted ? 'text-argile' : 'text-green-700'}`} />
                        <span>{feat}</span>
                      </li>
                    ))}
                    <li className="flex items-center gap-2">
                      <Smartphone className={`w-4 h-4 flex-shrink-0 ${isHighlighted ? 'text-argile' : 'text-green-700'}`} />
                      <span>Wave, Orange Money, MoMo & Carte</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => onBuyCredits(pack.key, 'maketou')}
                  className={
                    isHighlighted
                      ? 'mt-8 w-full py-3.5 rounded-full bg-argile hover:bg-argile-dark text-white font-semibold text-xs shadow-lg transition-colors cursor-pointer'
                      : 'mt-8 w-full py-3 rounded-full border border-charbon/20 hover:border-charbon text-charbon font-semibold text-xs transition-colors cursor-pointer'
                  }
                >
                  {details.buttonText}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
