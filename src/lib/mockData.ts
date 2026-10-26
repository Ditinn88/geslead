// src/lib/mockData.ts

export interface LeadItem {
  id: string;
  place_id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  country: string;
  country_code: string;
  phone_raw: string;
  phone_e164: string;
  is_mobile: boolean;
  website: string | null;
  email: string | null;
  rating: number;
  reviews_count: number;
  maps_url: string;
  status: 'new' | 'contacted' | 'replied' | 'won' | 'lost';
  whatsapp_ready: boolean;
  notes?: string;
  suggested_angle?: string;
}

export const MOCK_LEADS: LeadItem[] = [
  {
    id: 'lead-sn-01',
    place_id: 'place_sn_001',
    name: 'Quincaillerie Générale du Plateau',
    category: 'Matériaux & Quincaillerie',
    address: '42 Rue Félix Faure, Dakar Plateau',
    city: 'Dakar',
    country: 'Sénégal',
    country_code: 'SN',
    phone_raw: '+221 77 645 28 19',
    phone_e164: '+221776452819',
    is_mobile: true,
    website: null,
    email: null,
    rating: 4.8,
    reviews_count: 42,
    maps_url: 'https://maps.google.com/?cid=sn001',
    status: 'new',
    whatsapp_ready: true,
    suggested_angle: "Pas de site web mais forte notoriété (4.8★). Proposer un catalogue en ligne ou gestion d'inventaire.",
  },
  {
    id: 'lead-ci-02',
    place_id: 'place_ci_002',
    name: 'Cabinet Médical & Dentaire Les Deux Plateaux',
    category: 'Clinique & Santé Privée',
    address: 'Boulevard Latrille, Cocody, Abidjan',
    city: 'Abidjan',
    country: "Côte d'Ivoire",
    country_code: 'CI',
    phone_raw: '+225 07 58 14 33 90',
    phone_e164: '+2250758143390',
    is_mobile: true,
    website: null,
    email: 'contact@deuxplateaux-sante.ci',
    rating: 4.9,
    reviews_count: 76,
    maps_url: 'https://maps.google.com/?cid=ci002',
    status: 'new',
    whatsapp_ready: true,
    suggested_angle: 'Prise de rendez-vous automatique par WhatsApp et solution de rappel SMS des patients.',
  },
  {
    id: 'lead-cm-03',
    place_id: 'place_cm_003',
    name: 'Hôtel Résidence & Spa Akwa Palace Bis',
    category: 'Hôtellerie & Tourisme',
    address: 'Rue Silvani, Akwa, Douala',
    city: 'Douala',
    country: 'Cameroun',
    country_code: 'CM',
    phone_raw: '+237 6 99 22 41 05',
    phone_e164: '+237699224105',
    is_mobile: true,
    website: 'https://hotel-akwa-douala.cm',
    email: 'direction@hotel-akwa-douala.cm',
    rating: 4.3,
    reviews_count: 128,
    maps_url: 'https://maps.google.com/?cid=cm003',
    status: 'contacted',
    whatsapp_ready: true,
    suggested_angle: 'Logiciel de réservation directe sans commission OTA.',
  },
  {
    id: 'lead-ma-04',
    place_id: 'place_ma_004',
    name: 'Audit & Conseil Financier Maarif',
    category: 'Cabinet Comptable & Fiscal',
    address: 'Boulevard Al Massira Al Khadra, Casablanca',
    city: 'Casablanca',
    country: 'Maroc',
    country_code: 'MA',
    phone_raw: '+212 6 61 45 88 12',
    phone_e164: '+212661458812',
    is_mobile: true,
    website: null,
    email: null,
    rating: 4.7,
    reviews_count: 31,
    maps_url: 'https://maps.google.com/?cid=ma004',
    status: 'new',
    whatsapp_ready: true,
    suggested_angle: 'Automatisation de la facturation et portail client sécurisé.',
  },
  {
    id: 'lead-ng-05',
    place_id: 'place_ng_005',
    name: 'Apex Atlantic Logistics & Freight',
    category: 'Transport & Fret International',
    address: 'Adetokunbo Ademola St, Victoria Island, Lagos',
    city: 'Lagos',
    country: 'Nigeria',
    country_code: 'NG',
    phone_raw: '+234 803 712 9044',
    phone_e164: '+2348037129044',
    is_mobile: true,
    website: null,
    email: 'operations@apex-atlantic.ng',
    rating: 4.6,
    reviews_count: 54,
    maps_url: 'https://maps.google.com/?cid=ng005',
    status: 'new',
    whatsapp_ready: true,
    suggested_angle: 'Suivi de conteneurs en temps réel et alertes WhatsApp automatiques.',
  },
  {
    id: 'lead-sn-06',
    place_id: 'place_sn_006',
    name: 'Complexe Scolaire Bilingue Les Pépites',
    category: 'Éducation & École Privée',
    address: 'Route de Ngor, Almadies, Dakar',
    city: 'Dakar',
    country: 'Sénégal',
    country_code: 'SN',
    phone_raw: '+221 78 120 44 55',
    phone_e164: '+221781204455',
    is_mobile: true,
    website: null,
    email: null,
    rating: 4.9,
    reviews_count: 63,
    maps_url: 'https://maps.google.com/?cid=sn006',
    status: 'replied',
    whatsapp_ready: true,
    suggested_angle: 'Portail de communication parents d’élèves & paiement frais de scolarité par Wave / Orange Money.',
  },
  {
    id: 'lead-ci-07',
    place_id: 'place_ci_007',
    name: 'San-Pédro Transit & Entreposage',
    category: 'Import-Export & Transit',
    address: 'Zone Portuaire, San-Pédro',
    city: 'San-Pédro',
    country: "Côte d'Ivoire",
    country_code: 'CI',
    phone_raw: '+225 05 64 21 09 88',
    phone_e164: '+2250564210988',
    is_mobile: true,
    website: null,
    email: null,
    rating: 4.4,
    reviews_count: 19,
    maps_url: 'https://maps.google.com/?cid=ci007',
    status: 'new',
    whatsapp_ready: true,
    suggested_angle: 'Digitalisation des bons de chargement et alertes camions.',
  },
  {
    id: 'lead-cd-08',
    place_id: 'place_cd_008',
    name: 'Pharmacie Centrale du Fleuve',
    category: 'Pharmacie & Parapharmacie',
    address: 'Boulevard du 30 Juin, Gombe, Kinshasa',
    city: 'Kinshasa',
    country: 'RD Congo',
    country_code: 'CD',
    phone_raw: '+243 81 500 23 45',
    phone_e164: '+243815002345',
    is_mobile: true,
    website: null,
    email: null,
    rating: 4.5,
    reviews_count: 88,
    maps_url: 'https://maps.google.com/?cid=cd008',
    status: 'new',
    whatsapp_ready: true,
    suggested_angle: 'Vérification de stock par WhatsApp et livraison d’urgence.',
  },
];

export const OPHTALMOLOGUE_LEADS: LeadItem[] = [
  {
    id: 'lead-bj-oph-01',
    place_id: 'place_bj_001',
    name: 'Clinique Professeur Lawani',
    category: "Centre d'ophtalmologie",
    address: '9F7Q+PQ2, Rue 1364, Cotonou, Bénin',
    city: 'Cotonou',
    country: 'Bénin',
    country_code: 'BJ',
    phone_raw: '',
    phone_e164: '',
    is_mobile: false,
    website: null,
    email: null,
    rating: 0,
    reviews_count: 0,
    maps_url: 'https://www.google.com/maps/search/?api=1&query=Clinique+Professeur+Lawani+Cotonou',
    status: 'new',
    whatsapp_ready: false,
    suggested_angle: "Visibilité locale à optimiser pour capter les patients de Cotonou."
  },
  {
    id: 'lead-bj-oph-02',
    place_id: 'place_bj_002',
    name: 'ONG VISION-VIE',
    category: 'Ophtalmologiste',
    address: '99RR+RJG, Rue 2643, Cotonou, Bénin',
    city: 'Cotonou',
    country: 'Bénin',
    country_code: 'BJ',
    phone_raw: '+229 96080038',
    phone_e164: '+22996080038',
    is_mobile: true,
    website: null,
    email: null,
    rating: 0,
    reviews_count: 0,
    maps_url: 'https://www.google.com/maps/search/?api=1&query=ONG+VISION-VIE+Cotonou',
    status: 'new',
    whatsapp_ready: true,
    suggested_angle: "Acteur de santé visuelle réputé. Proposition d'un canal de prise de rendez-vous direct sur WhatsApp."
  },
  {
    id: 'lead-bj-oph-03',
    place_id: 'place_bj_003',
    name: 'Clinique Médicale "LES MERVEILLES"',
    category: 'Hôpital privé',
    address: '54 COTONOU, 03 BP, Cotonou, Bénin',
    city: 'Cotonou',
    country: 'Bénin',
    country_code: 'BJ',
    phone_raw: '+229 62378080',
    phone_e164: '+22962378080',
    is_mobile: true,
    website: 'https://www.lesmerveilles-cotonou.bj',
    email: 'contact@lesmerveilles.bj',
    rating: 5.0,
    reviews_count: 3,
    maps_url: 'https://www.google.com/maps/search/?api=1&query=Clinique+Medicale+LES+MERVEILLES+Cotonou',
    status: 'new',
    whatsapp_ready: true,
    suggested_angle: "Excellente note (5.0/5). Intégration d'un widget de consultation WhatsApp sur leur site."
  },
  {
    id: 'lead-bj-oph-04',
    place_id: 'place_bj_004',
    name: 'Clinique ophtalmologique "Marie-Stella"',
    category: 'Clinique ophtalmologique',
    address: '9CGV+2G5, Cotonou, Bénin',
    city: 'Cotonou',
    country: 'Bénin',
    country_code: 'BJ',
    phone_raw: '+229 01 44 86 77 77',
    phone_e164: '+2290144867777',
    is_mobile: true,
    website: null,
    email: null,
    rating: 5.0,
    reviews_count: 2,
    maps_url: 'https://www.google.com/maps/search/?api=1&query=Clinique+ophtalmologique+Marie-Stella+Cotonou',
    status: 'new',
    whatsapp_ready: true,
    suggested_angle: "5.0/5 sans site internet. Solution de rendez-vous automatique par WhatsApp."
  },
  ...Array.from({ length: 19 }, (_, i) => {
    const hasWeb = i < 3; // 1 + 3 = 4 with website total (matches Image 1)
    const hasPh = i < 18; // 3 + 18 = 21 with phone total (matches Image 1)
    const num = 90000000 + i * 111111;
    return {
      id: `lead-bj-oph-${i + 5}`,
      place_id: `place_bj_00${i + 5}`,
      name: `Centre Visuel & Optique Saint-${['Marc', 'Luc', 'Gabriel', 'Paul', 'Jean'][i % 5]} ${i + 1}`,
      category: i % 2 === 0 ? "Cabinet d'Ophtalmologie" : "Opticien & Santé Visuelle",
      address: `Rue ${200 + i * 15}, Quartier ${['Haie Vive', 'Ganhi', 'Cadjehoun', 'Akpakpa', 'Agla'][i % 5]}, Cotonou, Bénin`,
      city: 'Cotonou',
      country: 'Bénin',
      country_code: 'BJ',
      phone_raw: hasPh ? `+229 ${num}` : '',
      phone_e164: hasPh ? `+229${num}` : '',
      is_mobile: hasPh,
      website: hasWeb ? `https://www.optique-cotonou-${i}.bj` : null,
      email: hasWeb ? `info@optique-cotonou-${i}.bj` : null,
      rating: +(3.8 + (i % 3) * 0.5).toFixed(1),
      reviews_count: 5 + (i * 3) % 15,
      maps_url: `https://www.google.com/maps/search/?api=1&query=Optique+Cotonou+${i}`,
      status: 'new' as const,
      whatsapp_ready: hasPh,
      suggested_angle: hasWeb
        ? "Amélioration de la conversion visiteurs en consultations médicales."
        : "Déploiement d'une prise de contact immédiate sur WhatsApp."
    };
  })
];

export const DENTISTE_DAKAR_LEADS: LeadItem[] = [
  {
    id: 'lead-sn-dent-01',
    place_id: 'place_sn_dent_001',
    name: 'Cabinet Dentaire Dr. Abdoulaye Diop',
    category: 'Chirurgien-Dentiste',
    address: '14 Boulevard de la République, Dakar Plateau',
    city: 'Dakar',
    country: 'Sénégal',
    country_code: 'SN',
    phone_raw: '+221 77 654 32 10',
    phone_e164: '+221776543210',
    is_mobile: true,
    website: 'https://www.cabinetdiop-dentiste.sn',
    email: 'contact@cabinetdiop-dentiste.sn',
    rating: 4.9,
    reviews_count: 58,
    maps_url: 'https://www.google.com/maps/search/?api=1&query=Cabinet+Dentaire+Dr+Abdoulaye+Diop+Dakar',
    status: 'new',
    whatsapp_ready: true,
    suggested_angle: "Cabinet très réputé au Plateau (4.9★, 58 avis). Automatisation des rappels de rendez-vous et confirmation WhatsApp."
  },
  {
    id: 'lead-sn-dent-02',
    place_id: 'place_sn_dent_002',
    name: 'Clinique Dentaire des Almadies',
    category: 'Clinique Dentaire & Implantologie',
    address: 'Route des Almadies, face Pharmacie des Almadies, Dakar',
    city: 'Dakar',
    country: 'Sénégal',
    country_code: 'SN',
    phone_raw: '+221 78 412 88 90',
    phone_e164: '+221784128890',
    is_mobile: true,
    website: null,
    email: null,
    rating: 4.8,
    reviews_count: 74,
    maps_url: 'https://www.google.com/maps/search/?api=1&query=Clinique+Dentaire+des+Almadies+Dakar',
    status: 'new',
    whatsapp_ready: true,
    suggested_angle: "Excellente réputation sans site internet aux Almadies. Idéal pour proposer une vitrine de réservation instantanée sur WhatsApp."
  },
  {
    id: 'lead-sn-dent-03',
    place_id: 'place_sn_dent_003',
    name: "Cabinet d'Orthodontie & Soins Dr. Fatou Ndiaye",
    category: 'Orthodontiste & Dentiste',
    address: 'Rue Aimé Césaire, Fann Résidence, Dakar',
    city: 'Dakar',
    country: 'Sénégal',
    country_code: 'SN',
    phone_raw: '+221 76 520 14 33',
    phone_e164: '+221765201433',
    is_mobile: true,
    website: 'https://www.orthodontie-fann.sn',
    email: 'secretariat@orthodontie-fann.sn',
    rating: 5.0,
    reviews_count: 42,
    maps_url: 'https://www.google.com/maps/search/?api=1&query=Cabinet+Orthodontie+Dr+Fatou+Ndiaye+Dakar',
    status: 'new',
    whatsapp_ready: true,
    suggested_angle: "Note parfaite 5.0/5. Solution de suivi orthodontique et relances préventives par WhatsApp."
  },
  {
    id: 'lead-sn-dent-04',
    place_id: 'place_sn_dent_004',
    name: 'Espace Dentaire Point E',
    category: 'Soins Dentaires & Prothèses',
    address: 'Avenue Cheikh Anta Diop, Point E, Dakar',
    city: 'Dakar',
    country: 'Sénégal',
    country_code: 'SN',
    phone_raw: '+221 77 340 91 12',
    phone_e164: '+221773409112',
    is_mobile: true,
    website: null,
    email: null,
    rating: 4.7,
    reviews_count: 36,
    maps_url: 'https://www.google.com/maps/search/?api=1&query=Espace+Dentaire+Point+E+Dakar',
    status: 'new',
    whatsapp_ready: true,
    suggested_angle: "Zone étudiante et résidentielle dense. Proposition d'un canal direct de devis rapide prothèses par WhatsApp."
  },
  ...Array.from({ length: 26 }, (_, i) => {
    const districts = [
      'Mermoz', 'Ngor', 'Ouakam', 'Médina', 'Grand Dakar', 
      'Liberté 6', 'Sacré-Cœur', 'Hann Maristes', 'Yoff', 
      'Dakar Plateau', 'Almadies', 'Point E', 'Fann'
    ];
    const district = districts[i % districts.length];
    const doctors = [
      'Dr. Ousmane Sow', 'Dr. Aminata Fall', 'Dr. Cheikh Gueye', 
      'Dr. Mariama Cissé', 'Dr. Babacar Touré', 'Dr. Ibrahima Diallo', 
      'Dr. Khady Kane', 'Dr. Mansour Faye', 'Dr. Aïssatou Ba', 
      'Dr. Mamadou Sy', 'Dr. Ramatoulaye Seck', 'Dr. Jean-Pierre Mendy',
      'Dr. Fatoumata Bâ'
    ];
    const doctor = doctors[i % doctors.length];
    const types = ['Cabinet Dentaire', 'Centre Odontologique', 'Clinique Dentaire', 'Espace Sourire'];
    const type = types[i % types.length];
    const hasWeb = i % 4 === 0;
    const phonePrefix = ['77', '78', '76', '70'][i % 4];
    const phoneNum = `${phonePrefix} ${300 + i * 14} ${String(1000 + i * 231).slice(0, 4)}`;
    const phoneE164 = `+221${phonePrefix}${300 + i * 14}${String(1000 + i * 231).slice(0, 4)}`;
    const rating = +(4.4 + ((i * 3) % 7) * 0.1).toFixed(1);
    const reviews = 15 + ((i * 7) % 65);

    return {
      id: `lead-sn-dent-${i + 5}`,
      place_id: `place_sn_dent_00${i + 5}`,
      name: `${type} ${doctor} - ${district}`,
      category: 'Chirurgien-Dentiste & Soins',
      address: `${10 + (i * 8) % 150} Rue Principale, ${district}, Dakar`,
      city: 'Dakar',
      country: 'Sénégal',
      country_code: 'SN',
      phone_raw: `+221 ${phoneNum}`,
      phone_e164: phoneE164,
      is_mobile: true,
      website: hasWeb ? `https://www.dentiste-${district.toLowerCase().replace(/[^a-z]/g, '')}-${i}.sn` : null,
      email: hasWeb ? `contact@dentiste-${district.toLowerCase().replace(/[^a-z]/g, '')}.sn` : null,
      rating: rating > 5.0 ? 5.0 : rating,
      reviews_count: reviews,
      maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${type} ${doctor} ${district} Dakar`)}`,
      status: 'new' as const,
      whatsapp_ready: true,
      suggested_angle: hasWeb 
        ? "Praticien établi avec site. Améliorer la conversion en intégrant le clic direct WhatsApp sur leur accueil."
        : "Forte notoriété locale sans site web. Proposition d'une fiche WhatsApp Business et prise de RDV automatique."
    };
  })
];

export const DEFAULT_CAMPAIGNS = [
  {
    id: 'campaign-dentiste-dakar',
    sector: 'dentiste',
    city: 'Dakar',
    country: 'Sénégal',
    date: '28 AVRIL 2026',
    time: '05:12',
    leadsCount: 30,
    status: 'Terminé',
    leads: DENTISTE_DAKAR_LEADS
  },
  {
    id: 'campaign-oph-cotonou',
    sector: 'ophtalmologue',
    city: 'cotonou',
    country: 'Bénin',
    date: '8 AVRIL 2026',
    time: '05:32',
    leadsCount: 23,
    status: 'Terminé',
    leads: OPHTALMOLOGUE_LEADS
  },
  {
    id: 'campaign-plombier-thies',
    sector: 'plombier',
    city: 'thies',
    country: 'Sénégal',
    date: '8 AVRIL 2026',
    time: '05:23',
    leadsCount: 6,
    status: 'Terminé',
    leads: MOCK_LEADS.slice(0, 6)
  },
  {
    id: 'campaign-plombier-pending',
    sector: 'plombier',
    city: 'thies',
    country: 'Sénégal',
    date: '8 AVRIL 2026',
    time: '05:21',
    leadsCount: 0,
    status: 'En attente',
    leads: []
  }
];


