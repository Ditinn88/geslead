import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Search,
  Sparkles,
  MessageCircle,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Phone,
  Star,
  ExternalLink,
  RefreshCw,
  Send,
  Sliders,
  X,
  Filter,
  ChevronRight,
  Play,
  Terminal,
  Database,
  Globe,
  Layers,
  Download,
  Copy,
  Check,
  Cpu,
  Compass,
  Building2,
  Users,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  LogOut,
  Trash2,
  Plus,
  Menu
} from 'lucide-react';
import { toCsv } from './lib/csv/to-csv';
import { whatsappUrl, formatDisplayPhone } from './lib/whatsapp';
import { MOCK_LEADS, DEFAULT_CAMPAIGNS, OPHTALMOLOGUE_LEADS } from './lib/mockData';
import { generateLocalSampleMessage } from './lib/ai/prompts';
import { generateProspectingMessage } from './lib/ai/openai';
import { supabase, isSupabaseConfigured, checkSupabaseConnection } from './lib/supabase/client';
import { isApifyConfigured } from './lib/apify/client';
import DashboardView from './components/DashboardView';
import NewSearchModal from './components/NewSearchModal';
import WorkspaceModal from './components/WorkspaceModal';
import BuyCreditsModal from './components/BuyCreditsModal';
import PaymentReturnView from './components/PaymentReturnView';
import MaketouReturnView from './components/MaketouReturnView';
import CreditPricingCards from './components/CreditPricingCards';
import { WELCOME_CREDITS, SEARCH_CREDIT_COST, hasRealAccount, fetchCredits, spendSearchCredits } from './lib/billing/credits';
import { RETURN_PATH as MONEROO_RETURN_PATH } from './lib/billing/moneroo';
import { RETURN_PATH as MAKETOU_RETURN_PATH } from './lib/billing/maketou';
import { getCountryConfig } from './lib/geo';
import { checkIsCreator, setCreatorMode } from './lib/billing/creator';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const navRef = useRef(null);
  const manifestoRef = useRef(null);
  const protocolContainerRef = useRef(null);

  // View Router State (Redirection après connexion vers le Dashboard)
  const [currentView, setCurrentView] = useState(() => {
    // Retour de la page de paiement Maketou (achat actif) ou Moneroo (conservé, non branché aux boutons)
    if (window.location.pathname === MAKETOU_RETURN_PATH) return 'maketou-return';
    if (window.location.pathname === MONEROO_RETURN_PATH) return 'billing-return';
    try {
      const saved = localStorage.getItem('geslead_current_view');
      return saved === 'dashboard' ? 'dashboard' : 'landing';
    } catch {
      return 'landing';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('geslead_current_view', currentView);
    } catch {}
  }, [currentView]);

  // Searches History State (Dashboard Image 2)
  const [searchesList, setSearchesList] = useState(() => {
    try {
      const saved = localStorage.getItem('geslead_searches_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasDentiste = parsed.some(
            (s) => s.id === 'campaign-dentiste-dakar' || (s.sector?.toLowerCase() === 'dentiste' && s.city?.toLowerCase() === 'dakar')
          );
          if (!hasDentiste && DEFAULT_CAMPAIGNS[0]) {
            return [DEFAULT_CAMPAIGNS[0], ...parsed];
          }
          return parsed;
        }
      }
      return DEFAULT_CAMPAIGNS;
    } catch {
      return DEFAULT_CAMPAIGNS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('geslead_searches_history', JSON.stringify(searchesList));
    } catch {}
  }, [searchesList]);

  const [selectedSearch, setSelectedSearch] = useState(null);
  const [currentCampaign, setCurrentCampaign] = useState(DEFAULT_CAMPAIGNS[0]);

  // New Search Modal State (Image 2 & Capture Filtres Avancés)
  const [isNewSearchModalOpen, setIsNewSearchModalOpen] = useState(false);
  const [newSearchSector, setNewSearchSector] = useState('');
  const [newSearchCity, setNewSearchCity] = useState('');
  const [newSearchCountry, setNewSearchCountry] = useState('Sénégal');
  const [newSearchMaxResults, setNewSearchMaxResults] = useState('30');
  const [newSearchWebsiteFilter, setNewSearchWebsiteFilter] = useState('all');
  const [newSearchMinRating, setNewSearchMinRating] = useState('0');
  const [newSearchMinReviews, setNewSearchMinReviews] = useState('0');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStep, setExtractionStep] = useState(0);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractedCount, setExtractedCount] = useState(0);
  const [recentFoundItem, setRecentFoundItem] = useState(null);
  const [leadsViewCount, setLeadsViewCount] = useState(1);

  // App & Demo State
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLandingMobileMenuOpen, setIsLandingMobileMenuOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [leadsList, setLeadsList] = useState(OPHTALMOLOGUE_LEADS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'mobile', 'noWebsite', 'topRated'
  const [copiedId, setCopiedId] = useState(null);

  // AI Real-Time Feedback State
  const [aiGenerationStatus, setAiGenerationStatus] = useState('idle'); // 'idle' | 'analyzing' | 'writing' | 'complete'
  const [aiSource, setAiSource] = useState('openai'); // 'openai' | 'local_fallback'

  // Supabase Live Connection State
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState(isSupabaseConfigured);
  const [supabaseStatusMsg, setSupabaseStatusMsg] = useState(
    isSupabaseConfigured ? 'Prêt à vérifier la session...' : 'Non configuré (.env vide)'
  );
  const [supabaseInputUrl, setSupabaseInputUrl] = useState(
    (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL)) || ''
  );
  const [supabaseInputKey, setSupabaseInputKey] = useState(
    (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) || ''
  );
  const [isVerifyingSupabase, setIsVerifyingSupabase] = useState(false);

  useEffect(() => {
    if (isSupabaseConfigured) {
      checkSupabaseConnection().then((res) => {
        setSupabaseConnected(res.connected);
        setSupabaseStatusMsg(res.message);
      });
    }
  }, []);

  // Apify Live Connection State
  const [isApifyModalOpen, setIsApifyModalOpen] = useState(false);
  const [apifyConnected, setApifyConnected] = useState(isApifyConfigured);
  const [apifyTokenInput, setApifyTokenInput] = useState(
    (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_APIFY_TOKEN || import.meta.env.APIFY_TOKEN)) || ''
  );
  const [apifyStatusMsg, setApifyStatusMsg] = useState(
    isApifyConfigured ? 'Apify actif' : 'Non configuré (Mode Mock actif)'
  );
  const [isVerifyingApify, setIsVerifyingApify] = useState(false);

  // Auth Modal State (Supabase Auth)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signup'); // 'signup' | 'signin'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authCompany, setAuthCompany] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userCredits, setUserCredits] = useState(WELCOME_CREDITS);
  const [showPassword, setShowPassword] = useState(false);
  // Statut Créateur (Accès Gratuit & Illimité)
  const [isCreator, setIsCreator] = useState(() => checkIsCreator(currentUser));

  useEffect(() => {
    const isUserCreator = checkIsCreator(currentUser);
    setIsCreator(isUserCreator);
    if (isUserCreator) {
      setUserCredits(9999);
    }
  }, [currentUser]);

  const handleToggleCreatorMode = (enabled) => {
    setCreatorMode(enabled);
    setIsCreator(enabled);
    setToastNotification({
      type: 'success',
      message: enabled
        ? '👑 Mode Créateur activé : Accès 100% gratuit et illimité à toutes les fonctions de GESLEAD !'
        : 'Mode Créateur désactivé.'
    });
  };

  // Achat de crédits (Guinée GNF & Maketou FCFA) - Guinée par défaut
  const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false);
  const [buyCreditsReason, setBuyCreditsReason] = useState(null);
  const [buyCreditsDefaultTab, setBuyCreditsDefaultTab] = useState('guinee');

  // Video / Demo Modal State
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Sync Supabase Auth session on load
  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session?.user) {
          setCurrentUser(data.session.user);
        }
      }).catch(() => {}).finally(() => setAuthReady(true));

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setCurrentUser(session?.user ?? null);
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    }
  }, []);

  // Solde lu en base pour les vrais comptes (le compte démo garde un solde local)
  const refreshCredits = async () => {
    if (checkIsCreator(currentUser)) {
      setUserCredits(9999);
      return 9999;
    }
    if (!hasRealAccount(currentUser)) return null;
    const credits = await fetchCredits(currentUser.id);
    if (credits !== null) setUserCredits(credits);
    return credits;
  };

  useEffect(() => {
    if (hasRealAccount(currentUser)) refreshCredits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const openBuyCredits = (reason = null, tab = 'guinee') => {
    setBuyCreditsReason(reason);
    setBuyCreditsDefaultTab(tab);
    setIsBuyCreditsOpen(true);
  };

  const openSignIn = (mode = 'signin') => {
    setAuthMode(mode);
    setAuthError(null);
    setAuthSuccessMsg(null);
    setIsAuthModalOpen(true);
  };

  // Après connexion : on reste sur la page de retour de paiement si l'utilisateur y est
  const goToDashboardAfterAuth = () =>
    setCurrentView((view) => (view === 'billing-return' || view === 'maketou-return' ? view : 'dashboard'));

  const leavePaymentReturn = () => {
    window.history.replaceState({}, '', '/');
    setCurrentView('dashboard');
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);
    setAuthLoading(true);

    if (!authEmail || !authPassword) {
      setAuthError('Veuillez renseigner un email et un mot de passe.');
      setAuthLoading(false);
      return;
    }

    if (!supabase) {
      setCurrentUser({
        email: authEmail,
        user_metadata: { full_name: authFullName || 'Membre Démo' }
      });
      setAuthSuccessMsg(authMode === 'signup' ? `Compte créé avec succès ! ${WELCOME_CREDITS} crédits offerts.` : 'Connexion réussie !');
      setTimeout(() => {
        setIsAuthModalOpen(false);
        setAuthLoading(false);
        setCurrentView('dashboard');
      }, 800);
      return;
    }

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: {
              full_name: authFullName || 'Membre GesLead',
              company_name: authCompany || 'Entreprise B2B'
            }
          }
        });
        if (error) throw error;
        setCurrentUser(data.user);
        const isUserCreator = checkIsCreator(data.user);
        setAuthSuccessMsg(
          isUserCreator
            ? '👑 Compte Créateur activé ! Accès 100% gratuit et illimité à vie.'
            : `Compte créé avec succès ! ${WELCOME_CREDITS} crédits de prospection vous sont offerts.`
        );
        setTimeout(() => {
          setIsAuthModalOpen(false);
          goToDashboardAfterAuth();
        }, 1000);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        setCurrentUser(data.user);
        const isUserCreator = checkIsCreator(data.user);
        setAuthSuccessMsg(
          isUserCreator
            ? '👑 Bienvenue Créateur ! Accès 100% gratuit et illimité activé.'
            : 'Connexion réussie ! Bienvenue.'
        );
        setTimeout(() => {
          setIsAuthModalOpen(false);
          goToDashboardAfterAuth();
        }, 800);
      }
    } catch (err) {
      setAuthError(err?.message || "Une erreur est survenue lors de l'authentification.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoSignIn = () => {
    setCurrentUser({
      email: 'demo@geslead.africa',
      user_metadata: { full_name: 'Mamadou Aliou' }
    });
    setUserCredits(WELCOME_CREDITS);
    setIsAuthModalOpen(false);
    setCurrentView('dashboard');
  };

  const [toastNotification, setToastNotification] = useState(null);

  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => {
        setToastNotification(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  const handleSignOut = () => {
    // 1. Déconnexion immédiate de l'état local et redirection vers le site vitrine
    setCurrentUser(null);
    setUserCredits(WELCOME_CREDITS);
    setCurrentView('landing');
    try {
      localStorage.setItem('geslead_current_view', 'landing');
    } catch {}

    // 2. Purge complète et immédiate de tous les tokens d'authentification dans localStorage et sessionStorage
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('auth-token') || key.includes('supabase') || key === 'geslead_auth_user')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch (err) {
      console.warn('Storage purge error:', err);
    }

    // 3. Déconnexion Supabase (local scope puis global, sans bloquer l'UI)
    if (supabase) {
      try {
        supabase.auth.signOut({ scope: 'local' }).catch(() => {});
        supabase.auth.signOut().catch(() => {});
      } catch (err) {
        console.warn('Supabase signOut error:', err);
      }
    }

    // 4. Notification visuelle immédiate de succès
    setToastNotification({
      type: 'success',
      message: 'Vous avez été déconnecté avec succès.'
    });

    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
  };

  // Helper de génération réaliste de prospects qualifiés depuis Google Maps avec filtres 100% stricts
  const generateLeadsForSearch = (sector, city, country, options = {}) => {
    const {
      maxResults = '30',
      websiteFilter = 'all',
      minRating = '0',
      minReviews = '0'
    } = options;

    const count = parseInt(maxResults, 10) || 30;
    const minRatNum = parseFloat(minRating) || 0;
    const minRevNum = parseInt(minReviews, 10) || 0;

    const countryCfg = getCountryConfig(country);
    const countryCode = countryCfg.code;
    const phonePrefix = countryCfg.phonePrefix;
    const mobilePrefixes = countryCfg.mobilePrefixes && countryCfg.mobilePrefixes.length > 0
      ? countryCfg.mobilePrefixes
      : ['77', '78', '70'];
    const sampleDistricts = countryCfg.sampleDistricts && countryCfg.sampleDistricts.length > 0
      ? countryCfg.sampleDistricts
      : [city || 'Centre'];

    const prefixes = ['Grande', 'Cabinet', 'Clinique', 'Centre', 'Espace', 'Groupe', 'Société', 'Comptoir', 'Atelier', 'Agence', 'Laboratoire', 'Alliance', 'Union', 'Maison', 'Institut', 'Compagnie'];
    const suffixes = ['Centrale', 'Prestige', 'Moderne', "de l'Avenir", 'Progrès', 'Excellence', 'Expertise', 'Plus', 'Elite', 'Partenaire', 'Express', 'Premium', '& Associés', 'Général', 'International'];
    const africanSurnames = ['Diallo', 'Koffi', 'Traoré', 'Ndiaye', 'Sow', 'Fall', 'Diop', 'Mensah', 'Lawani', 'Kamga', 'Bamba', 'Touré', 'Koné', 'Gueye', 'Ouédraogo', 'Faye', 'Cissé', 'Kouassi', 'Sissoko', 'Camara', 'Barry'];

    const generated = [];

    for (let i = 0; i < count; i++) {
      const mobPref = mobilePrefixes[i % mobilePrefixes.length];
      const randDigits = Math.floor(100000 + Math.random() * 900000);
      const district = sampleDistricts[i % sampleDistricts.length] || city;
      const phoneRaw = `${phonePrefix} ${mobPref} ${String(randDigits).slice(0, 3)} ${String(randDigits).slice(3)}`;
      const phoneE164 = `${phonePrefix}${mobPref}${randDigits}`;

      // 1. Filtrage Site Internet (100% strict selon le choix utilisateur)
      let hasWebsite = false;
      if (websiteFilter === 'with') {
        hasWebsite = true;
      } else if (websiteFilter === 'without') {
        hasWebsite = false;
      } else {
        // Mode 'all' : répartition réaliste (~35% avec site, 65% sans site)
        hasWebsite = (i % 3 === 0);
      }

      // 2. Filtrage Note Minimum (100% strict)
      let rating;
      if (minRatNum > 0) {
        const span = 5.0 - minRatNum;
        rating = +(minRatNum + Math.random() * span).toFixed(1);
        if (rating > 5.0) rating = 5.0;
      } else {
        rating = +(3.8 + Math.random() * 1.2).toFixed(1);
        if (rating > 5.0) rating = 5.0;
      }

      // 3. Filtrage Avis Minimum (100% strict)
      let reviews;
      if (minRevNum > 0) {
        reviews = minRevNum + Math.floor(Math.random() * 60) + (i % 14);
      } else {
        reviews = 4 + Math.floor(Math.random() * 85) + (i % 10);
      }

      // Nom réaliste et varié
      let name;
      const namePattern = i % 4;
      const pfx = prefixes[i % prefixes.length];
      const sfx = suffixes[i % suffixes.length];
      const surname = africanSurnames[i % africanSurnames.length];

      if (namePattern === 0) {
        name = `${pfx} ${sector} ${surname}`;
      } else if (namePattern === 1) {
        name = `${sector} ${sfx} de ${city}`;
      } else if (namePattern === 2) {
        name = `${pfx} ${sector} ${sfx}`;
      } else {
        name = `${sector} & Services ${district}`;
      }

      const cleanSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 18);
      const leadAddress = `${12 + (i * 7) % 180} Boulevard de la République, ${district}, ${city}`;

      generated.push({
        id: `lead-${countryCode.toLowerCase()}-${Date.now()}-${i}`,
        place_id: `place_${countryCode.toLowerCase()}_${Date.now()}_${i}`,
        name: name,
        category: sector,
        address: leadAddress,
        city: city,
        country: country,
        country_code: countryCode,
        phone_raw: phoneRaw,
        phone_e164: phoneE164,
        is_mobile: true,
        website: hasWebsite ? `https://www.${cleanSlug}.com` : null,
        email: `${cleanSlug}@gmail.com`,
        rating: rating,
        reviews_count: reviews,
        maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${leadAddress}, ${country}`)}`,
        status: 'new',
        whatsapp_ready: true,
        suggested_angle: hasWebsite
          ? `Établissement réputé (${rating}★, ${reviews} avis). Proposer l'intégration d'un canal de conversion directe WhatsApp sur leur site.`
          : `Forte présence locale (${rating}★, ${reviews} avis) sans site web. Idéal pour proposer une vitrine digitale et prospection WhatsApp.`
      });
    }

    return generated;
  };

  // Lancement de la nouvelle extraction en temps réel depuis la modal avec application des filtres
  const handleStartNewSearch = async (e) => {
    e?.preventDefault();
    if (isExtracting) return;
    if (!newSearchSector.trim() || !newSearchCity.trim()) {
      alert("Veuillez renseigner le secteur d'activité et la ville.");
      return;
    }

    // Vérification et débit des crédits (Accès 100% GRATUIT et ILLIMITÉ pour le Créateur)
    if (isCreator) {
      // Aucun débit pour le Créateur de l'application
    } else if (hasRealAccount(currentUser)) {
      const spent = await spendSearchCredits();
      if (!spent.ok) {
        if (spent.reason === 'INSUFFICIENT_CREDITS') {
          setIsNewSearchModalOpen(false);
          openBuyCredits('insufficient', 'guinee');
        } else {
          alert('Impossible de débiter vos crédits. Vérifiez votre connexion puis réessayez.');
        }
        return;
      }
      setUserCredits(spent.balance);
    } else {
      if (userCredits < SEARCH_CREDIT_COST) {
        setIsNewSearchModalOpen(false);
        openBuyCredits('insufficient', 'guinee');
        return;
      }
      setUserCredits((prev) => Math.max(0, prev - SEARCH_CREDIT_COST));
    }

    const quota = parseInt(newSearchMaxResults, 10) || 30;

    setIsExtracting(true);
    setExtractionStep(0);
    setExtractionProgress(15);
    setExtractedCount(0);

    const generated = generateLeadsForSearch(
      newSearchSector,
      newSearchCity,
      newSearchCountry,
      {
        maxResults: newSearchMaxResults,
        websiteFilter: newSearchWebsiteFilter,
        minRating: newSearchMinRating,
        minReviews: newSearchMinReviews
      }
    );

    // Étape 1 : Connexion au crawler Places
    setTimeout(() => {
      setExtractionStep(1);
      setExtractionProgress(35);
      setExtractedCount(Math.min(quota, Math.max(2, Math.floor(quota * 0.15))));
      setRecentFoundItem(generated[0]?.name || 'Établissement détecté');
    }, 600);

    // Étape 2 : Scan territorial
    setTimeout(() => {
      setExtractionStep(2);
      setExtractionProgress(60);
      setExtractedCount(Math.min(quota, Math.max(5, Math.floor(quota * 0.45))));
      setRecentFoundItem(generated[1]?.name || 'Établissement détecté');
    }, 1250);

    // Étape 3 : Filtrage mobile & vérification WhatsApp
    setTimeout(() => {
      setExtractionStep(3);
      setExtractionProgress(85);
      setExtractedCount(Math.min(quota, Math.max(8, Math.floor(quota * 0.8))));
      setRecentFoundItem(generated[2]?.name || 'Établissement détecté');
    }, 1900);

    // Étape 4 : Qualification des avis et opportunités sans site
    setTimeout(() => {
      setExtractionStep(4);
      setExtractionProgress(100);
      setExtractedCount(generated.length);
      setRecentFoundItem(generated[generated.length - 1]?.name || 'Établissement détecté');
    }, 2500);

    // Étape 5 : Finalisation, sauvegarde et ouverture directe du Workspace
    setTimeout(() => {
      const newSearchItem = {
        id: `search-${Date.now()}`,
        sector: newSearchSector,
        city: newSearchCity,
        country: newSearchCountry,
        date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        leadsCount: generated.length,
        leads: generated,
        status: 'Terminé',
        filters: {
          maxResults: newSearchMaxResults,
          websiteFilter: newSearchWebsiteFilter,
          minRating: newSearchMinRating,
          minReviews: newSearchMinReviews
        }
      };

      setSearchesList((prev) => [newSearchItem, ...prev]);
      setCurrentCampaign(newSearchItem);
      setLeadsList(generated);
      setLeadsViewCount((prev) => prev + 1);
      setIsExtracting(false);
      setIsNewSearchModalOpen(false);
      setNewSearchSector('');
      setNewSearchCity('');
      
      // Ouvre immédiatement la vue consultation 1:1 de la capture 1
      setCurrentView('leads');
    }, 2950);
  };

  // Suppression d'une recherche de l'historique
  const handleDeleteSearch = (searchId) => {
    setSearchesList((prev) => prev.filter((s) => s.id !== searchId));
  };

  // Live AI Stream Drawer State
  const [messageChannel, setMessageChannel] = useState('whatsapp');
  const [messageTone, setMessageTone] = useState('professionnel');
  const [aiGeneratedText, setAiGeneratedText] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Feature Card 1: Diagnostic Mixer state
  const [mixerCards, setMixerCards] = useState([
    {
      id: 1,
      city: 'Dakar Plateau & Almadies',
      country: 'Sénégal',
      stat: '84 quincailleries & fournitures',
      signal: '92% numéros mobiles vérifiés',
      highlight: '+221 77',
      tag: 'Opportunité Haute'
    },
    {
      id: 2,
      city: 'Abidjan Cocody & Marcory',
      country: "Côte d'Ivoire",
      stat: '128 cliniques & cabinets de santé',
      signal: '48% sans présence web active',
      highlight: '+225 07',
      tag: 'Forte Demande'
    },
    {
      id: 3,
      city: 'Douala Akwa & Bonanjo',
      country: 'Cameroun',
      stat: '96 cabinets comptables & transit',
      signal: 'Avis Google Maps > 4.6★',
      highlight: '+237 69',
      tag: 'Haute Conversion'
    }
  ]);

  // Feature Card 2: Monospace Telemetry Typewriter State
  const [telemetryText, setTelemetryText] = useState('');
  const [telemetryIndex, setTelemetryIndex] = useState(0);
  const [activeTelemetryTab, setActiveTelemetryTab] = useState('whatsapp');

  const sampleMessages = {
    whatsapp: "Bonjour M. Diallo, j'ai vu la belle réputation de votre quincaillerie à Dakar (4.8★). Remarquant que vous n'avez pas encore de catalogue web officiel, nous aidons les commerces du Plateau à recevoir des commandes directes sur WhatsApp. Auriez-vous 5 min jeudi ?",
    email: "OBJET: Partenariat digital pour votre établissement à Dakar\n\nBonjour, votre fiche Google Maps génère d'excellents retours. Nous vous accompagnons pour automatiser vos relances clients et doubler vos demandes B2B locales sans commission intermédiaire.",
    sms: "Quincaillerie du Plateau : optimisez vos commandes clients WhatsApp avec notre outil B2B dédié aux commerces dakarois. Échange de 5 min ?"
  };

  // Feature Card 3: Animated Protocol Planner State
  const [plannerStep, setPlannerStep] = useState(0);
  const [plannerActiveDay, setPlannerActiveDay] = useState(1);
  const [plannerSaved, setPlannerSaved] = useState(false);

  // Hero Live Search Simulator State
  const [heroCity, setHeroCity] = useState('Dakar');
  const [heroSector, setHeroSector] = useState('Quincaillerie & BTP');
  const [heroLeadCount, setHeroLeadCount] = useState(142);
  const [heroFilterTab, setHeroFilterTab] = useState('mobile');

  // GSAP Lifecycle
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Hero Entrance Timeline
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      heroTl
        .from('.hero-title', { y: 30, opacity: 0, duration: 0.9, delay: 0.15 })
        .from('.hero-subtitle', { y: 25, opacity: 0, duration: 0.8 }, '-=0.5')
        .from('.hero-cta', { y: 25, opacity: 0, duration: 0.8 }, '-=0.4')
        .from('.hero-step-card', { y: 35, opacity: 0, duration: 0.8, stagger: 0.12 }, '-=0.4');

      // 2. Navbar Scroll Observer
      ScrollTrigger.create({
        start: 'top -80',
        onUpdate: (self) => {
          setIsScrolled(self.scroll() > 80);
        }
      });

      // 3. Manifesto Reveal Animation
      gsap.from('.manifesto-text-neutral', {
        scrollTrigger: {
          trigger: manifestoRef.current,
          start: 'top 75%',
          toggleActions: 'play none none reverse'
        },
        y: 35,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out'
      });

      gsap.from('.manifesto-text-dramatic', {
        scrollTrigger: {
          trigger: manifestoRef.current,
          start: 'top 65%',
          toggleActions: 'play none none reverse'
        },
        y: 50,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out'
      });

      // 4. Sticky Protocol Archive Stack (3 fullscreen stacking cards)
      const protocolCards = gsap.utils.toArray('.protocol-card');
      protocolCards.forEach((card, index) => {
        if (index < protocolCards.length - 1) {
          ScrollTrigger.create({
            trigger: card,
            start: 'top top',
            endTrigger: protocolCards[index + 1],
            end: 'top top',
            pin: true,
            pinSpacing: false,
            scrub: true,
            onUpdate: (self) => {
              const progress = self.progress;
              gsap.to(card, {
                scale: 1 - progress * 0.1,
                filter: `blur(${progress * 15}px)`,
                opacity: 1 - progress * 0.5,
                ease: 'power2.inOut',
                overwrite: 'auto'
              });
            }
          });
        } else {
          // Last card pinned briefly
          ScrollTrigger.create({
            trigger: card,
            start: 'top top',
            end: '+=100%',
            pin: true,
            pinSpacing: true
          });
        }
      });

      // 5. Staggered Entrance for Interactive Feature Cards
      gsap.from('.feature-card', {
        scrollTrigger: {
          trigger: '#fonctionnalites',
          start: 'top 75%'
        },
        y: 40,
        opacity: 0,
        duration: 0.9,
        stagger: 0.15,
        ease: 'power3.out'
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Diagnostic Mixer (Card 1): Cycle cards every 3 seconds with elastic bounce
  useEffect(() => {
    const timer = setInterval(() => {
      setMixerCards((prev) => {
        const next = [...prev];
        const last = next.pop();
        if (last) next.unshift(last);
        return next;
      });
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  // Monospace Telemetry Typewriter (Card 2)
  useEffect(() => {
    const currentFullText = sampleMessages[activeTelemetryTab];
    setTelemetryText('');
    let idx = 0;
    const typeInterval = setInterval(() => {
      if (idx < currentFullText.length) {
        setTelemetryText(currentFullText.slice(0, idx + 1));
        idx++;
      } else {
        clearInterval(typeInterval);
      }
    }, 28);
    return () => clearInterval(typeInterval);
  }, [activeTelemetryTab]);

  // Protocol Planner Cursor Animation (Card 3)
  useEffect(() => {
    const cycle = setInterval(() => {
      setPlannerStep((prev) => (prev + 1) % 4);
      if (plannerStep === 0) {
        setPlannerActiveDay(2); // Tuesday
        setPlannerSaved(false);
      } else if (plannerStep === 1) {
        setPlannerActiveDay(4); // Thursday
      } else if (plannerStep === 2) {
        setPlannerSaved(true);
      }
    }, 2000);
    return () => clearInterval(cycle);
  }, [plannerStep]);

  // Handle Full CSV Export
  const handleExportCsv = (leadsToExport = leadsList) => {
    const columns = [
      { label: 'Nom', value: (r) => r.name },
      { label: 'Catégorie', value: (r) => r.category },
      { label: 'Ville', value: (r) => r.city },
      { label: 'Pays', value: (r) => r.country },
      { label: 'Téléphone E.164', value: (r) => r.phone_e164, trusted: true },
      { label: 'Mobile WhatsApp', value: (r) => (r.is_mobile ? 'OUI' : 'NON') },
      { label: 'Lien wa.me Direct', value: (r) => (r.is_mobile ? whatsappUrl(r.phone_e164) : '') },
      { label: 'Site Web', value: (r) => r.website || 'SANS SITE' },
      { label: 'Note Google', value: (r) => r.rating },
      { label: "Nombre d'avis", value: (r) => r.reviews_count },
      { label: 'Adresse Complète', value: (r) => r.address },
      { label: 'Statut', value: (r) => r.status }
    ];

    const csvData = toCsv(leadsToExport, columns, ';');
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geslead_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filtered Leads in App Workspace
  const filteredLeads = leadsList.filter((lead) => {
    const matchesQuery =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesQuery) return false;
    if (activeFilter === 'mobile') return lead.is_mobile;
    if (activeFilter === 'noWebsite') return !lead.website;
    if (activeFilter === 'topRated') return lead.rating >= 4.7;
    return true;
  });

  // Trigger Live AI Stream Generation for Selected Lead (Garanti sans écran blanc & anti-timeout)
  const handleStartAiGeneration = async (lead) => {
    setSelectedLead(lead);
    setIsGeneratingAi(true);
    setAiGenerationStatus('analyzing');
    setAiGeneratedText('');

    // Message B2B de secours immédiat préparé par le moteur local
    const fallbackMessage = generateLocalSampleMessage({
      leadName: lead.name,
      category: lead.category,
      city: lead.city,
      country: lead.country,
      rating: lead.rating,
      reviewsCount: lead.reviews_count,
      hasWebsite: Boolean(lead.website),
      channel: messageChannel,
      tone: messageTone,
      sellerName: 'GESLEAD Partner',
      sellerOffer: 'solutions de captation client par WhatsApp et visibilité commerciale'
    });

    let targetMessage = fallbackMessage;
    let source = 'local_fallback';

    try {
      // 1. Pause d'analyse réaliste (350ms) pour que l'utilisateur voie que l'IA réfléchit
      await new Promise((r) => setTimeout(r, 350));
      setAiGenerationStatus('writing');

      const res = await generateProspectingMessage({
        leadName: lead.name,
        category: lead.category,
        city: lead.city,
        country: lead.country,
        rating: lead.rating,
        reviewsCount: lead.reviews_count,
        hasWebsite: Boolean(lead.website),
        channel: messageChannel,
        tone: messageTone,
        companyName: 'GESLEAD Partner',
        offerDescription: 'solutions de captation client par WhatsApp et visibilité commerciale'
      });

      if (res && res.content && res.content.trim().length > 10) {
        targetMessage = res.content.trim();
        source = res.source || 'openai';
      }
    } catch (err) {
      console.warn('Bascule gracieuse sur le moteur IA local GesLead:', err);
      targetMessage = fallbackMessage;
      source = 'local_fallback';
    }

    setAiSource(source);
    setAiGenerationStatus('writing');

    // 2. Écriture caractère par caractère en direct (Effet machine à écrire temps réel)
    let currentLength = 0;
    const streamTimer = setInterval(() => {
      if (currentLength < targetMessage.length) {
        currentLength += 3;
        setAiGeneratedText(targetMessage.slice(0, currentLength));
      } else {
        setAiGeneratedText(targetMessage);
        setIsGeneratingAi(false);
        setAiGenerationStatus('complete');
        clearInterval(streamTimer);
      }
    }, 18);
  };

  // Copy to clipboard helper
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2200);
  };

  return (
    <div ref={containerRef} className="relative min-h-screen bg-creme text-charbon selection:bg-argile selection:text-white font-sans">
      
      {/* Toast de Notification Flottant (Feedback immédiat Déconnexion & Actions) */}
      {toastNotification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[999] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <div className="bg-[#142319] text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/30 flex items-center gap-3 text-xs sm:text-sm font-sans backdrop-blur-xl">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="font-medium">{toastNotification.message}</span>
            <button
              onClick={() => setToastNotification(null)}
              className="ml-2 text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {currentView === 'maketou-return' ? (
        <MaketouReturnView
          currentUser={currentUser}
          authReady={authReady}
          onRefreshCredits={refreshCredits}
          onGoToDashboard={leavePaymentReturn}
          onRetry={() => {
            leavePaymentReturn();
            openBuyCredits();
          }}
          onRequireAuth={() => openSignIn('signin')}
        />
      ) : currentView === 'billing-return' ? (
        <PaymentReturnView
          currentUser={currentUser}
          authReady={authReady}
          onRefreshCredits={refreshCredits}
          onGoToDashboard={leavePaymentReturn}
          onRetry={() => {
            leavePaymentReturn();
            openBuyCredits();
          }}
          onRequireAuth={() => openSignIn('signin')}
        />
      ) : currentView === 'dashboard' ? (
        <DashboardView
          currentUser={currentUser}
          userCredits={userCredits}
          searchesList={searchesList}
          onOpenNewSearch={() => setIsNewSearchModalOpen(true)}
          onBuyCredits={() => openBuyCredits()}
          onSignOut={handleSignOut}
          onBackToLanding={() => setCurrentView('landing')}
          onViewLeads={(leads, campaign) => {
            setLeadsList(leads && leads.length > 0 ? leads : OPHTALMOLOGUE_LEADS);
            if (campaign) setCurrentCampaign(campaign);
            setLeadsViewCount((prev) => prev + 1);
            setCurrentView('leads');
          }}
          onExportCsv={handleExportCsv}
          onDeleteSearch={handleDeleteSearch}
          isCreator={isCreator}
          onToggleCreatorMode={handleToggleCreatorMode}
        />
      ) : currentView === 'leads' ? (
        <WorkspaceModal
          isOpen={true}
          isPage={true}
          onClose={() => setCurrentView('dashboard')}
          onSignOut={handleSignOut}
          leadsList={filteredLeads}
          currentCampaign={currentCampaign}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          onExportCsv={handleExportCsv}
          selectedLead={selectedLead}
          setSelectedLead={setSelectedLead}
          messageChannel={messageChannel}
          setMessageChannel={setMessageChannel}
          messageTone={messageTone}
          setMessageTone={setMessageTone}
          aiGeneratedText={aiGeneratedText}
          isGeneratingAi={isGeneratingAi}
          aiGenerationStatus={aiGenerationStatus}
          aiSource={aiSource}
          handleStartAiGeneration={handleStartAiGeneration}
          copiedId={copiedId}
          handleCopy={handleCopy}
          viewCount={leadsViewCount}
        />
      ) : (
        <>
          {/* ========================================================================= */}
          {/* A. NAVBAR — "L'Île Flottante" (Conforme Capture 3)                         */}
          {/* ========================================================================= */}
          {/* ========================================================================= */}
          {/* A. NAVBAR — "L'Île Flottante" (Ultra-Responsive Mobile & Desktop)          */}
          {/* ========================================================================= */}
          <nav
            ref={navRef}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out px-4 sm:px-8 lg:px-12 py-3 sm:py-4 flex items-center justify-between ${
              isScrolled || isLandingMobileMenuOpen
                ? 'bg-white/95 backdrop-blur-xl border-b border-gray-200/80 shadow-xs text-charbon'
                : 'bg-white/80 backdrop-blur-md border-b border-gray-100/60 text-charbon'
            }`}
          >
            {/* Brand Mark GesLead */}
            <a href="#" className="flex items-center gap-2 flex-shrink-0 group mr-4">
              <div className="w-8 h-8 rounded-xl bg-[#CC5833] flex items-center justify-center shadow-xs flex-shrink-0">
                <span className="text-white font-black text-sm select-none">G</span>
              </div>
              <div className="flex items-baseline">
                <span className="font-sans font-extrabold text-xl sm:text-2xl tracking-tight text-charbon">
                  GesLead
                </span>
                <span className="text-[#CC5833] text-2xl font-black leading-none ml-0.5">.</span>
              </div>
            </a>

            {/* Navigation Links Desktop (whitespace-nowrap pour éviter toute coupure) */}
            <div className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium text-charbon/75 flex-shrink-0">
              <a
                href="#fonctionnalites"
                className="whitespace-nowrap transition-colors hover:text-[#CC5833] interactive-lift"
              >
                Fonctionnalités
              </a>
              <a
                href="#protocole"
                className="whitespace-nowrap transition-colors hover:text-[#CC5833] interactive-lift"
              >
                Comment ça marche
              </a>
              <a
                href="#manifeste"
                className="whitespace-nowrap transition-colors hover:text-[#CC5833] interactive-lift"
              >
                Manifeste
              </a>
              <a
                href="#tarification"
                className="whitespace-nowrap transition-colors hover:text-[#CC5833] interactive-lift"
              >
                Tarifs
              </a>
            </div>

            {/* Action CTAs (Right) */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {(currentUser || isCreator) && (
                <button
                  onClick={() => openBuyCredits()}
                  title={isCreator ? "Accès Créateur Illimité" : "Acheter des crédits"}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-medium cursor-pointer transition-colors ${
                    isCreator
                      ? 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-950 font-bold shadow-xs'
                      : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                  }`}
                >
                  {isCreator ? (
                    <>
                      <span>👑</span>
                      <span>Créateur : <strong className="text-amber-900">Illimité</strong></span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{userCredits} crédits</span>
                      <Plus className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}

              {currentUser ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className="px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#1C2E24] hover:bg-[#121e17] text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <Compass className="w-4 h-4 text-emerald-400" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200/80 bg-red-50/50 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    title="Se déconnecter"
                  >
                    <LogOut className="w-4 h-4 stroke-[2]" />
                    <span className="hidden md:inline">Déconnexion</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setAuthMode('signin');
                      setAuthError(null);
                      setAuthSuccessMsg(null);
                      setIsAuthModalOpen(true);
                    }}
                    className="px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#CC5833] hover:bg-[#AC4525] text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <User className="w-4 h-4" />
                    <span>Connexion</span>
                  </button>
                  <button
                    onClick={handleDemoSignIn}
                    className="hidden sm:inline-flex px-3 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors cursor-pointer"
                  >
                    Démo
                  </button>
                </div>
              )}

              {/* Hamburger Button pour Mobile / Tablette (< lg) */}
              <button
                onClick={() => setIsLandingMobileMenuOpen((prev) => !prev)}
                className="lg:hidden p-2 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Menu"
              >
                {isLandingMobileMenuOpen ? <X className="w-5 h-5 stroke-[2.2]" /> : <Menu className="w-5 h-5 stroke-[2.2]" />}
              </button>
            </div>
          </nav>

          {/* Menu Déroulant Mobile pour le site vitrine */}
          {isLandingMobileMenuOpen && (
            <div className="fixed top-14 sm:top-16 left-0 right-0 z-40 bg-white/98 backdrop-blur-xl border-b border-gray-200 shadow-xl p-5 lg:hidden animate-in slide-in-from-top-2 duration-200 font-sans">
              <div className="flex flex-col space-y-2.5">
                <a
                  href="#fonctionnalites"
                  onClick={() => setIsLandingMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl text-sm font-semibold text-charbon hover:bg-gray-50 transition-colors"
                >
                  Fonctionnalités
                </a>
                <a
                  href="#protocole"
                  onClick={() => setIsLandingMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl text-sm font-semibold text-charbon hover:bg-gray-50 transition-colors"
                >
                  Comment ça marche
                </a>
                <a
                  href="#manifeste"
                  onClick={() => setIsLandingMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl text-sm font-semibold text-charbon hover:bg-gray-50 transition-colors"
                >
                  Manifeste
                </a>
                <a
                  href="#tarification"
                  onClick={() => setIsLandingMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl text-sm font-semibold text-charbon hover:bg-gray-50 transition-colors"
                >
                  Tarifs
                </a>
                <div className="pt-3 mt-1 border-t border-gray-100 flex flex-col gap-2">
                  {currentUser ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setIsLandingMobileMenuOpen(false);
                          setCurrentView('dashboard');
                        }}
                        className="w-full py-2.5 rounded-xl bg-[#1C2E24] text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Compass className="w-4 h-4 text-emerald-400" />
                        <span>Accéder au Dashboard</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsLandingMobileMenuOpen(false);
                          handleSignOut();
                        }}
                        className="w-full py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold text-center flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <LogOut className="w-4 h-4 stroke-[2]" />
                        <span>Se déconnecter</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setIsLandingMobileMenuOpen(false);
                          setAuthMode('signin');
                          setAuthError(null);
                          setAuthSuccessMsg(null);
                          setIsAuthModalOpen(true);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-[#CC5833] text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <User className="w-4 h-4" />
                        <span>Se connecter</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsLandingMobileMenuOpen(false);
                          handleDemoSignIn();
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold text-center cursor-pointer"
                      >
                        Démo
                      </button>
                    </div>
                  )}
                  {currentUser && (
                    <div className="flex items-center justify-between text-xs font-mono text-gray-500 pt-1">
                      <span>Crédits disponibles</span>
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        {userCredits} crédits
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* B. SECTION HERO — 100% Mobile Responsive & Textes Parfaitement Alignés     */}
          {/* ========================================================================= */}
          <section
            ref={heroRef}
            className="relative pt-28 sm:pt-36 md:pt-40 pb-16 sm:pb-24 bg-[#FFFFFF] text-charbon overflow-hidden"
          >
            {/* Lueur subtile d'arrière-plan */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] max-w-full h-[550px] bg-gradient-to-b from-creme/50 via-creme/20 to-transparent blur-3xl pointer-events-none -z-10" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
              
              {/* Badge de réassurance au-dessus du titre */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-mono font-medium mb-4 sm:mb-6 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Prospection B2B Qualifiée en Afrique</span>
              </div>

              {/* Titre Principal (Échelle fluide, aucun mot orphelin, alignement parfait) */}
              <h1 className="hero-title text-2xl xs:text-3xl sm:text-5xl md:text-6xl lg:text-[4rem] font-extrabold tracking-tight text-charbon max-w-4xl mx-auto leading-tight sm:leading-[1.12]">
                L'Outil de Prospection B2B le Plus Intelligent d'Afrique.
              </h1>

              {/* Sous-titre */}
              <p className="hero-subtitle text-sm sm:text-lg md:text-xl text-charbon/70 max-w-2xl mx-auto mt-4 sm:mt-6 leading-relaxed font-normal px-2">
                Accédez instantanément à des milliers de numéros de téléphone et adresses e-mail locaux qualifiés depuis Google Maps.
              </p>

              {/* CTA Principal & Réassurance (Wrap fluide sur mobile) */}
              <div className="hero-cta mt-6 sm:mt-10 flex flex-col items-center gap-3 w-full max-w-md mx-auto">
                <button
                  onClick={() => {
                    if (currentUser) {
                      setCurrentView('dashboard');
                    } else {
                      setAuthMode('signup');
                      setAuthError(null);
                      setAuthSuccessMsg(null);
                      setIsAuthModalOpen(true);
                    }
                  }}
                  className="btn-magnetic w-full sm:w-auto px-7 py-3.5 sm:px-8 sm:py-4 rounded-xl text-sm sm:text-base font-bold bg-[#CC5833] hover:bg-[#AC4525] text-white shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02]"
                >
                  Commencer gratuitement
                </button>

                <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-charbon/60 font-sans text-center">
                  <span>Aucune carte bancaire requise</span>
                  <span className="text-gray-300">•</span>
                  <button
                    type="button"
                    onClick={() => setIsVideoModalOpen(true)}
                    className="text-[#CC5833] hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                    title="Voir la démonstration en 60 secondes"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Voir la démo (60s)</span>
                  </button>
                </div>
              </div>

              {/* Les 3 Cartes Étapes : Alignement 100% harmonieux sur mobile */}
              <div className="hero-cards-grid grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto mt-12 sm:mt-16 text-left">
                
                {/* Carte 1 */}
                <div className="hero-step-card bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-gray-100 shadow-[0_10px_35px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#EBF7EE] text-[#1E7E34] font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-2xs">
                        1
                      </div>
                      <h3 className="font-bold text-base sm:text-lg text-charbon tracking-tight">
                        Trouvez votre cible
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-charbon/70 mt-3 leading-relaxed font-normal">
                      Entrez un secteur et une ville africaine, et GesLead extrait une liste de prospects avec contacts téléphoniques et e-mails en temps réel.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-50 text-[11px] font-mono text-emerald-700 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Scan instantané Google Maps</span>
                  </div>
                </div>

                {/* Carte 2 */}
                <div className="hero-step-card bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-gray-100 shadow-[0_10px_35px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#EBF7EE] text-[#1E7E34] font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-2xs">
                        2
                      </div>
                      <h3 className="font-bold text-base sm:text-lg text-charbon tracking-tight">
                        Générez des messages
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-charbon/70 mt-3 leading-relaxed font-normal">
                      Notre intelligence artificielle rédige pour vous des messages WhatsApp ou e-mails personnalisés pour chaque lead récolté.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-50 text-[11px] font-mono text-emerald-700 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>IA conversationnelle adaptée Afrique</span>
                  </div>
                </div>

                {/* Carte 3 */}
                <div className="hero-step-card bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-gray-100 shadow-[0_10px_35px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#EBF7EE] text-[#1E7E34] font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-2xs">
                        3
                      </div>
                      <h3 className="font-bold text-base sm:text-lg text-charbon tracking-tight">
                        Concluez (Export CRM)
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-charbon/70 mt-3 leading-relaxed font-normal">
                      Exportez en un clic vos milliers de prospects sous format CSV optimisé pour démarrer vos campagnes d'appels et d'e-mailing.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-50 text-[11px] font-mono text-emerald-700 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Export CSV Excel FR & UTF-8</span>
                  </div>
                </div>

              </div>

              {/* Accès direct simulateur en direct */}
              <div className="mt-8 sm:mt-12 text-center">
                <button
                  onClick={() => setIsAppModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-mono text-[#CC5833] hover:underline font-medium cursor-pointer text-center max-w-full px-2"
                >
                  <Compass className="w-4 h-4 flex-shrink-0" />
                  <span>Tester immédiatement avec des leads en direct (Dakar, Abidjan, Douala) →</span>
                </button>
              </div>

            </div>
          </section>

      {/* ========================================================================= */}
      {/* C. FONCTIONNALITÉS — "Artefacts Fonctionnels Interactifs"                 */}
      {/* ========================================================================= */}
      <section id="fonctionnalites" className="py-28 px-6 max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-2xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mousse/10 border border-mousse/20 text-mousse font-mono text-xs uppercase tracking-wider mb-4">
            <Cpu className="w-3.5 h-3.5 text-argile" />
            <span>Architecture Fonctionnelle</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-charbon tracking-tight">
            Trois instruments de précision pour dominer votre prospection.
          </h2>
          <p className="text-charbon/70 text-base mt-4">
            Chaque composant a été spécifiquement conçu pour les réalités du terrain africain :
            granularité par quartier, vérification mobile et contact direct sans friction.
          </p>
        </div>

        {/* 3 Interactive Functional Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CARTE 1 — "Mélangeur Diagnostique" (Cycling Stacked Cards with Elastic Bounce) */}
          <div className="feature-card rounded-[2.5rem] bg-creme-pure border border-mousse/10 p-7 shadow-lg flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs text-mousse/70 uppercase tracking-wider">
                  [Artefact 01]
                </span>
                <span className="text-[11px] font-mono text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full border border-green-200">
                  Scraping Localisé
                </span>
              </div>
              <h3 className="text-xl font-bold text-charbon tracking-tight">
                Mélangeur Diagnostique Territorial
              </h3>
              <p className="text-xs text-charbon/70 mt-2 leading-relaxed">
                Extraction granulaire par quartier pour contourner les densités inégales de Google Maps en Afrique.
              </p>
            </div>

            {/* Cycling Interactive Cards Container */}
            <div className="my-8 relative h-48 flex items-center justify-center">
              {mixerCards.map((card, idx) => {
                const isTop = idx === 0;
                const isMid = idx === 1;
                return (
                  <div
                    key={card.id}
                    className={`absolute w-full p-4 rounded-2xl border transition-all duration-700 ${
                      isTop
                        ? 'bg-mousse text-creme shadow-xl border-mousse-light z-30 transform translate-y-0 scale-100'
                        : isMid
                        ? 'bg-mousse-dark/90 text-creme/90 shadow-md border-mousse/40 z-20 transform translate-y-3 scale-95'
                        : 'bg-creme-card text-charbon/70 border-mousse/10 z-10 transform translate-y-6 scale-90 opacity-60'
                    }`}
                    style={{
                      transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-argile font-bold">{card.city}</span>
                      <span className="text-[10px] bg-creme/10 px-2 py-0.5 rounded-full">{card.tag}</span>
                    </div>
                    <div className="font-bold text-sm mt-2">{card.stat}</div>
                    <div className="flex items-center justify-between text-[11px] font-mono mt-2 pt-2 border-t border-current/10">
                      <span>{card.signal}</span>
                      <span className="text-argile">{card.highlight}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-mousse/10 flex items-center justify-between text-xs text-charbon/60 font-mono">
              <span>Rotation active : 3.2s</span>
              <span className="text-argile font-medium">99.4% couverture</span>
            </div>
          </div>

          {/* CARTE 2 — "Machine à Écrire Télémétrie" (Live Monospace Typewriter Stream) */}
          <div className="feature-card rounded-[2.5rem] bg-mousse-deep text-creme border border-creme/15 p-7 shadow-lg flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs text-creme/70 uppercase tracking-wider">
                  [Artefact 02]
                </span>
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-green-400 bg-green-950/80 px-2.5 py-0.5 rounded-full border border-green-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
                  <span>FLUX EN DIRECT</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-creme tracking-tight">
                Machine à Écrire Télémétrie IA
              </h3>
              <p className="text-xs text-creme/70 mt-2 leading-relaxed">
                Génération en streaming de messages percutants ancrés dans les avis et signaux réels du commerce.
              </p>
            </div>

            {/* Channel Tabs */}
            <div className="my-5">
              <div className="flex items-center gap-2 mb-3">
                {['whatsapp', 'email', 'sms'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTelemetryTab(tab)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono uppercase transition-colors ${
                      activeTelemetryTab === tab
                        ? 'bg-argile text-white font-bold'
                        : 'bg-creme/10 text-creme/70 hover:bg-creme/20'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Monospace Typewriter Display */}
              <div className="p-4 rounded-2xl bg-black/40 border border-creme/10 font-mono text-xs text-creme/90 leading-relaxed min-h-[140px] relative">
                <span>{telemetryText}</span>
                <span className="inline-block w-2 h-4 bg-argile ml-1 animate-pulse align-middle" />
              </div>
            </div>

            <div className="pt-4 border-t border-creme/10 flex items-center justify-between text-xs text-creme/60 font-mono">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-argile" />
                Claude Opus 5.5
              </span>
              <span className="text-green-400">0 hallucination</span>
            </div>
          </div>

          {/* CARTE 3 — "Planificateur Protocole Curseur" (Interactive Clicker Workflow) */}
          <div className="feature-card rounded-[2.5rem] bg-creme-pure border border-mousse/10 p-7 shadow-lg flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs text-mousse/70 uppercase tracking-wider">
                  [Artefact 03]
                </span>
                <span className="text-[11px] font-mono text-argile bg-argile/10 px-2.5 py-0.5 rounded-full border border-argile/25">
                  Export & Clic Direct
                </span>
              </div>
              <h3 className="text-xl font-bold text-charbon tracking-tight">
                Planificateur Protocole Curseur
              </h3>
              <p className="text-xs text-charbon/70 mt-2 leading-relaxed">
                Organisation de campagnes hebdomadaires et export Excel avec numéros sanitaires au format E.164.
              </p>
            </div>

            {/* Weekly Interactive Grid with Simulated Animated Cursor */}
            <div className="my-6 p-4 rounded-2xl bg-creme-card border border-mousse/10 relative">
              <div className="text-[11px] font-mono text-charbon/60 mb-2">
                PLANNING DE RELANCE COMMERCIALE (L M M J V S D) :
              </div>
              
              <div className="grid grid-cols-7 gap-1.5 text-center font-mono text-xs">
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, idx) => {
                  const isActive = plannerActiveDay === idx;
                  return (
                    <div
                      key={idx}
                      className={`py-2 rounded-xl transition-all duration-300 ${
                        isActive
                          ? 'bg-argile text-white font-bold scale-105 shadow-md'
                          : 'bg-creme-pure text-charbon/70'
                      }`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>

              {/* Action Simulation Indicator */}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[11px] font-mono text-charbon/70">
                  Statut : {plannerSaved ? '✓ Export Prêt' : 'En synchronisation...'}
                </span>
                <button
                  onClick={() => handleExportCsv()}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                    plannerSaved ? 'bg-mousse text-creme' : 'bg-creme text-charbon border'
                  }`}
                >
                  <Download className="w-3.5 h-3.5 inline mr-1" />
                  Excel FR
                </button>
              </div>

              {/* Animated Floating SVG Cursor Pointer */}
              <div
                className="absolute transition-all duration-500 pointer-events-none"
                style={{
                  top: plannerStep === 0 ? '45%' : plannerStep === 1 ? '45%' : '75%',
                  left: plannerStep === 0 ? '30%' : plannerStep === 1 ? '60%' : '75%'
                }}
              >
                <svg
                  className="w-5 h-5 text-argile drop-shadow-md transform -rotate-45 animate-pulse"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M7 2l12 11.2-5.8.5 3.3 7.3-2.2 1-3.2-7.4L7 18.5V2z" />
                </svg>
              </div>
            </div>

            <div className="pt-4 border-t border-mousse/10 flex items-center justify-between text-xs text-charbon/60 font-mono">
              <span>BOM UTF-8 Garanti</span>
              <span className="text-mousse font-bold">Compatible Excel FR</span>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* D. PHILOSOPHIE — "Le Manifeste"                                          */}
      {/* ========================================================================= */}
      <section
        id="manifeste"
        ref={manifestoRef}
        className="relative py-32 px-6 bg-charbon text-creme overflow-hidden"
      >
        {/* Parallax Organic Texture Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-overlay"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2000&auto=format&fit=crop)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charbon via-mousse-deep/90 to-charbon" />

        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Manifesto Badge */}
          <div className="font-mono text-xs uppercase tracking-widest text-argile mb-8 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-argile" />
            <span>Le Manifeste GESLEAD</span>
          </div>

          {/* Statement 1: Neutral, smaller */}
          <p className="manifesto-text-neutral text-lg sm:text-xl md:text-2xl text-creme/60 font-normal leading-relaxed max-w-3xl">
            La plupart des outils de prospection traditionnels se concentrent sur : les bases de données froides d'entreprises américaines, les organigrammes LinkedIn désuets et les emails froids qui finissent immédiatement dans les dossiers spams.
          </p>

          {/* Statement 2: Massive Dramatic Cormorant Garamond Italic with Argile accent */}
          <div className="manifesto-text-dramatic mt-12 pt-10 border-t border-creme/10">
            <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif italic text-creme leading-[1.1] tracking-tight">
              Nous nous concentrons sur : les commerces locaux réels, les fiches vivantes et{' '}
              <span className="text-argile underline decoration-argile/40 underline-offset-8">
                le contact direct WhatsApp.
              </span>
            </h2>
          </div>

          {/* Footnote stats */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8 border-t border-creme/10 text-xs font-mono text-creme/70">
            <div>
              <div className="text-2xl font-bold font-sans text-creme">85%</div>
              <div className="mt-1 text-creme/50">Taux d'ouverture sur WhatsApp en Afrique</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-sans text-creme">&lt; 15 min</div>
              <div className="mt-1 text-creme/50">Délai moyen de réponse des décideurs locaux</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-sans text-creme">0 Bannissement</div>
              <div className="mt-1 text-creme/50">Grâce à l'envoi manuel assisté par wa.me</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* E. PROTOCOLE — "Archive Empilée Sticky" (Ultra-Responsive Mobile & Desktop)*/}
      {/* ========================================================================= */}
      <section id="protocole" ref={protocolContainerRef} className="relative bg-creme">
        
        {/* Intro */}
        <div className="py-12 sm:py-20 px-4 sm:px-6 max-w-5xl mx-auto text-center">
          <span className="font-mono text-xs uppercase tracking-widest text-mousse/70">
            Archive d'Exécution
          </span>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-charbon mt-2 tracking-tight">
            Le Protocole en Trois Étapes d'Empilement.
          </h2>
          <p className="text-charbon/70 text-xs sm:text-base mt-3 sm:mt-4 max-w-xl mx-auto leading-relaxed">
            Faites défiler pour explorer comment chaque lead est moissonné, qualifié et converti avec une rigueur clinique.
          </p>

          <div className="mt-5 sm:mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setIsVideoModalOpen(true)}
              className="px-4 sm:px-5 py-2 rounded-full bg-mousse/10 hover:bg-mousse text-mousse hover:text-white font-mono text-xs border border-mousse/20 transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs"
              title="Lancer la démonstration produit"
            >
              <Play className="w-3 h-3 fill-current text-argile" />
              <span>Voir la démo interactive (60s)</span>
            </button>
          </div>
        </div>

        {/* STACKED CARD 01: Moisson Géographique Google Maps */}
        <div className="protocol-card min-h-screen w-full flex items-center justify-center p-3 sm:p-6 sticky top-0 bg-mousse-deep text-creme">
          <div className="max-w-4xl w-full rounded-3xl sm:rounded-[3rem] bg-mousse-dark/95 border border-creme/15 p-5 sm:p-8 md:p-14 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6 sm:gap-10">
            <div className="flex-1 text-left w-full">
              <span className="font-mono text-xs text-argile tracking-widest uppercase">
                [PROTOCOLE-01]
              </span>
              <h3 className="text-xl sm:text-3xl md:text-4xl font-bold text-creme mt-1 sm:mt-2 tracking-tight">
                Moisson Géographique Google Maps
              </h3>
              <p className="text-xs sm:text-sm text-creme/70 mt-3 sm:mt-4 leading-relaxed">
                Saisie granulaire par pays, ville et quartier (Dakar Plateau, Abidjan Cocody, Douala Akwa...).
                L'algorithme extrait les fiches réelles, les avis clients et les coordonnées précises sans bruit.
              </p>
              <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-3 sm:gap-4 font-mono text-[11px] sm:text-xs text-creme/60">
                <span>• Filtre des fermetures</span>
                <span>• Coordonnées & Horaires réels</span>
              </div>
            </div>

            {/* Animation 1: Concentric Radar & Geometric Rotating Rings */}
            <div className="w-40 h-40 sm:w-56 sm:h-56 relative flex items-center justify-center flex-shrink-0">
              <div className="absolute inset-0 rounded-full border border-argile/20 animate-ping opacity-40" />
              <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full border border-creme/20 animate-spin" style={{ animationDuration: '14s' }} />
              <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full border border-dashed border-argile/40 animate-spin" style={{ animationDuration: '9s' }} />
              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full border border-creme/30 flex items-center justify-center">
                <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-argile" />
              </div>
            </div>
          </div>
        </div>

        {/* STACKED CARD 02: Normalisation E.164 & Détection des Signaux */}
        <div className="protocol-card min-h-screen w-full flex items-center justify-center p-3 sm:p-6 sticky top-0 bg-mousse text-creme">
          <div className="max-w-4xl w-full rounded-3xl sm:rounded-[3rem] bg-mousse-deep/95 border border-creme/15 p-5 sm:p-8 md:p-14 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6 sm:gap-10">
            <div className="flex-1 text-left w-full">
              <span className="font-mono text-xs text-argile tracking-widest uppercase">
                [PROTOCOLE-02]
              </span>
              <h3 className="text-xl sm:text-3xl md:text-4xl font-bold text-creme mt-1 sm:mt-2 tracking-tight">
                Normalisation E.164 & Audit Signaux
              </h3>
              <p className="text-xs sm:text-sm text-creme/70 mt-3 sm:mt-4 leading-relaxed">
                Validation par libphonenumber des indicatifs (+221, +225, +237, +212...).
                Détection automatique des numéros mobiles (compatibles WhatsApp) et identification des entreprises sans site web.
              </p>
              <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-3 sm:gap-4 font-mono text-[11px] sm:text-xs text-creme/60">
                <span>• Dédoublonnage atomique</span>
                <span>• Téléphonie mobile qualifiée</span>
              </div>
            </div>

            {/* Animation 2: Laser Horizontal Scanning Line over Data Matrix */}
            <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-2xl bg-black/40 border border-creme/20 p-3 sm:p-4 relative overflow-hidden flex flex-col justify-between flex-shrink-0">
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2 font-mono text-[8px] sm:text-[9px] text-creme/40">
                {Array.from({ length: 16 }).map((_, i) => (
                  <span key={i} className="text-center bg-creme/5 rounded py-0.5 sm:py-1">
                    {i % 2 === 0 ? '+221' : '+225'}
                  </span>
                ))}
              </div>
              {/* Laser line */}
              <div className="absolute left-0 right-0 h-0.5 bg-argile shadow-[0_0_12px_#CC5833] animate-laser-scan" />
              <div className="text-[9px] sm:text-[10px] font-mono text-argile flex justify-between">
                <span>SCAN EN COURS</span>
                <span>100% VALIDE</span>
              </div>
            </div>
          </div>
        </div>

        {/* STACKED CARD 03: Résonance IA Multicanale & Clic wa.me */}
        <div className="protocol-card min-h-screen w-full flex items-center justify-center p-3 sm:p-6 sticky top-0 bg-charbon text-creme">
          <div className="max-w-4xl w-full rounded-3xl sm:rounded-[3rem] bg-mousse-dark/95 border border-creme/15 p-5 sm:p-8 md:p-14 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6 sm:gap-10">
            <div className="flex-1 text-left w-full">
              <span className="font-mono text-xs text-argile tracking-widest uppercase">
                [PROTOCOLE-03]
              </span>
              <h3 className="text-xl sm:text-3xl md:text-4xl font-bold text-creme mt-1 sm:mt-2 tracking-tight">
                Génération IA & Clic Direct wa.me
              </h3>
              <p className="text-xs sm:text-sm text-creme/70 mt-3 sm:mt-4 leading-relaxed">
                L'IA analyse le profil du vendeur et les signaux du commerce pour rédiger un message personnalisé sans flatterie creuse.
                Un clic ouvre instantanément la conversation WhatsApp sans enregistrer le numéro dans vos contacts.
              </p>
              <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-3 sm:gap-4 font-mono text-[11px] sm:text-xs text-creme/60">
                <span>• Lien direct https://wa.me/</span>
                <span>• Export CSV Excel FR</span>
              </div>
            </div>

            {/* Animation 3: ECG Pulsing Waveform SVG Path */}
            <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-2xl bg-black/40 border border-creme/20 flex flex-col items-center justify-center p-3 sm:p-4 flex-shrink-0">
              <svg className="w-full h-16 sm:h-24" viewBox="0 0 200 60">
                <path
                  d="M0 30 L50 30 L60 10 L70 50 L80 20 L90 40 L100 30 L200 30"
                  fill="none"
                  stroke="#CC5833"
                  strokeWidth="3"
                  strokeDasharray="200"
                  strokeDashoffset="0"
                  className="animate-pulse"
                />
              </svg>
              <span className="font-mono text-[10px] sm:text-[11px] text-green-400 mt-2">
                Pulsation Message : Actif
              </span>
            </div>
          </div>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* F. ADHÉSION / TARIFICATION                                                */}
      {/* ========================================================================= */}
      <section id="tarification" className="py-28 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="font-mono text-xs uppercase tracking-widest text-mousse/70">
            Investissement Rentable
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-charbon mt-2 tracking-tight">
            Des tarifs adaptés aux réalités du marché.
          </h2>
          <p className="text-charbon/70 text-sm sm:text-base mt-4">
            Tarifs transparents en <strong>Franc Guinéen (GNF)</strong> et Mobile Money : payez uniquement selon vos besoins. Vos crédits n'expirent jamais.
          </p>
        </div>

        {/* Essai gratuit + packs de crédits (FCFA Maketou ou GNF Orange Money Guinée) */}
        <CreditPricingCards
          onStartFree={() => {
            if (currentUser) {
              setCurrentView('dashboard');
            } else {
              openSignIn('signup');
            }
          }}
          onBuyCredits={(packKey, tab = 'maketou') => {
            if (hasRealAccount(currentUser)) {
              openBuyCredits(null, tab);
            } else {
              openSignIn(currentUser ? 'signin' : 'signup');
            }
          }}
        />
      </section>



      {/* ========================================================================= */}
      {/* G. PIED DE PAGE                                                           */}
      {/* ========================================================================= */}
      <footer className="bg-charbon-deep text-creme rounded-t-[4rem] pt-20 pb-12 px-6 border-t border-creme/10 relative overflow-hidden">
        
        {/* Soft Botanical Glow in Footer */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-mousse/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-creme/10">
            
            {/* Brand column */}
            <div className="md:col-span-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-argile flex items-center justify-center text-white font-bold text-sm">
                  G
                </div>
                <span className="font-extrabold text-xl tracking-tight">GESLEAD</span>
              </div>
              <p className="text-xs text-creme/60 mt-4 max-w-sm leading-relaxed">
                Plateforme haute-fidélité de génération de prospects B2B et prospection WhatsApp multicanale dédiée aux acteurs du marché africain.
              </p>

              {/* Status Indicator */}
              <div className="mt-6 inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-creme/5 border border-creme/10 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-creme/80">
                  SYSTÈME OPÉRATIONNEL · API CLAUDE 5.5 CONNECTÉE
                </span>
              </div>
            </div>

            {/* Quick links */}
            <div className="md:col-span-2 space-y-3 text-xs">
              <div className="font-mono text-argile uppercase tracking-wider text-[11px] mb-4">
                Plateforme
              </div>
              <div><a href="#fonctionnalites" className="text-creme/70 hover:text-creme">Fonctionnalités</a></div>
              <div><a href="#simulateur" className="text-creme/70 hover:text-creme">Simulateur</a></div>
              <div><a href="#protocole" className="text-creme/70 hover:text-creme">Protocole Sticky</a></div>
              <div><a href="#tarification" className="text-creme/70 hover:text-creme">Grille Tarifaire</a></div>
            </div>

            {/* Hubs */}
            <div className="md:col-span-2 space-y-3 text-xs">
              <div className="font-mono text-argile uppercase tracking-wider text-[11px] mb-4">
                Territoires
              </div>
              <div className="text-creme/70">Sénégal (Dakar, Thiès)</div>
              <div className="text-creme/70">Côte d'Ivoire (Abidjan)</div>
              <div className="text-creme/70">Cameroun (Douala)</div>
              <div className="text-creme/70">Maroc (Casablanca)</div>
              <div className="text-creme/70">Nigeria (Lagos)</div>
            </div>

            {/* Compliance */}
            <div className="md:col-span-3 space-y-2 text-xs">
              <div className="font-mono text-argile uppercase tracking-wider text-[11px] mb-4">
                Conformité Légale B2B
              </div>
              <p className="text-[11px] text-creme/60 leading-relaxed">
                Conforme aux réglementations africaines sur les données publiques professionnelles :
                Sénégal (loi 2008-12 CDP), Côte d'Ivoire (ARTCI loi 2013-450), Nigeria (NDPA 2023), Maroc (loi 09-08 CNDP).
              </p>
            </div>
          </div>

          {/* Bottom copyright & attribution */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-creme/50">
            <div>
              © {new Date().getFullYear()} GESLEAD. Tous droits réservés. Construit pour l'Afrique.
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-creme transition-colors">Politique de Confidentialité</a>
              <a href="#" className="hover:text-creme transition-colors">Conditions Générales (CGU)</a>
              <a href="#" className="hover:text-creme transition-colors">Mentions Légales</a>
            </div>
          </div>
        </div>
      </footer>
        </>
      )}

      {/* ========================================================================= */}
      {/* SUPABASE CONNECTION MODAL                                                 */}
      {/* ========================================================================= */}
      {isSupabaseModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-creme-pure rounded-[2.5rem] border border-mousse/20 shadow-2xl p-6 sm:p-8 flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-mousse/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-mousse text-creme flex items-center justify-center">
                  <Database className="w-4 h-4 text-argile" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-charbon leading-tight">
                    Connexion Supabase (PostgreSQL & Auth)
                  </h3>
                  <span className="font-mono text-[11px] text-charbon/60">
                    Projet GESLEAD · RLS · Realtime · Profils
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsSupabaseModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-mousse/10 text-charbon/70"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Connection Status Box */}
            <div className="mt-5 p-4 rounded-2xl bg-creme-card border border-mousse/10 flex items-start gap-3">
              <span className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${supabaseConnected ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
              <div className="flex-1 text-xs">
                <div className="font-semibold text-charbon">
                  {supabaseConnected ? 'Connexion Supabase Active' : 'Supabase en attente de configuration'}
                </div>
                <div className="font-mono text-charbon/70 text-[11px] mt-0.5">
                  {supabaseStatusMsg}
                </div>
              </div>
            </div>

            {/* Form Inputs */}
            <div className="mt-5 space-y-4 text-xs font-sans">
              <div>
                <label className="block text-charbon/80 font-mono text-[11px] uppercase mb-1.5">
                  Project URL (Ex: https://xyzcompany.supabase.co)
                </label>
                <input
                  type="text"
                  placeholder="https://votre-projet.supabase.co"
                  value={supabaseInputUrl}
                  onChange={(e) => setSupabaseInputUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-creme border border-mousse/20 text-charbon font-mono text-xs focus:outline-none focus:border-argile"
                />
              </div>

              <div>
                <label className="block text-charbon/80 font-mono text-[11px] uppercase mb-1.5">
                  Anon / Public Key (eyJhbGciOi...)
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseInputKey}
                  onChange={(e) => setSupabaseInputKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-creme border border-mousse/20 text-charbon font-mono text-xs focus:outline-none focus:border-argile"
                />
              </div>
            </div>

            {/* Migration Schema helper */}
            <div className="mt-5 p-3.5 rounded-xl bg-mousse-deep text-creme text-xs flex items-center justify-between">
              <div className="font-mono text-[11px]">
                <div className="font-semibold text-argile">Schéma SQL Supabase Prêt :</div>
                <div className="text-creme/70 text-[10px]">supabase/migrations/0001_init.sql</div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`-- Schéma disponible dans supabase/migrations/0001_init.sql`);
                  alert("Le chemin du fichier SQL est : supabase/migrations/0001_init.sql");
                }}
                className="px-3 py-1.5 rounded-lg bg-creme/10 hover:bg-creme/20 text-creme font-mono text-[11px] flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copier</span>
              </button>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-mousse/10">
              <button
                onClick={() => setIsSupabaseModalOpen(false)}
                className="px-4 py-2 rounded-full border border-mousse/20 text-xs font-semibold text-charbon hover:bg-mousse/5"
              >
                Fermer
              </button>
              <button
                disabled={isVerifyingSupabase}
                onClick={async () => {
                  if (!supabaseInputUrl || !supabaseInputKey) {
                    alert("Veuillez renseigner l'URL et la clé anonyme de votre projet Supabase.");
                    return;
                  }
                  setIsVerifyingSupabase(true);
                  setSupabaseStatusMsg("Test de connexion en cours...");

                  try {
                    // Test ping to Supabase
                    const res = await fetch(`${supabaseInputUrl.replace(/\/$/, '')}/rest/v1/`, {
                      headers: {
                        apikey: supabaseInputKey,
                        Authorization: `Bearer ${supabaseInputKey}`
                      }
                    });

                    if (res.ok || res.status === 200 || res.status === 404 || res.status === 401) {
                      setSupabaseConnected(true);
                      setSupabaseStatusMsg("Connecté avec succès au projet Supabase !");
                      localStorage.setItem('geslead_supabase_url', supabaseInputUrl);
                      localStorage.setItem('geslead_supabase_key', supabaseInputKey);
                    } else {
                      setSupabaseConnected(false);
                      setSupabaseStatusMsg(`Échec de connexion : code HTTP ${res.status}`);
                    }
                  } catch (e) {
                    setSupabaseConnected(false);
                    setSupabaseStatusMsg(`Erreur : ${(e).message}`);
                  } finally {
                    setIsVerifyingSupabase(false);
                  }
                }}
                className="btn-magnetic btn-slide-layer group px-5 py-2 rounded-full bg-argile text-white text-xs font-semibold shadow flex items-center gap-2"
              >
                <span className="slide-bg bg-argile-dark" />
                <span>{isVerifyingSupabase ? 'Vérification...' : 'Enregistrer & Tester'}</span>
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL D'AUTHENTIFICATION SUPABASE (CONNEXION & INSCRIPTION)               */}
      {/* ========================================================================= */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 overflow-hidden text-charbon">
            
            {/* Close Button */}
            <button
              onClick={() => {
                setIsAuthModalOpen(false);
                setAuthError(null);
                setAuthSuccessMsg(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-charbon/60 hover:text-charbon transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-0.5 font-bold text-2xl tracking-tight text-charbon">
                <span>GesLead</span>
                <span className="w-1.5 h-1.5 rounded-full bg-argile self-end mb-1 ml-0.5" />
              </div>
              <p className="text-xs text-charbon/60 mt-1 font-sans">
                {authMode === 'signup'
                  ? `Créez votre compte et recevez ${WELCOME_CREDITS} crédits de prospection offerts`
                  : 'Ravi de vous revoir ! Accédez à votre espace de prospection'}
              </p>
            </div>

            {/* Tabs Switcher: Connexion / Créer un compte */}
            <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl mb-6 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setAuthError(null);
                  setAuthSuccessMsg(null);
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  authMode === 'signin'
                    ? 'bg-white text-charbon shadow-sm'
                    : 'text-charbon/60 hover:text-charbon'
                }`}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setAuthError(null);
                  setAuthSuccessMsg(null);
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  authMode === 'signup'
                    ? 'bg-white text-charbon shadow-sm'
                    : 'text-charbon/60 hover:text-charbon'
                }`}
              >
                Créer un compte
              </button>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {authError}
              </div>
            )}

            {/* Success Message */}
            {authSuccessMsg && (
              <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{authSuccessMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-xs">
              {authMode === 'signup' && (
                <>
                  <div>
                    <label className="block text-charbon/80 font-medium mb-1">
                      Nom complet
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Ex: Mamadou Aliou"
                        value={authFullName}
                        onChange={(e) => setAuthFullName(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-argile focus:outline-none text-charbon text-xs"
                      />
                      <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-charbon/80 font-medium mb-1">
                      Nom de votre entreprise
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ex: Agence B2B Sahel"
                        value={authCompany}
                        onChange={(e) => setAuthCompany(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-argile focus:outline-none text-charbon text-xs"
                      />
                      <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-charbon/80 font-medium mb-1">
                  Adresse e-mail
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="nom@entreprise.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-argile focus:outline-none text-charbon text-xs"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-charbon/80 font-medium">
                    Mot de passe
                  </label>
                  {authMode === 'signin' && (
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        alert("Un lien de réinitialisation sécurisé peut être envoyé via Supabase Auth.");
                      }}
                      className="text-[11px] text-argile hover:underline cursor-pointer"
                    >
                      Mot de passe oublié ?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-argile focus:outline-none text-charbon text-xs"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-charbon cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full mt-2 py-3 rounded-xl bg-argile hover:bg-argile-dark text-white font-semibold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {authLoading ? (
                  <span>Vérification en cours...</span>
                ) : authMode === 'signup' ? (
                  <>
                    <span>Créer mon compte ({WELCOME_CREDITS} crédits offerts)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Se connecter à mon compte</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Access (1 Clic) */}
            <div className="mt-5 pt-4 border-t border-gray-100 text-center">
              <button
                type="button"
                onClick={handleDemoSignIn}
                className="w-full py-2.5 px-4 rounded-xl bg-gray-50 hover:bg-gray-100 text-charbon text-xs font-mono font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-argile" />
                <span>Tester immédiatement en mode Démo (1 clic)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL VIDEO / DÉMO PRODUIT (DÉCLENCHÉ PAR LE BOUTON PLAY BLEU)             */}
      {/* ========================================================================= */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-charbon rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 overflow-hidden text-creme">
            
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <h3 className="font-bold text-sm sm:text-base text-creme">
                  Démonstration Interactive GESLEAD en 60 secondes
                </h3>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-creme/70 hover:text-creme transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual simulation stage */}
            <div className="my-6 rounded-2xl bg-black/50 border border-white/10 p-8 text-center flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
              <div className="w-16 h-16 rounded-full bg-[#1D70B8] flex items-center justify-center shadow-xl mb-4 group hover:scale-105 transition-transform">
                <Play className="w-7 h-7 fill-current text-white ml-1" />
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-creme tracking-tight">
                Comment récolter 200 leads qualifiés en 3 clics
              </h4>
              <p className="text-xs sm:text-sm text-creme/70 max-w-lg mt-3 leading-relaxed">
                Extraction Google Maps granulaire à Dakar, Abidjan et Douala, qualification automatique des mobiles WhatsApp et rédaction ultra-personnalisée par IA.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setIsVideoModalOpen(false);
                    setIsAppModalOpen(true);
                  }}
                  className="px-6 py-3 rounded-xl bg-argile hover:bg-argile-dark text-white font-semibold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>Tester le simulateur en direct</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-creme/50 font-mono">
              <span>GESLEAD · Algorithme vérifié sans bannissement</span>
              <span>Conforme CDP Sénégal & ARTCI CI</span>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: TROUVER DE NOUVEAUX LEADS (Conforme 1:1 à la Capture 2)           */}
      {/* ========================================================================= */}
      <NewSearchModal
        isOpen={isNewSearchModalOpen}
        onClose={() => setIsNewSearchModalOpen(false)}
        sector={newSearchSector}
        setSector={setNewSearchSector}
        city={newSearchCity}
        setCity={setNewSearchCity}
        country={newSearchCountry}
        setCountry={setNewSearchCountry}
        maxResults={newSearchMaxResults}
        setMaxResults={setNewSearchMaxResults}
        websiteFilter={newSearchWebsiteFilter}
        setWebsiteFilter={setNewSearchWebsiteFilter}
        minRating={newSearchMinRating}
        setMinRating={setNewSearchMinRating}
        minReviews={newSearchMinReviews}
        setMinReviews={setNewSearchMinReviews}
        isExtracting={isExtracting}
        extractionStep={extractionStep}
        extractionProgress={extractionProgress}
        extractedCount={extractedCount}
        recentFoundItem={recentFoundItem}
        onSubmit={handleStartNewSearch}
        creditCost={SEARCH_CREDIT_COST}
        userCredits={userCredits}
        isCreator={isCreator}
      />

      {/* ========================================================================= */}
      {/* MODAL : ACHAT DE CRÉDITS (Maketou & Orange Money Guinée)                   */}
      {/* ========================================================================= */}
      <BuyCreditsModal
        isOpen={isBuyCreditsOpen}
        onClose={() => setIsBuyCreditsOpen(false)}
        userCredits={userCredits}
        canPurchase={hasRealAccount(currentUser)}
        reason={buyCreditsReason}
        currentUser={currentUser}
        defaultTab={buyCreditsDefaultTab}
        isCreator={isCreator}
        onRequireAuth={() => {
          setIsBuyCreditsOpen(false);
          openSignIn('signin');
        }}
      />

      {/* ========================================================================= */}
      {/* MODAL 2: WORKSPACE EXPLORATEUR DE LEADS & IA (Conforme 1:1 Capture Écran)  */}
      {/* ========================================================================= */}
      <WorkspaceModal
        isOpen={isAppModalOpen}
        onClose={() => setIsAppModalOpen(false)}
        leadsList={filteredLeads}
        currentCampaign={currentCampaign}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        onExportCsv={handleExportCsv}
        selectedLead={selectedLead}
        setSelectedLead={setSelectedLead}
        messageChannel={messageChannel}
        setMessageChannel={setMessageChannel}
        messageTone={messageTone}
        setMessageTone={setMessageTone}
        aiGeneratedText={aiGeneratedText}
        isGeneratingAi={isGeneratingAi}
        aiGenerationStatus={aiGenerationStatus}
        aiSource={aiSource}
        handleStartAiGeneration={handleStartAiGeneration}
        copiedId={copiedId}
        handleCopy={handleCopy}
        viewCount={leadsViewCount}
      />

    </div>
  );
}

