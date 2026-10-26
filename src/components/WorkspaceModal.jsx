import React from 'react';
import {
  X,
  Search,
  Sparkles,
  MessageCircle,
  RefreshCw,
  Copy,
  Check,
  MapPin,
  ExternalLink,
  Phone,
  Download,
  Calendar,
  Wand2,
  ArrowLeft,
  LogOut
} from 'lucide-react';
import { whatsappUrl } from '../lib/whatsapp';

function getGoogleMapsUrl(lead) {
  if (lead.maps_url && lead.maps_url.startsWith('http') && !lead.maps_url.includes('cid=')) {
    return lead.maps_url;
  }
  const query = [lead.name, lead.address, lead.city, lead.country].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default function WorkspaceModal({
  isOpen,
  isPage = false,
  onClose,
  onSignOut,
  leadsList = [],
  currentCampaign = null,
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter,
  onExportCsv,
  selectedLead,
  setSelectedLead,
  messageChannel,
  setMessageChannel,
  messageTone,
  setMessageTone,
  aiGeneratedText,
  isGeneratingAi,
  aiGenerationStatus = 'idle',
  aiSource = 'openai',
  handleStartAiGeneration,
  copiedId,
  handleCopy,
  viewCount = 1
}) {
  if (!isOpen) return null;

  // Métadonnées de campagne (Conforme Capture 1)
  const campaignSector = currentCampaign?.sector || leadsList[0]?.category || 'ophtalmologue';
  const campaignCity = currentCampaign?.city || leadsList[0]?.city || 'cotonou';
  const campaignCountry = currentCampaign?.country || leadsList[0]?.country || 'Bénin';
  const campaignDate = currentCampaign?.date || '8 avril 2026';

  // Statistiques calculées dynamiquement (Conforme 1:1 à la Capture 1)
  const totalLeads = leadsList.length;
  const withWebsite = leadsList.filter((l) => Boolean(l.website)).length;
  const withPhone = leadsList.filter((l) => Boolean(l.phone_raw || l.phone_e164)).length;
  const noWebsiteWithPhone = leadsList.filter(
    (l) => !l.website && Boolean(l.phone_raw || l.phone_e164)
  ).length;
  const avgRating =
    totalLeads > 0
      ? (
          leadsList.reduce((acc, l) => acc + (parseFloat(l.rating) || 0), 0) /
          totalLeads
        ).toFixed(1)
      : '4.0';
  const avgReviews =
    totalLeads > 0
      ? Math.round(
          leadsList.reduce((acc, l) => acc + (parseInt(l.reviews_count) || 0), 0) /
            totalLeads
        )
      : 8;

  // Composant du contenu principal (Réutilisé en mode page ou en mode modale)
  const renderMainContent = () => (
    <div className="space-y-4 sm:space-y-6 w-full">
      
      {/* 1. TITRE DE LA CAMPAGNE & MÉTADONNÉES (Conforme 1:1 Capture 1) */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight font-sans">
          Il y a {totalLeads} leads pour "{campaignSector}"
        </h1>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-white/80 font-sans">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span className="capitalize">{campaignCity}, {campaignCountry}</span>
          </span>

          <span className="text-white/40">•</span>

          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-white/60" />
            <span>Extrait le {campaignDate}</span>
          </span>
        </div>
      </div>

      {/* 2. STATS BAR (Conforme 1:1 Capture 1) */}
      <div className="flex flex-wrap items-center justify-start gap-x-5 sm:gap-x-7 gap-y-2 text-xs sm:text-sm text-white/90 font-sans pt-1">
        <div>
          <span className="font-bold text-white text-sm sm:text-base mr-1">{withWebsite}</span>
          <span className="text-white/80">ont un site web</span>
        </div>

        <div>
          <span className="font-bold text-white text-sm sm:text-base mr-1">{withPhone}</span>
          <span className="text-white/80">ont un numéro de téléphone</span>
        </div>

        <div>
          <span className="font-bold text-white text-sm sm:text-base mr-1">{noWebsiteWithPhone}</span>
          <span className="text-white/80">n'ont pas de site mais un téléphone</span>
        </div>

        <div>
          <span className="font-bold text-white text-sm sm:text-base mr-1">{avgRating}</span>
          <span className="text-white/80">note moyenne</span>
        </div>

        <div>
          <span className="font-bold text-white text-sm sm:text-base mr-1">{avgReviews}</span>
          <span className="text-white/80">avis moyens par lead</span>
        </div>
      </div>

      {/* 3. RED BANNER (Conforme 1:1 Capture 1) */}
      <div className="bg-[#D9534F] text-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xl">
        <button
          onClick={() => onExportCsv(leadsList)}
          className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-white text-[#D9534F] hover:bg-gray-50 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#D9534F] stroke-[2.5]" />
          <span>Télécharger la liste (CSV)</span>
        </button>

        <p className="text-white/95 text-xs sm:text-sm text-center md:text-left font-sans">
          Cliquez sur « Télécharger la liste » pour obtenir les données complètes.
        </p>

        <div className="text-white/90 font-mono text-xs whitespace-nowrap">
          Total vues: {viewCount}
        </div>
      </div>

      {/* 4. RECHERCHE & FILTRES RAPIDES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-white/50 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filtrer par nom, adresse, statut..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-white/50 focus:outline-none focus:border-[#D9534F] focus:bg-white/15 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-mono no-scrollbar">
          {[
            { id: 'all', label: `Tous (${totalLeads})` },
            { id: 'mobile', label: `WhatsApp (${withPhone})` },
            { id: 'noWebsite', label: `Sans Site (${totalLeads - withWebsite})` }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer text-[11px] ${
                activeFilter === f.id
                  ? 'bg-[#D9534F] text-white font-bold shadow-xs'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. BIG WHITE TABLE CARD (Conforme 1:1 Capture 1) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-7 shadow-2xl text-gray-900 border border-gray-100 overflow-hidden w-full">
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="border-b border-gray-200 text-gray-500 uppercase font-sans font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="pb-4 pt-1 px-3 font-semibold">NOM COMPLET & ADRESSE</th>
                <th className="pb-4 pt-1 px-3 font-semibold">CONTACT</th>
                <th className="pb-4 pt-1 px-3 font-semibold">LIENS</th>
                <th className="pb-4 pt-1 px-3 font-semibold">NOTE</th>
                <th className="pb-4 pt-1 px-3 text-right font-semibold">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leadsList.map((lead) => {
                const mapsUrl = getGoogleMapsUrl(lead);
                const hasPhone = Boolean(lead.phone_raw || lead.phone_e164);
                const hasRating = lead.rating && parseFloat(lead.rating) > 0;

                return (
                  <tr key={lead.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* 1. NOM COMPLET & ADRESSE */}
                    <td className="py-4 px-3 align-top">
                      <div className="font-bold text-gray-900 text-sm leading-snug">
                        {lead.name}
                      </div>
                      <div className="text-xs text-gray-500 font-normal mt-0.5">
                        {lead.category || 'Établissement'}
                      </div>
                      <div className="text-[11px] text-gray-400 font-sans mt-1 flex items-center gap-1 truncate max-w-[280px]">
                        <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span>{lead.address || `${lead.city}, ${lead.country}`}</span>
                      </div>
                    </td>

                    {/* 2. CONTACT */}
                    <td className="py-4 px-3 align-top font-mono text-xs">
                      {hasPhone ? (
                        <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                          <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span>{lead.phone_raw || lead.phone_e164}</span>
                        </div>
                      ) : (
                        <div className="text-gray-400 italic text-[11px]">
                          - Pas de tel -
                        </div>
                      )}
                    </td>

                    {/* 3. LIENS */}
                    <td className="py-4 px-3 align-top text-xs space-y-1">
                      {lead.website ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 font-medium text-[11px]"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Site Web</span>
                        </a>
                      ) : (
                        <div className="text-gray-400 italic text-[11px]">
                          - Pas de site web -
                        </div>
                      )}

                      <div>
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-700 hover:text-amber-900 hover:underline inline-flex items-center gap-1 font-medium text-[11px]"
                          title="Voir sur Google Maps"
                        >
                          <MapPin className="w-3 h-3 text-amber-500" />
                          <span>Google Maps</span>
                        </a>
                      </div>
                    </td>

                    {/* 4. NOTE */}
                    <td className="py-4 px-3 align-top font-sans">
                      {hasRating ? (
                        <div>
                          <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#1A2E22] text-white font-bold text-xs">
                            {lead.rating} / 5
                          </span>
                          <div className="text-[11px] text-gray-400 mt-1">
                            {lead.reviews_count || 1} avis clients
                          </div>
                        </div>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-500 font-semibold text-xs">
                          N/A
                        </span>
                      )}
                    </td>

                    {/* 5. ACTION : Bouton noir [ 💬 Message IA ] */}
                    <td className="py-4 px-3 align-top text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {hasPhone ? (
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="px-3.5 py-2 rounded-xl bg-[#1A1A1A] hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
                            title="Rédiger un message IA personnalisé"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Message IA</span>
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-300 text-xs font-medium cursor-not-allowed"
                            title="Numéro de contact manquant"
                          >
                            Message IA
                          </button>
                        )}

                        {lead.phone_e164 && (
                          <a
                            href={whatsappUrl(lead.phone_e164)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                            title="Ouvrir WhatsApp direct"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards View (Plein écran sans padding excessif) */}
        <div className="block md:hidden space-y-3 w-full">
          {leadsList.map((lead) => {
            const mapsUrl = getGoogleMapsUrl(lead);
            const hasPhone = Boolean(lead.phone_raw || lead.phone_e164);
            const hasRating = lead.rating && parseFloat(lead.rating) > 0;

            return (
              <div
                key={lead.id}
                className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/60 space-y-2.5 w-full"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-gray-900 leading-snug break-words">
                      {lead.name}
                    </h4>
                    <div className="text-xs text-gray-500">{lead.category}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5 truncate">
                      {lead.address || `${lead.city}, ${lead.country}`}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    {hasRating ? (
                      <span className="inline-block px-2 py-0.5 rounded-md bg-[#1A2E22] text-white font-bold text-xs">
                        {lead.rating}★
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-md bg-gray-200 text-gray-600 font-medium text-xs">
                        N/A
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs border-t border-gray-200/60">
                  <div className="flex items-center gap-1.5 font-mono text-gray-700">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{lead.phone_raw || '- Pas de tel -'}</span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px]">
                    {lead.website ? (
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Site Web
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">- Pas de site -</span>
                    )}

                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-700 hover:underline flex items-center gap-0.5"
                    >
                      <MapPin className="w-3 h-3 text-amber-500" />
                      <span>Maps</span>
                    </a>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => setSelectedLead(lead)}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#1A1A1A] hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Rédiger avec l'IA</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );

  return (
    <>
      {isPage ? (
        /* ========================================================================= */
        /* MODE PAGE PLEIN ÉCRAN (Conforme 1:1 à la Capture 1)                       */
        /* ========================================================================= */
        <div className="min-h-screen bg-[#1C2E24] text-white font-sans selection:bg-[#D9534F] selection:text-white">
          <header className="w-full bg-[#15241C] border-b border-white/10 px-3.5 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white/90 hover:text-white px-3 py-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour au Dashboard</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onExportCsv(leadsList)}
                className="px-3.5 py-1.5 rounded-full bg-[#D9534F] hover:bg-[#c94541] text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exporter CSV ({totalLeads})</span>
              </button>

              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Se déconnecter"
                >
                  <LogOut className="w-3.5 h-3.5 stroke-[2]" />
                  <span className="hidden sm:inline">Déconnexion</span>
                </button>
              )}
            </div>
          </header>

          <main className="max-w-6xl mx-auto px-2.5 sm:px-8 py-6 sm:py-10">
            {renderMainContent()}
          </main>
        </div>
      ) : (
        /* ========================================================================= */
        /* MODE MODAL OVERLAY                                                        */
        /* ========================================================================= */
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-1 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full h-full sm:h-auto sm:max-h-[96vh] max-w-6xl bg-[#1C2E24] rounded-2xl sm:rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden text-white">
            <div className="px-3.5 sm:px-8 py-3 bg-[#15241C] flex items-center justify-between border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#D9534F] flex items-center justify-center font-bold text-xs text-white shadow-xs">
                  G
                </div>
                <span className="font-bold text-xs sm:text-sm text-white font-sans">
                  GesLead Workspace
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => onExportCsv(leadsList)}
                  className="px-3 sm:px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV ({totalLeads})</span>
                </button>
                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    className="p-1.5 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors cursor-pointer"
                    title="Se déconnecter"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2.5 sm:px-8 py-4 sm:py-6 bg-[#1C2E24]">
              {renderMainContent()}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODALE IA DÉDIÉE (Conforme 1:1 Capture 4)                                */}
      {/* 100% OPAQUE - AUCUNE TRANSPARENCE                                         */}
      {/* ========================================================================= */}
      {selectedLead && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden text-gray-900">
            
            {/* En-tête Modal IA (100% Opaque) */}
            <div className="p-5 sm:p-7 border-b border-gray-100 relative bg-white">
              <button
                onClick={() => setSelectedLead(null)}
                className="absolute right-5 top-5 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="font-bold text-lg sm:text-2xl text-gray-900 tracking-tight pr-8">
                Générer un message pour {selectedLead.name}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 font-sans">
                Personnalisez le canal et le ton. Notre système GPT rédigera un message de prospection ultra-personnalisé.
              </p>
            </div>

            {/* Corps du Formulaire de Paramétrage (Conforme 1:1 Capture 4) */}
            <div className="p-5 sm:p-7 space-y-5 bg-white">
              
              {/* Sélecteurs 100% Opaques : Canal & Ton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Canal de contact
                  </label>
                  {/* SELECT 100% OPAQUE */}
                  <select
                    value={messageChannel}
                    onChange={(e) => setMessageChannel(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm font-medium focus:outline-none focus:border-[#D9534F] focus:ring-1 focus:ring-[#D9534F] shadow-2xs transition-all cursor-pointer"
                  >
                    <option value="whatsapp" className="bg-white text-gray-900 py-1.5">whatsapp</option>
                    <option value="email" className="bg-white text-gray-900 py-1.5">email</option>
                    <option value="sms" className="bg-white text-gray-900 py-1.5">sms</option>
                    <option value="linkedin" className="bg-white text-gray-900 py-1.5">linkedin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Ton du message
                  </label>
                  {/* SELECT 100% OPAQUE */}
                  <select
                    value={messageTone}
                    onChange={(e) => setMessageTone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm font-medium focus:outline-none focus:border-[#D9534F] focus:ring-1 focus:ring-[#D9534F] shadow-2xs transition-all cursor-pointer"
                  >
                    <option value="professionnel" className="bg-white text-gray-900 py-1.5">professionnel</option>
                    <option value="chaleureux" className="bg-white text-gray-900 py-1.5">chaleureux</option>
                    <option value="direct" className="bg-white text-gray-900 py-1.5">direct</option>
                  </select>
                </div>
              </div>

              {/* Box de contenu / Résultat IA (Conforme Capture 4) */}
              {!aiGeneratedText && !isGeneratingAi ? (
                /* Box initiale avec l'icône de baguette magique (Capture 4) */
                <div className="p-8 sm:p-10 rounded-2xl bg-[#F8F9FA] border border-gray-200/80 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white shadow-xs flex items-center justify-center text-gray-400 mb-3 border border-gray-200/60">
                    <Wand2 className="w-6 h-6 stroke-[1.75]" />
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 max-w-md font-sans leading-relaxed">
                    Sélectionnez vos paramètres et cliquez ci-dessous. Un prompt optimisé pour l'Afrique francophone sera exécuté.
                  </p>
                </div>
              ) : (
                /* Console d'affichage avec streaming temps réel garanti sans écran blanc */
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {isGeneratingAi ? "L'IA rédige en direct..." : "Message commercial finalisé"}
                    </span>
                    <span className="text-gray-400">
                      {aiSource === 'openai' ? 'Modèle : GPT-4o-mini' : 'Moteur B2B Local'}
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-gray-50 border border-gray-200 font-sans text-xs sm:text-sm leading-relaxed text-gray-800 min-h-[140px] max-h-[260px] overflow-y-auto whitespace-pre-wrap shadow-inner">
                    {aiGeneratedText}
                    {isGeneratingAi && (
                      <span className="inline-block w-2 h-4 bg-[#D9534F] ml-1 animate-pulse align-middle" />
                    )}
                  </div>
                </div>
              )}

              {/* Bouton Principal de Génération Terracotta (Conforme Capture 4) */}
              {!aiGeneratedText ? (
                <button
                  onClick={() => handleStartAiGeneration(selectedLead)}
                  disabled={isGeneratingAi}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#D9534F] hover:bg-[#c94541] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60 hover:scale-[1.01]"
                >
                  <Wand2 className={`w-4 h-4 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingAi ? 'Génération en cours...' : 'Générer mon message'}</span>
                </button>
              ) : (
                /* Boutons d'actions une fois le message généré */
                <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                  <button
                    onClick={() => handleCopy(aiGeneratedText, selectedLead.id)}
                    className="w-full sm:w-auto flex-1 py-3 px-4 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {copiedId === selectedLead.id ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copier le texte</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleStartAiGeneration(selectedLead)}
                    disabled={isGeneratingAi}
                    className="w-full sm:w-auto py-3 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Générer avec un angle différent"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                    <span>Régénérer</span>
                  </button>

                  {selectedLead.phone_e164 && (
                    <a
                      href={whatsappUrl(selectedLead.phone_e164, aiGeneratedText)}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full sm:w-auto flex-1 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Envoyer sur WhatsApp direct</span>
                    </a>
                  )}
                </div>
              )}

            </div>

          </div>
        </div>
      )}
    </>
  );
}
