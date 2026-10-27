import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  MapPin,
  Sparkles,
  Phone,
  CheckCircle2,
  Globe,
  Radio,
  Clock,
  ShieldCheck,
  Store,
  SlidersHorizontal,
  Wand2,
  Search,
  Star,
} from 'lucide-react';
import { AFRICAN_COUNTRIES_LIST } from '@/lib/geo';

export default function NewSearchModal({
  isOpen,
  onClose,
  sector,
  setSector,
  city,
  setCity,
  country,
  setCountry,
  maxResults = '30',
  setMaxResults,
  websiteFilter = 'all',
  setWebsiteFilter,
  minRating = '0',
  setMinRating,
  minReviews = '0',
  setMinReviews,
  isExtracting,
  extractionStep = 0,
  extractionProgress = 0,
  extractedCount = 0,
  onSubmit,
  creditCost = 3,
  userCredits = 0,
  isCreator = false
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);

  // Chronomètre en direct pendant l'extraction
  useEffect(() => {
    let timer;
    if (isExtracting) {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds((prev) => +(prev + 0.1).toFixed(1));
      }, 100);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isExtracting]);

  if (!isOpen) return null;

  const extractionSteps = [
    {
      title: 'Connexion aux serveurs Google Maps Places',
      desc: 'Initialisation du crawler géolocalisé et handshake sécurisé',
      icon: Radio
    },
    {
      title: `Scan territorial à ${city || 'la zone cible'}`,
      desc: `Balayage des fiches d'entreprises : "${sector || 'votre secteur'}"`,
      icon: MapPin
    },
    {
      title: 'Filtrage mobile & vérification WhatsApp',
      desc: 'Validation des préfixes cellulaires (+221, +225, +229, +237...) et liens wa.me',
      icon: Phone
    },
    {
      title: 'Application des filtres (Site web, Note & Avis)',
      desc: `Filtres actifs : ${websiteFilter === 'without' ? 'Sans site' : websiteFilter === 'with' ? 'Avec site' : 'Tous'} • Note min: ${minRating}★ • Quota: ${maxResults} leads`,
      icon: Globe
    },
    {
      title: 'Finalisation et compilation de votre base',
      desc: 'Structuration des données GPS et préparation pour le ciblage IA',
      icon: Sparkles
    }
  ];

  const countriesList = AFRICAN_COUNTRIES_LIST;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden text-gray-900">
        
        {/* ========================================================================= */}
        {/* En-tête Vert Sombre (Conforme 1:1 à la Capture d'écran utilisateur)        */}
        {/* ========================================================================= */}
        <div className="bg-[#1C2E24] px-6 sm:px-8 py-7 sm:py-8 text-left relative text-white overflow-hidden">
          {/* Filigrane décoratif circulaire visible sur la capture */}
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full border-[10px] border-white/5 pointer-events-none" />

          {!isExtracting && (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          
          <h2 className="font-bold text-2xl sm:text-3xl tracking-tight text-white flex items-center gap-2 font-sans">
            <span>Lancer une extraction</span>
            {isExtracting && <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />}
          </h2>
          <p className="text-xs sm:text-sm text-white/80 mt-1.5 font-sans max-w-md leading-relaxed">
            {isExtracting
              ? 'Extraction en temps réel depuis Google Maps Places avec application de vos filtres...'
              : 'Visez un secteur, une ville, et notre IA récupérera les numéros, emails et avis directement depuis Google Maps.'}
          </p>
        </div>

        {/* ========================================================================= */}
        {/* MODE 1 : HUD D'EXTRACTION EN TEMPS RÉEL (Si extraction en cours)          */}
        {/* ========================================================================= */}
        {isExtracting ? (
          <div className="p-4 sm:p-8 space-y-5 bg-gray-50/70">
            
            {/* Visualisation Radar & Compteur de Prospects */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-2xl bg-[#CC5833]/15 flex items-center justify-center flex-shrink-0">
                  <div className="absolute inset-0 rounded-2xl bg-[#CC5833]/20 animate-ping" />
                  <MapPin className="w-5 h-5 text-[#CC5833] relative z-10" />
                </div>
                <div>
                  <div className="text-[11px] font-mono text-gray-500 uppercase tracking-wide">
                    Prospects Détectés (Objectif : {maxResults})
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-gray-900 font-sans flex items-center gap-2">
                    <span>{extractedCount}</span>
                    <span className="text-[11px] font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-mono">
                      + live scan
                    </span>
                  </div>
                </div>
              </div>

              {/* Chronomètre en direct */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 font-mono text-xs text-gray-700">
                <Clock className="w-3.5 h-3.5 text-gray-500" />
                <span>{elapsedSeconds}s écoulées</span>
              </div>
            </div>

            {/* Barre de Progression Animée */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-gray-600">
                <span>Avancement de l'extraction</span>
                <span className="font-bold text-[#D9534F]">{extractionProgress}%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-[#D9534F] to-[#e06b47] rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, Math.max(5, extractionProgress))}%` }}
                />
              </div>
            </div>

            {/* Étapes séquentielles en direct */}
            <div className="space-y-1.5">
              {extractionSteps.map((s, idx) => {
                const StepIcon = s.icon;
                const isDone = extractionStep > idx;
                const isCurrent = extractionStep === idx;

                return (
                  <div
                    key={idx}
                    className={`p-2.5 sm:p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                      isCurrent
                        ? 'bg-amber-50/80 border-amber-300 shadow-xs'
                        : isDone
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-white border-gray-100 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-[#D9534F] text-white animate-pulse'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : isCurrent ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <StepIcon className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold leading-tight ${
                            isCurrent ? 'text-gray-900' : isDone ? 'text-emerald-900' : 'text-gray-500'
                          }`}
                        >
                          {s.title}
                        </span>
                        <span className="text-[10px] font-mono font-medium">
                          {isDone ? (
                            <span className="text-emerald-700">Validé</span>
                          ) : isCurrent ? (
                            <span className="text-[#D9534F] animate-pulse">En cours...</span>
                          ) : (
                            <span className="text-gray-400">En attente</span>
                          )}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Notification de sécurité */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[11px] text-blue-900 font-sans">
              <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>
                <strong>Traitement continu :</strong> Vos {maxResults} prospects sont récupérés sans interruption réseau.
              </span>
            </div>

          </div>
        ) : (
          /* ======================================================================= */
          /* MODE 2 : FORMULAIRE COMPLET AVEC FILTRES AVANCÉS (Conforme 1:1 Capture) */
          /* ======================================================================= */
          <form onSubmit={onSubmit} className="p-5 sm:p-8 bg-white space-y-4">
            
            {/* Champ 1 : Que cherchez-vous ? (Conforme 1:1 Capture) */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-emerald-600" />
                <span>Que cherchez-vous ?</span>
              </label>
              <input
                type="text"
                required
                placeholder="dentist"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#D9534F] focus:ring-1 focus:ring-[#D9534F] transition-all shadow-2xs font-sans"
              />
            </div>

            {/* Champ 2 & 3 : Dans quelle ville ? & Pays (Conforme 1:1 Capture) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Dans quelle ville ?</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dakar, Abidjan..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#D9534F] focus:ring-1 focus:ring-[#D9534F] transition-all shadow-2xs font-sans"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5">
                  Pays
                </label>
                {/* SELECT 100% OPAQUE - Zéro transparence */}
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm font-medium focus:outline-none focus:border-[#D9534F] focus:ring-1 focus:ring-[#D9534F] transition-all cursor-pointer shadow-2xs font-sans"
                >
                  {countriesList.map((c) => (
                    <option key={c} value={c} className="bg-white text-gray-900 py-1.5">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section : Filtres Avancés (Conforme 1:1 à la Capture d'écran utilisateur) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 transition-colors py-1 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500" />
                <span>Filtres Avancés</span>
                <span className="text-gray-400 font-mono">{showAdvancedFilters ? '⌃' : '⌄'}</span>
              </button>

              {showAdvancedFilters && (
                <div className="mt-2.5 p-4 sm:p-5 rounded-2xl bg-[#F8F9FA] border border-gray-200/80 space-y-4">
                  
                  {/* Grille des 4 Filtres : Quotas, Site Internet, Note, Avis */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                    
                    {/* 1. Max Résultats (Quotas) */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                        <Search className="w-3.5 h-3.5 text-gray-400" />
                        <span>Max Résultats (Quotas)</span>
                      </label>
                      <select
                        value={maxResults}
                        onChange={(e) => setMaxResults(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#D9534F] cursor-pointer shadow-2xs font-sans"
                      >
                        <option value="10" className="bg-white text-gray-900">10</option>
                        <option value="20" className="bg-white text-gray-900">20</option>
                        <option value="30" className="bg-white text-gray-900">30</option>
                        <option value="50" className="bg-white text-gray-900">50</option>
                        <option value="100" className="bg-white text-gray-900">100</option>
                        <option value="200" className="bg-white text-gray-900">200</option>
                      </select>
                    </div>

                    {/* 2. Site Internet (all / without / with) */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-gray-400" />
                        <span>Site Internet</span>
                      </label>
                      <select
                        value={websiteFilter}
                        onChange={(e) => setWebsiteFilter(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#D9534F] cursor-pointer shadow-2xs font-sans"
                      >
                        <option value="all" className="bg-white text-gray-900">all</option>
                        <option value="without" className="bg-white text-gray-900">Sans site web uniquement</option>
                        <option value="with" className="bg-white text-gray-900">Avec site web uniquement</option>
                      </select>
                    </div>

                    {/* 3. Note Minimum (0 / 3.5 / 4.0 / 4.5 / 4.8) */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-gray-400" />
                        <span>Note Minimum</span>
                      </label>
                      <select
                        value={minRating}
                        onChange={(e) => setMinRating(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#D9534F] cursor-pointer shadow-2xs font-sans"
                      >
                        <option value="0" className="bg-white text-gray-900">0</option>
                        <option value="3.5" className="bg-white text-gray-900">3.5★+</option>
                        <option value="4.0" className="bg-white text-gray-900">4.0★+</option>
                        <option value="4.5" className="bg-white text-gray-900">4.5★+</option>
                        <option value="4.8" className="bg-white text-gray-900">4.8★+</option>
                      </select>
                    </div>

                    {/* 4. Avis Minimum (0 / 5 / 10 / 25 / 50) */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span>Avis Minimum</span>
                      </label>
                      <select
                        value={minReviews}
                        onChange={(e) => setMinReviews(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#D9534F] cursor-pointer shadow-2xs font-sans"
                      >
                        <option value="0" className="bg-white text-gray-900">0</option>
                        <option value="5" className="bg-white text-gray-900">5+ avis</option>
                        <option value="10" className="bg-white text-gray-900">10+ avis</option>
                        <option value="25" className="bg-white text-gray-900">25+ avis</option>
                        <option value="50" className="bg-white text-gray-900">50+ avis</option>
                      </select>
                    </div>

                  </div>

                </div>
              )}
            </div>

            {/* Coût en crédits, affiché avant validation */}
            <div className={`flex items-center justify-between mt-4 px-3.5 py-2.5 rounded-xl border text-xs font-mono ${
              isCreator
                ? 'bg-amber-50 border-amber-300 text-amber-950 font-semibold'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <span className="flex items-center gap-1.5 font-bold">
                {isCreator ? (
                  <>
                    <span>👑</span>
                    <span>Accès Créateur : Gratuit (0 crédit débité)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Coût : {creditCost} crédits</span>
                  </>
                )}
              </span>
              <span className={isCreator ? 'text-amber-800 font-bold' : userCredits < creditCost ? 'text-red-700 font-bold' : ''}>
                {isCreator ? 'Solde : Illimité ∞' : `Solde : ${userCredits} crédits`}
              </span>
            </div>

            {/* Bouton Principal Terracotta : Lancer l'Extraction Magique (Conforme 1:1 Capture) */}
            <button
              type="submit"
              className="w-full mt-4 py-3.5 px-6 rounded-xl bg-[#D9534F] hover:bg-[#c94541] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-[1.01]"
            >
              <Wand2 className="w-4 h-4 stroke-[2.2]" />
              <span>Lancer l'Extraction Magique</span>
            </button>

            {/* Notice au bas du formulaire */}
            <p className="text-center text-xs text-gray-500 mt-2 leading-relaxed font-sans">
              Scan territorial en direct : Google Maps Places, détection WhatsApp et filtres avancés.
            </p>
          </form>
        )}

      </div>
    </div>
  );
}
