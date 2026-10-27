import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  LogOut,
  MapPin,
  Bell,
  Sparkles,
  ArrowLeft,
  Trash2,
  Download,
  LayoutGrid,
  Search,
  Users,
  BarChart3,
  CheckCircle2,
  Clock,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  FileSpreadsheet,
  Settings,
  Check
} from 'lucide-react';
import { AFRICAN_COUNTRIES_LIST, getCountryConfig } from '@/lib/geo';

export default function DashboardView({
  currentUser,
  userCredits = 0,
  searchesList = [],
  onOpenNewSearch,
  onBuyCredits,
  onSignOut,
  onBackToLanding,
  onViewLeads,
  onExportCsv,
  onDeleteSearch,
  isCreator = false,
  onToggleCreatorMode
}) {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'stats'
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'completed' | 'pending'
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Préférences utilisateur (Paramètres)
  const [prefAutoWhatsapp, setPrefAutoWhatsapp] = useState(true);
  const [prefCountryDefault, setPrefCountryDefault] = useState('Sénégal');
  const [prefResultsLimit, setPrefResultsLimit] = useState('30');
  const [prefNotificationSound, setPrefNotificationSound] = useState(true);

  // Fermeture directe et immédiate des paramètres et du menu
  const closeAllModalsAndDrawers = () => {
    setIsSettingsOpen(false);
    setIsMobileSidebarOpen(false);
    setIsNotificationsOpen(false);
  };

  // Fermeture via touche Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeAllModalsAndDrawers();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Données de notifications en direct
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'Extraction terminée',
      desc: '30 leads pour "dentiste" à Dakar, Sénégal sont prêts.',
      time: 'Il y a 5 min',
      unread: true
    },
    {
      id: 'notif-2',
      title: 'Validation WhatsApp réussie',
      desc: '28 numéros mobiles validés avec lien wa.me direct.',
      time: 'Il y a 1 heure',
      unread: true
    },
    {
      id: 'notif-3',
      title: 'Crédits GesLead activés',
      desc: 'Chaque génération de leads consomme 3 crédits. Rechargez à tout moment par Mobile Money ou carte, via Maketou.',
      time: 'Aujourd’hui',
      unread: false
    }
  ]);

  const unreadNotifsCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  // Filtrage des campagnes
  const filteredSearches = useMemo(() => {
    return searchesList.filter((search) => {
      const matchQuery =
        !searchFilter ||
        search.sector?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        search.city?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        search.country?.toLowerCase().includes(searchFilter.toLowerCase());

      const isTerminated = search.leadsCount > 0;
      if (statusFilter === 'completed') return matchQuery && isTerminated;
      if (statusFilter === 'pending') return matchQuery && !isTerminated;
      return matchQuery;
    });
  }, [searchesList, searchFilter, statusFilter]);

  // Statistiques globales calculées en direct
  const stats = useMemo(() => {
    const totalCampaigns = searchesList.length;
    const completedCampaigns = searchesList.filter((s) => s.leadsCount > 0).length;
    const totalLeads = searchesList.reduce((acc, s) => acc + (s.leadsCount || 0), 0);
    const allLeadsFlat = searchesList.flatMap((s) => s.leads || []);
    const mobileReadyCount = allLeadsFlat.filter((l) => l.is_mobile || l.whatsapp_ready).length;
    const mobileRatio = totalLeads > 0 ? Math.round((mobileReadyCount / totalLeads) * 100) : 95;

    return {
      totalCampaigns,
      completedCampaigns,
      totalLeads,
      mobileRatio,
      userCredits
    };
  }, [searchesList, userCredits]);

  // Initiales & Nom de l'utilisateur pour le profil
  const userDisplayName = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Mamadou O.';
  const userInitials = useMemo(() => {
    if (currentUser?.user_metadata?.full_name) {
      const parts = currentUser.user_metadata.full_name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    return 'MO'; // Initiale par défaut
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-charbon font-sans flex flex-col selection:bg-[#CC5833] selection:text-white overflow-x-hidden">
      
      {/* ========================================================================= */}
      {/* 1. SIDEBAR GAUCHE (Desktop fixe / Mobile tiroir avec fermeture directe)   */}
      {/* ========================================================================= */}
      
      {/* Overlay sombre pour mobile */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-50 lg:hidden backdrop-blur-xs transition-opacity duration-200"
        />
      )}

      {/* Barre latérale gauche */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 max-w-[85vw] bg-[#142319] text-white z-50 flex flex-col justify-between border-r border-[#1e3427] transition-transform duration-300 ease-out select-none shadow-2xl lg:shadow-none ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Partie Haute : Brand Logo GesLead & Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          
          {/* Logo Brand "GesLead." avec icône G terracotta */}
          <div className="p-5 sm:p-6 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#CC5833] flex items-center justify-center shadow-xs flex-shrink-0">
                <span className="text-white font-black text-base select-none">G</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-xl font-bold tracking-tight text-white font-sans">
                  GesLead
                </span>
                <span className="text-[#CC5833] text-2xl font-black leading-none ml-0.5">.</span>
              </div>
            </div>

            {/* Bouton de fermeture mobile */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Liens de Navigation */}
          <nav className="p-3 sm:p-4 space-y-1.5 flex-1 font-sans">
            
            {/* Item 1 : Dashboard */}
            <button
              onClick={() => {
                setActiveTab('dashboard');
                closeAllModalsAndDrawers();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-white/10 text-white shadow-xs border border-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutGrid className="w-4 h-4 text-emerald-400 stroke-[2.2]" />
              <span>Dashboard</span>
            </button>

            {/* Item 2 : Nouvelle recherche */}
            <button
              onClick={() => {
                closeAllModalsAndDrawers();
                onOpenNewSearch();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 transition-all cursor-pointer group"
            >
              <Search className="w-4 h-4 text-[#E8634A] group-hover:scale-110 transition-transform stroke-[2.2]" />
              <span>Nouvelle recherche</span>
            </button>

            {/* Item 3 : Fichiers extraits */}
            <button
              onClick={() => {
                closeAllModalsAndDrawers();
                if (searchesList.length > 0 && searchesList[0].leads?.length > 0) {
                  onViewLeads(searchesList[0].leads, searchesList[0]);
                } else {
                  setActiveTab('dashboard');
                }
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400/80 stroke-[1.8]" />
              <span>Fichiers de prospects</span>
            </button>

            {/* Item 4 : Statistiques & Métriques */}
            <button
              onClick={() => {
                setActiveTab('stats');
                closeAllModalsAndDrawers();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-white/10 text-white font-semibold shadow-xs'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-400/80 stroke-[1.8]" />
              <span>Statistiques & ROI</span>
            </button>

            {/* Item 5 : Paramètres (Ouvre la modale de configuration) */}
            <button
              onClick={() => {
                setIsMobileSidebarOpen(false);
                setIsNotificationsOpen(false);
                setIsSettingsOpen(true);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                isSettingsOpen
                  ? 'bg-white/10 text-white font-semibold shadow-xs'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings className="w-4 h-4 text-emerald-400/80 stroke-[1.8]" />
              <span>Paramètres</span>
            </button>

            {/* Item 6 : Site vitrine */}
            <div className="pt-3 mt-3 border-t border-white/5 space-y-1">
              <button
                onClick={() => {
                  closeAllModalsAndDrawers();
                  onBackToLanding();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Site vitrine</span>
              </button>

              {/* Item 7 : Se déconnecter directement depuis la sidebar */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  closeAllModalsAndDrawers();
                  onSignOut();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all cursor-pointer group"
                title="Se déconnecter de votre compte"
              >
                <LogOut className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform stroke-[2]" />
                <span>Se déconnecter</span>
              </button>
            </div>

          </nav>
        </div>

        {/* Partie Basse : Mon Espace / Pro Plan */}
        <div className="p-3 sm:p-4 border-t border-white/5">
          <div
            onClick={() => {
              setIsMobileSidebarOpen(false);
              setIsNotificationsOpen(false);
              setIsSettingsOpen(true);
            }}
            className="rounded-2xl bg-[#1b2d23] hover:bg-[#20362b] border border-white/5 p-3 flex items-center justify-between transition-colors cursor-pointer group"
            title="Ouvrir les paramètres du compte"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#208358] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-inner">
                {userInitials}
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs font-bold text-white tracking-tight truncate">
                  {currentUser ? userDisplayName : 'Mode Démo'}
                </p>
                <p className="text-[11px] text-white/60 font-mono truncate">
                  {currentUser ? 'Pro Plan' : 'Non connecté'}
                </p>
              </div>
            </div>

            <div className="w-5 h-5 rounded-full bg-[#CC5833] text-white text-[10px] font-bold flex items-center justify-center font-mono flex-shrink-0">
              N
            </div>
          </div>
        </div>

      </aside>

      {/* ========================================================================= */}
      {/* 2. ZONE PRINCIPALE (HEADER HAUT + CONTENU VUE D'ENSEMBLE)                  */}
      {/* ========================================================================= */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        
        {/* En-tête Supérieur Sticky & Ultra-Responsive */}
        <header className="w-full bg-white border-b border-gray-100/90 sticky top-0 z-40 h-14 sm:h-16 flex items-center justify-between px-3 sm:px-8 shadow-xs">
          
          {/* Titre Dashboard + Bouton Menu Mobile */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer flex-shrink-0"
              title="Ouvrir le menu"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5 stroke-[2.2]" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-base sm:text-xl text-gray-900 tracking-tight font-sans truncate">
                Dashboard
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[10px] font-mono font-semibold">
                GesLead
              </span>
            </div>
          </div>

          {/* Droite : Crédits, Notifications, Paramètres, Séparateur & Déconnexion */}
          <div className="flex items-center gap-1.5 sm:gap-3.5 flex-shrink-0">
            
            {/* Badge de crédits (ouvre l'achat de crédits) */}
            <button
              onClick={onBuyCredits}
              title={isCreator ? 'Accès Créateur Illimité' : 'Acheter des crédits'}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full border text-[11px] sm:text-xs font-mono font-medium cursor-pointer transition-colors ${
                isCreator
                  ? 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-950 font-bold shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
              }`}
            >
              {isCreator ? (
                <>
                  <span className="text-xs">👑</span>
                  <span>Créateur : <strong className="text-amber-900">Illimité</strong></span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>{userCredits} <span className="hidden sm:inline">crédits</span><span className="sm:hidden">cr.</span></span>
                  <Plus className="w-3 h-3 flex-shrink-0" />
                </>
              )}
            </button>

            {/* Bouton Notifications avec Popover */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsNotificationsOpen((prev) => !prev);
                }}
                className="p-1.5 sm:p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer relative"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 stroke-[1.8]" />
                {unreadNotifsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#D9534F] absolute top-1 sm:top-1.5 right-1 sm:right-1.5 ring-2 ring-white" />
                )}
              </button>

              {/* Menu déroulant des notifications */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-76 sm:w-88 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 text-left font-sans">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <span className="font-bold text-sm text-gray-900">Notifications</span>
                    {unreadNotifsCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-emerald-600 hover:text-emerald-800 font-medium cursor-pointer"
                      >
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>
                  <div className="mt-2 space-y-2.5 max-h-72 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-2.5 rounded-xl text-xs transition-colors ${
                          notif.unread ? 'bg-emerald-50/60 border border-emerald-100' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900">{notif.title}</p>
                          <span className="text-[10px] text-gray-400 font-mono">{notif.time}</span>
                        </div>
                        <p className="text-gray-600 mt-1">{notif.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bouton Paramètres direct dans le Header */}
            <button
              onClick={() => {
                setIsNotificationsOpen(false);
                setIsSettingsOpen(true);
              }}
              className="p-1.5 sm:p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              title="Paramètres de l'application"
              aria-label="Paramètres"
            >
              <Settings className="w-4 h-4 stroke-[1.8]" />
            </button>

            <span className="text-gray-200 hidden sm:inline">|</span>

            {/* Bouton Se déconnecter (Visible et stylisé en rouge sur tous les écrans) */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeAllModalsAndDrawers();
                onSignOut();
              }}
              className="text-xs sm:text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-1.5 cursor-pointer py-1.5 px-2.5 sm:px-3 rounded-xl border border-red-200/80 bg-red-50/50 transition-colors shadow-2xs"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4 stroke-[2]" />
              <span>Déconnexion</span>
            </button>

          </div>
        </header>

        {/* ===================================================================== */}
        {/* 3. CONTENU PRINCIPAL : VUE D'ENSEMBLE                                 */}
        {/* ===================================================================== */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-8 py-5 sm:py-8">
          
          {/* Header Vue d'ensemble + Bouton "+ Nouvelle campagne" */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight font-sans">
                Vue d'ensemble
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 font-sans">
                Retrouvez toutes vos campagnes d'extraction.
              </p>
            </div>

            <div>
              <button
                onClick={() => {
                  closeAllModalsAndDrawers();
                  onOpenNewSearch();
                }}
                className="w-full sm:w-auto px-5 py-2.5 sm:py-2.5 rounded-2xl bg-[#D9534F] hover:bg-[#c94541] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Nouvelle campagne</span>
              </button>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* VUE STATISTIQUES (Si l'onglet Stats est actif)                        */}
          {/* ===================================================================== */}
          {activeTab === 'stats' && (
            <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-gray-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider font-mono">Leads Extraits</span>
                    <Users className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-extrabold text-gray-900">{stats.totalLeads}</div>
                  <p className="text-[11px] sm:text-xs text-gray-500 mt-1">Prospects B2B identifiés</p>
                </div>

                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-gray-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider font-mono">Campagnes</span>
                    <LayoutGrid className="w-4 h-4 text-[#CC5833]" />
                  </div>
                  <div className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-extrabold text-gray-900">{stats.totalCampaigns}</div>
                  <p className="text-[11px] sm:text-xs text-gray-500 mt-1">{stats.completedCampaigns} terminées</p>
                </div>

                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-gray-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider font-mono">Taux WhatsApp</span>
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-extrabold text-emerald-600">{stats.mobileRatio}%</div>
                  <p className="text-[11px] sm:text-xs text-gray-500 mt-1">Mobiles vérifiés</p>
                </div>

                <div className={`rounded-2xl sm:rounded-3xl p-4 sm:p-5 border shadow-xs ${
                  isCreator ? 'bg-amber-50/70 border-amber-300' : 'bg-white border-gray-200/80'
                }`}>
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider font-mono">
                      {isCreator ? '👑 Accès Créateur' : 'Crédits'}
                    </span>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-extrabold text-gray-900">
                    {isCreator ? 'Illimité ∞' : userCredits}
                  </div>
                  {isCreator ? (
                    <span className="text-[11px] sm:text-xs text-amber-800 font-semibold mt-1 inline-block">
                      Toutes extractions 100% gratuites
                    </span>
                  ) : (
                    <button
                      onClick={onBuyCredits}
                      className="text-[11px] sm:text-xs text-argile hover:underline font-semibold mt-1 cursor-pointer"
                    >
                      Acheter des crédits →
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200/80 shadow-xs">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1.5">Moteur de Prospection GesLead</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
                  Chaque campagne extrait les établissements locaux depuis Google Maps, filtre les numéros cellulaires WhatsApp et génère des approches commerciales ultra-ciblées.
                </p>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Revenir aux campagnes
                </button>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* VUE CAMPAGNES (TABLEAU DE BORD PRINCIPAL)                              */}
          {/* ===================================================================== */}
          {activeTab === 'dashboard' && (
            <>
              {/* Barre de Filtre & Recherche rapide (100% Mobile Responsive) */}
              <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
                
                {/* Champ de recherche */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filtrer par secteur ou ville (ex: dentiste, Dakar)..."
                    className="w-full pl-9 pr-7 py-2 bg-white rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-600 transition-colors shadow-2xs"
                  />
                  {searchFilter && (
                    <button
                      onClick={() => setSearchFilter('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold p-1"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Filtres de statut horizontaux */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      statusFilter === 'all'
                        ? 'bg-white text-gray-900 shadow-2xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Toutes ({searchesList.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('completed')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      statusFilter === 'completed'
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Terminées ({searchesList.filter((s) => s.leadsCount > 0).length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('pending')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      statusFilter === 'pending'
                        ? 'bg-white text-gray-900 shadow-2xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    En attente ({searchesList.filter((s) => s.leadsCount === 0).length})
                  </button>
                </div>

              </div>

              {/* Grille des Cartes de Campagnes */}
              {filteredSearches.length === 0 ? (
                <div className="mt-6 sm:mt-8 border-2 border-dashed border-gray-200 rounded-3xl p-6 sm:p-16 text-center bg-white flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3 sm:mb-4">
                    <Plus className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg text-gray-900">
                    Aucune campagne correspondante
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 max-w-sm mt-1 sm:mt-1.5">
                    {searchFilter
                      ? 'Aucune extraction ne correspond à votre filtre. Réessayez avec un autre terme.'
                      : 'Lancez votre première recherche pour extraire des prospects qualifiés depuis Google Maps.'}
                  </p>
                  <button
                    onClick={() => {
                      closeAllModalsAndDrawers();
                      onOpenNewSearch();
                    }}
                    className="mt-4 sm:mt-5 px-5 py-2.5 rounded-xl bg-[#D9534F] hover:bg-[#c94541] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer"
                  >
                    Démarrer une extraction
                  </button>
                </div>
              ) : (
                <div className="mt-5 sm:mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredSearches.map((search) => {
                    const isTerminated = search.leadsCount > 0;
                    return (
                      <div
                        key={search.id}
                        className="bg-white rounded-3xl border border-gray-200/90 p-4 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative group hover:border-gray-300"
                      >
                        <div>
                          {/* Ligne 1 : Nom du secteur + Badge de statut */}
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-base sm:text-lg text-gray-900 lowercase leading-snug">
                              {search.sector}
                            </h3>

                            <span
                              className={`px-3 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap ${
                                isTerminated
                                  ? 'bg-[#EAF7EE] text-[#1D8348] border border-[#C5E8D0]'
                                  : 'bg-gray-100 text-gray-500 border border-gray-200'
                              }`}
                            >
                              {isTerminated ? 'Extraction terminée' : 'En attente'}
                            </span>
                          </div>

                          {/* Ligne 2 : Badge de localisation géographique */}
                          <div className="mt-2 sm:mt-2.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-50/80 text-emerald-900 text-[11px] sm:text-xs font-medium border border-emerald-100/80">
                              <MapPin className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                              <span>{search.city}, {search.country}</span>
                            </span>
                          </div>

                          {/* Ligne 3 : Compteur de leads en grand chiffre rouge */}
                          <div className="mt-4 sm:mt-5 flex items-baseline">
                            <span className="text-3xl sm:text-4xl font-extrabold text-[#D9534F] tracking-tight font-sans">
                              {search.leadsCount}
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-wider ml-2 font-mono">
                              LEADS
                            </span>
                          </div>

                          {/* Ligne 4 : Date & heure d'extraction */}
                          <div className="mt-2.5 sm:mt-3 text-[10px] sm:text-[11px] font-mono text-gray-400 uppercase tracking-wide">
                            {search.date} {search.time ? `- ${search.time}` : ''}
                          </div>
                        </div>

                        {/* Ligne 5 : Bouton d'action inférieur "Accéder au fichier" */}
                        <div className="mt-4 sm:mt-5 pt-3 border-t border-gray-100 flex items-center gap-2">
                          {isTerminated ? (
                            <button
                              onClick={() => {
                                closeAllModalsAndDrawers();
                                onViewLeads(search.leads, search);
                              }}
                              className="flex-1 py-2.5 rounded-full border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-800 text-xs sm:text-sm font-semibold transition-all cursor-pointer text-center block shadow-2xs hover:shadow-xs"
                            >
                              Accéder au fichier
                            </button>
                          ) : (
                            <button
                              disabled
                              className="flex-1 py-2.5 rounded-full bg-gray-100 text-gray-400 text-xs sm:text-sm font-medium text-center block cursor-not-allowed"
                            >
                              En cours...
                            </button>
                          )}

                          {/* Action rapide d'export CSV */}
                          {isTerminated && onExportCsv && search.leads?.length > 0 && (
                            <button
                              onClick={() => onExportCsv(search.leads)}
                              className="p-2 sm:p-2.5 rounded-full hover:bg-emerald-50 text-gray-400 hover:text-emerald-700 transition-colors cursor-pointer border border-transparent hover:border-emerald-200"
                              title="Télécharger l'export CSV"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}

                          {/* Action de suppression */}
                          {onDeleteSearch && (
                            <button
                              onClick={() => onDeleteSearch(search.id)}
                              className="p-2 sm:p-2.5 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                              title="Supprimer cette campagne"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODALE DES PARAMÈTRES (Se ferme DIRECTEMENT et IMMÉDIATEMENT au clic) */}
      {/* ========================================================================= */}
      {isSettingsOpen && (
        <div 
          onClick={closeAllModalsAndDrawers}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs font-sans animate-in fade-in duration-150"
        >
          {/* Conteneur de la modale (stop propagation pour éviter le clic backdrop accidentel sur les inputs) */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto"
          >
            {/* En-tête des Paramètres avec bouton fermeture directe */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#CC5833]/10 text-[#CC5833] flex items-center justify-center font-bold">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base sm:text-lg">Paramètres GesLead</h3>
                  <p className="text-xs text-gray-500 font-mono">Préférences de prospection & Compte</p>
                </div>
              </div>
              
              {/* Bouton fermeture instantanée */}
              <button
                onClick={closeAllModalsAndDrawers}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Fermer les paramètres"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corps des Paramètres */}
            <div className="mt-4 space-y-4 text-xs sm:text-sm">
              
              {/* 1. Profil & Plan */}
              <div className="p-3.5 rounded-2xl bg-[#142319] text-white flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#208358] text-white font-bold text-xs flex items-center justify-center shadow-inner">
                    {userInitials}
                  </div>
                  <div>
                    <p className="font-bold text-xs sm:text-sm text-white">
                      {currentUser ? userDisplayName : 'Mode Démo (Invité)'}
                    </p>
                    <p className="text-[11px] text-white/60 font-mono">
                      {currentUser?.email || 'Non connecté'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-semibold border border-emerald-500/30">
                    {currentUser ? 'Pro Plan Actif' : 'Session Démo'}
                  </span>
                  <p className="text-[10px] text-white/50 mt-1 font-mono">{userCredits} crédits dispo</p>
                </div>
              </div>

              {/* 2. Préférences de Scraping & Filtres */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 font-mono">
                  Automatisation & Scraping
                </h4>

                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="font-semibold text-gray-800">Filtre mobile WhatsApp strict</p>
                    <p className="text-[11px] text-gray-500">Isole uniquement les numéros mobiles vérifiés</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefAutoWhatsapp}
                    onChange={(e) => setPrefAutoWhatsapp(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="font-semibold text-gray-800">Pays par défaut</p>
                    <p className="text-[11px] text-gray-500">Zone prioritaire des scans Google Maps</p>
                  </div>
                  <select
                    value={prefCountryDefault}
                    onChange={(e) => setPrefCountryDefault(e.target.value)}
                    className="bg-white border border-gray-200 text-xs rounded-lg px-2 py-1 font-medium focus:outline-none"
                  >
                    {AFRICAN_COUNTRIES_LIST.map((c) => {
                      const cfg = getCountryConfig(c);
                      return (
                        <option key={c} value={c}>
                          {c} ({cfg.phonePrefix})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="font-semibold text-gray-800">Quota par extraction</p>
                    <p className="text-[11px] text-gray-500">Nombre de résultats scrapés par défaut</p>
                  </div>
                  <select
                    value={prefResultsLimit}
                    onChange={(e) => setPrefResultsLimit(e.target.value)}
                    className="bg-white border border-gray-200 text-xs rounded-lg px-2 py-1 font-mono font-medium focus:outline-none"
                  >
                    <option value="15">15 leads</option>
                    <option value="30">30 leads (recommandé)</option>
                    <option value="60">60 leads</option>
                  </select>
                </div>

                {/* Accès Créateur de l'App (Utilisation Gratuite & Illimitée) */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                    <div className="pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">👑</span>
                        <p className="font-bold text-xs text-amber-950">Accès Créateur de l'App</p>
                      </div>
                      <p className="text-[11px] text-amber-900/80 mt-0.5">
                        {isCreator
                          ? 'Actif : Extractions 100% gratuites et illimitées (0 débit).'
                          : 'Activer le mode créateur pour utiliser l\'app sans restriction de crédits.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleCreatorMode?.(!isCreator)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
                        isCreator
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                          : 'bg-white hover:bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {isCreator ? '✓ Mode Actif' : 'Activer'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Liens d'action directs : FERMENT IMMÉDIATEMENT LA MODALE AU CLIC */}
              <div className="pt-2 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-mono">
                  Navigation rapide
                </p>

                {/* Accéder aux campagnes : ferme directement et affiche le Dashboard */}
                <button
                  onClick={() => {
                    closeAllModalsAndDrawers();
                    setActiveTab('dashboard');
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-800 transition-colors cursor-pointer text-left font-medium"
                >
                  <span className="flex items-center gap-2.5">
                    <LayoutGrid className="w-4 h-4 text-emerald-600" />
                    <span>Retourner aux campagnes d'extraction</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                {/* Lancer une nouvelle recherche : ferme directement et ouvre la modale de recherche */}
                <button
                  onClick={() => {
                    closeAllModalsAndDrawers();
                    onOpenNewSearch();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-800 transition-colors cursor-pointer text-left font-medium"
                >
                  <span className="flex items-center gap-2.5">
                    <Search className="w-4 h-4 text-[#CC5833]" />
                    <span>Lancer une nouvelle recherche</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                {/* Voir le site vitrine : ferme directement et renvoie vers la landing page */}
                <button
                  onClick={() => {
                    closeAllModalsAndDrawers();
                    onBackToLanding();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-800 transition-colors cursor-pointer text-left font-medium"
                >
                  <span className="flex items-center gap-2.5">
                    <ArrowLeft className="w-4 h-4 text-gray-600" />
                    <span>Aller sur le site vitrine GesLead</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* 4. Boutons d'action inférieurs : Se déconnecter / Enregistrer & Fermer */}
              <div className="pt-3 border-t border-gray-100 flex items-center gap-2.5">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeAllModalsAndDrawers();
                    onSignOut();
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors cursor-pointer text-center"
                >
                  Se déconnecter
                </button>

                <button
                  onClick={closeAllModalsAndDrawers}
                  className="flex-1 py-2.5 rounded-xl bg-[#142319] hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer text-center shadow-xs"
                >
                  Fermer directement
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
