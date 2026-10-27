// src/lib/geo.ts

export interface CountryConfig {
  name: string;
  code: string;
  lang: string;
  currency: string;
  phonePrefix: string;
  mobilePrefixes: string[];
  cities: string[];
  sampleDistricts: string[];
  districts?: Record<string, string[]>;
}

export const COUNTRIES: Record<string, CountryConfig> = {
  SN: {
    name: 'Sénégal',
    code: 'SN',
    lang: 'fr',
    currency: 'XOF',
    phonePrefix: '+221',
    mobilePrefixes: ['77', '78', '76', '70', '75'],
    cities: ['Dakar', 'Thiès', 'Saint-Louis', 'Touba', 'Mbour', 'Ziguinchor'],
    sampleDistricts: ['Plateau', 'Almadies', 'Point E', 'Mermoz', 'Ngor', 'Ouakam', 'Fann', 'Yoff', 'Grand Dakar'],
    districts: {
      Dakar: ['Plateau', 'Almadies', 'Point E', 'Mermoz', 'Ngor', 'Ouakam', 'Fann', 'Yoff', 'Grand Dakar'],
    },
  },
  CI: {
    name: "Côte d'Ivoire",
    code: 'CI',
    lang: 'fr',
    currency: 'XOF',
    phonePrefix: '+225',
    mobilePrefixes: ['07', '05', '01'],
    cities: ['Abidjan', 'Bouaké', 'Yamoussoukro', 'San-Pédro', 'Korhogo'],
    sampleDistricts: ['Plateau', 'Cocody', 'Marcory', 'Zone 4', 'Treichville', 'Yopougon', 'Riviera', 'Deux Plateaux', 'Angré'],
    districts: {
      Abidjan: ['Plateau', 'Cocody', 'Marcory', 'Zone 4', 'Treichville', 'Yopougon', 'Riviera', 'Deux Plateaux'],
    },
  },
  BJ: {
    name: 'Bénin',
    code: 'BJ',
    lang: 'fr',
    currency: 'XOF',
    phonePrefix: '+229',
    mobilePrefixes: ['97', '96', '95', '94', '66'],
    cities: ['Cotonou', 'Porto-Novo', 'Parakou', 'Abomey-Calavi', 'Ouidah'],
    sampleDistricts: ['Cadjehoun', 'Haie Vive', 'Ganhi', 'Akpakpa', 'Fidjrossè', 'Cocotomey', 'Gbégamey'],
  },
  CM: {
    name: 'Cameroun',
    code: 'CM',
    lang: 'fr',
    currency: 'XAF',
    phonePrefix: '+237',
    mobilePrefixes: ['69', '67', '65', '68'],
    cities: ['Douala', 'Yaoundé', 'Bafoussam', 'Garoua', 'Kribi'],
    sampleDistricts: ['Akwa', 'Bonanjo', 'Bonapriso', 'Bali', 'Bastos', 'Omnisports', 'Deido', 'Makepe'],
    districts: {
      Douala: ['Akwa', 'Bonanjo', 'Bonapriso', 'Deido', 'Bali'],
      Yaoundé: ['Bastos', 'Centre-ville', 'Omnisports'],
    },
  },
  GN: {
    name: 'Guinée',
    code: 'GN',
    lang: 'fr',
    currency: 'GNF',
    phonePrefix: '+224',
    mobilePrefixes: ['62', '66', '61', '65'],
    cities: ['Conakry', 'Kindia', 'Labé', 'Kankan', 'Nzérékoré'],
    sampleDistricts: ['Kaloum', 'Dixinn', 'Matam', 'Ratoma', 'Kipé', 'Taouyah', 'Camayenne'],
  },
  ML: {
    name: 'Mali',
    code: 'ML',
    lang: 'fr',
    currency: 'XOF',
    phonePrefix: '+223',
    mobilePrefixes: ['70', '66', '76', '65'],
    cities: ['Bamako', 'Sikasso', 'Mopti', 'Ségou', 'Kayes'],
    sampleDistricts: ['Badalabougou', 'ACI 2000', 'Hamdallaye', 'Hippodrome', 'Quinzambougou', 'Torokorobougou'],
  },
  TG: {
    name: 'Togo',
    code: 'TG',
    lang: 'fr',
    currency: 'XOF',
    phonePrefix: '+228',
    mobilePrefixes: ['90', '91', '92', '93', '70'],
    cities: ['Lomé', 'Sokodé', 'Kara', 'Kpalimé', 'Atakpamé'],
    sampleDistricts: ['Tokoin', 'Bè', 'Nyékonakpoè', 'Agoè', 'Adidogomé', 'Hédzranawoé'],
  },
  BF: {
    name: 'Burkina Faso',
    code: 'BF',
    lang: 'fr',
    currency: 'XOF',
    phonePrefix: '+226',
    mobilePrefixes: ['70', '76', '60', '75', '55'],
    cities: ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora', 'Ouahigouya'],
    sampleDistricts: ['Ouaga 2000', 'Koulouba', 'Gounghin', 'Pissy', 'Dassasgho', 'Somgandé'],
  },
  GA: {
    name: 'Gabon',
    code: 'GA',
    lang: 'fr',
    currency: 'XAF',
    phonePrefix: '+241',
    mobilePrefixes: ['06', '07', '04', '05'],
    cities: ['Libreville', 'Port-Gentil', 'Franceville', 'Oyem', 'Moanda'],
    sampleDistricts: ['Batterie 4', 'Sablière', 'Louis', 'Glass', 'Mont-Bouët', 'Akanda', 'Nzeng-Ayong'],
  },
  CG: {
    name: 'Congo',
    code: 'CG',
    lang: 'fr',
    currency: 'XAF',
    phonePrefix: '+242',
    mobilePrefixes: ['06', '05', '04'],
    cities: ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Nkayi'],
    sampleDistricts: ['Centre-Ville', 'Bacongo', 'Poto-Poto', 'Ouenze', 'Moungali', 'Mpila'],
  },
  CD: {
    name: 'RD Congo',
    code: 'CD',
    lang: 'fr',
    currency: 'CDF',
    phonePrefix: '+243',
    mobilePrefixes: ['81', '82', '85', '99', '90'],
    cities: ['Kinshasa', 'Lubumbashi', 'Goma', 'Kolwezi', 'Kisangani', 'Bukavu'],
    sampleDistricts: ['Gombe', 'Ngaliema', 'Limete', 'Kalamu', 'Bandalungwa', 'Kintambo'],
    districts: {
      Kinshasa: ['Gombe', 'Kalamu', 'Ngaliema', 'Limete'],
    },
  },
  MA: {
    name: 'Maroc',
    code: 'MA',
    lang: 'fr',
    currency: 'MAD',
    phonePrefix: '+212',
    mobilePrefixes: ['6', '7'],
    cities: ['Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Fès', 'Agadir'],
    sampleDistricts: ['Gauthier', 'Maârif', 'Agdal', 'Guéliz', 'Hivernage', 'Anfa', 'Bourgogne', 'Hay Riad'],
    districts: {
      Casablanca: ['Maarif', 'Gauthier', 'Anfa', 'Bourgogne', 'Sidi Maarouf'],
    },
  },
  RW: {
    name: 'Rwanda',
    code: 'RW',
    lang: 'fr',
    currency: 'RWF',
    phonePrefix: '+250',
    mobilePrefixes: ['78', '73', '72'],
    cities: ['Kigali', 'Butare', 'Gisenyi', 'Ruhengeri'],
    sampleDistricts: ['Kiyovu', 'Nyarutarama', 'Kimihurura', 'Kacyiru', 'Gisozi', 'Remera'],
  },
  MG: {
    name: 'Madagascar',
    code: 'MG',
    lang: 'fr',
    currency: 'MGA',
    phonePrefix: '+261',
    mobilePrefixes: ['32', '33', '34'],
    cities: ['Antananarivo', 'Toamasina', 'Antsirabe', 'Mahajanga', 'Fianarantsoa'],
    sampleDistricts: ['Analakely', 'Ankorondrano', 'Isoraka', 'Ivandry', 'Ambatobe'],
  },
  NE: {
    name: 'Niger',
    code: 'NE',
    lang: 'fr',
    currency: 'XOF',
    phonePrefix: '+227',
    mobilePrefixes: ['90', '96', '97', '89'],
    cities: ['Niamey', 'Zinder', 'Maradi', 'Agadez', 'Tahoua'],
    sampleDistricts: ['Plateau', 'Yantala', 'Dar-es-Salam', 'Koira Kano', 'Gamkallé'],
  },
  TD: {
    name: 'Tchad',
    code: 'TD',
    lang: 'fr',
    currency: 'XAF',
    phonePrefix: '+235',
    mobilePrefixes: ['66', '99', '63', '95'],
    cities: ["N'Djamena", 'Moundou', 'Sarh', 'Abéché'],
    sampleDistricts: ['Chagoua', 'Moursal', 'Farcha', 'Bololo', 'Sabangali'],
  },
  MR: {
    name: 'Mauritanie',
    code: 'MR',
    lang: 'fr',
    currency: 'MRU',
    phonePrefix: '+222',
    mobilePrefixes: ['46', '36', '22', '41'],
    cities: ['Nouakchott', 'Nouadhibou', 'Rosso', 'Kiffa'],
    sampleDistricts: ['Tevragh-Zeina', 'Ksar', 'Sebkha', 'Arafat', 'Dar-Naim'],
  },
  DZ: {
    name: 'Algérie',
    code: 'DZ',
    lang: 'fr',
    currency: 'DZD',
    phonePrefix: '+213',
    mobilePrefixes: ['5', '6', '7'],
    cities: ['Alger', 'Oran', 'Constantine', 'Annaba', 'Blida'],
    sampleDistricts: ['Hydra', 'El Biar', 'Sidi Yahia', 'Didouche Mourad', 'Kouba'],
  },
  TN: {
    name: 'Tunisie',
    code: 'TN',
    lang: 'fr',
    currency: 'TND',
    phonePrefix: '+216',
    mobilePrefixes: ['2', '5', '9'],
    cities: ['Tunis', 'Sfax', 'Sousse', 'Bizerte', 'Ariana'],
    sampleDistricts: ['Les Berges du Lac', 'Ennasr', 'La Marsa', 'El Menzah', 'Centre Urbain Nord'],
  },
  NG: {
    name: 'Nigeria',
    code: 'NG',
    lang: 'en',
    currency: 'NGN',
    phonePrefix: '+234',
    mobilePrefixes: ['80', '81', '90', '70'],
    cities: ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan'],
    sampleDistricts: ['Victoria Island', 'Ikoyi', 'Lekki Phase 1', 'Ikeja', 'Yaba'],
    districts: {
      Lagos: ['Victoria Island', 'Ikoyi', 'Lekki Phase 1', 'Ikeja', 'Yaba'],
    },
  },
  GH: {
    name: 'Ghana',
    code: 'GH',
    lang: 'en',
    currency: 'GHS',
    phonePrefix: '+233',
    mobilePrefixes: ['24', '54', '20', '26', '50'],
    cities: ['Accra', 'Kumasi', 'Takoradi', 'Tema'],
    sampleDistricts: ['Airport Residential', 'Osu', 'East Legon', 'Cantonments'],
    districts: {
      Accra: ['Airport Residential', 'Osu', 'East Legon', 'Cantonments'],
    },
  },
  KE: {
    name: 'Kenya',
    code: 'KE',
    lang: 'en',
    currency: 'KES',
    phonePrefix: '+254',
    mobilePrefixes: ['71', '72', '79', '70'],
    cities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'],
    sampleDistricts: ['Westlands', 'Kilimani', 'Upper Hill', 'CBD', 'Karen'],
    districts: {
      Nairobi: ['Westlands', 'Kilimani', 'Upper Hill', 'CBD', 'Karen'],
    },
  },
  AO: {
    name: 'Angola',
    code: 'AO',
    lang: 'pt',
    currency: 'AOA',
    phonePrefix: '+244',
    mobilePrefixes: ['92', '93', '94', '91'],
    cities: ['Luanda', 'Benguela', 'Huambo', 'Lubango'],
    sampleDistricts: ['Ingombota', 'Maianga', 'Talatona', 'Miramar'],
    districts: {
      Luanda: ['Ingombota', 'Maianga', 'Talatona', 'Miramar'],
    },
  },
  ZA: {
    name: 'Afrique du Sud',
    code: 'ZA',
    lang: 'en',
    currency: 'ZAR',
    phonePrefix: '+27',
    mobilePrefixes: ['71', '72', '82', '83', '60'],
    cities: ['Johannesburg', 'Le Cap', 'Durban', 'Pretoria', 'Port Elizabeth'],
    sampleDistricts: ['Sandton', 'Rosebank', 'Waterfront', 'Camps Bay', 'Umhlanga'],
  },
  EG: {
    name: 'Égypte',
    code: 'EG',
    lang: 'ar',
    currency: 'EGP',
    phonePrefix: '+20',
    mobilePrefixes: ['10', '11', '12', '15'],
    cities: ['Le Caire', 'Alexandrie', 'Gizeh', 'Sharm El Sheikh'],
    sampleDistricts: ['Zamalek', 'Maadi', 'New Cairo', 'Heliopolis', 'Dokki'],
  },
  ET: {
    name: 'Éthiopie',
    code: 'ET',
    lang: 'am',
    currency: 'ETB',
    phonePrefix: '+251',
    mobilePrefixes: ['91', '92', '93', '70'],
    cities: ['Addis-Abeba', 'Dire Dawa', 'Hawassa', 'Bahir Dar'],
    sampleDistricts: ['Bole', 'Kazanchis', 'Piazza', 'Kirkos', 'Sarbet'],
  },
  TZ: {
    name: 'Tanzanie',
    code: 'TZ',
    lang: 'sw',
    currency: 'TZS',
    phonePrefix: '+255',
    mobilePrefixes: ['75', '76', '68', '71'],
    cities: ['Dar es Salaam', 'Dodoma', 'Arusha', 'Mwanza', 'Zanzibar'],
    sampleDistricts: ['Masaki', 'Oysterbay', 'Mikocheni', 'Kariakoo', 'Upanga'],
  },
  UG: {
    name: 'Ouganda',
    code: 'UG',
    lang: 'en',
    currency: 'UGX',
    phonePrefix: '+256',
    mobilePrefixes: ['77', '78', '70', '75'],
    cities: ['Kampala', 'Entebbe', 'Jinja', 'Mbarara', 'Gulu'],
    sampleDistricts: ['Kololo', 'Nakasero', 'Bugolobi', 'Ntinda', 'Kamwokya'],
  },
  ZM: {
    name: 'Zambie',
    code: 'ZM',
    lang: 'en',
    currency: 'ZMW',
    phonePrefix: '+260',
    mobilePrefixes: ['97', '96', '95'],
    cities: ['Lusaka', 'Ndola', 'Kitwe', 'Livingstone'],
    sampleDistricts: ['Woodlands', 'Kabulonga', 'Rhodes Park', 'Northmead'],
  },
  ZW: {
    name: 'Zimbabwe',
    code: 'ZW',
    lang: 'en',
    currency: 'USD',
    phonePrefix: '+263',
    mobilePrefixes: ['77', '71', '73'],
    cities: ['Harare', 'Bulawayo', 'Mutare', 'Gweru'],
    sampleDistricts: ['Avondale', 'Borrowdale', 'Belgravia', 'Mount Pleasant'],
  },
  MZ: {
    name: 'Mozambique',
    code: 'MZ',
    lang: 'pt',
    currency: 'MZN',
    phonePrefix: '+258',
    mobilePrefixes: ['84', '82', '86'],
    cities: ['Maputo', 'Matola', 'Beira', 'Nampula'],
    sampleDistricts: ['Polana Cimento', 'Sommerschield', 'Central', 'Coop'],
  },
  BW: {
    name: 'Botswana',
    code: 'BW',
    lang: 'en',
    currency: 'BWP',
    phonePrefix: '+267',
    mobilePrefixes: ['71', '72', '74'],
    cities: ['Gaborone', 'Francistown', 'Maun'],
    sampleDistricts: ['Extension 9', 'Phakalane', 'Gaborone West', 'CBD'],
  },
  NA: {
    name: 'Namibie',
    code: 'NA',
    lang: 'en',
    currency: 'NAD',
    phonePrefix: '+264',
    mobilePrefixes: ['81', '85'],
    cities: ['Windhoek', 'Walvis Bay', 'Swakopmund'],
    sampleDistricts: ['Klein Windhoek', 'Eros', 'Ludwigsdorf', 'Avis'],
  },
  BI: {
    name: 'Burundi',
    code: 'BI',
    lang: 'fr',
    currency: 'BIF',
    phonePrefix: '+257',
    mobilePrefixes: ['79', '71', '76'],
    cities: ['Bujumbura', 'Gitega', 'Ngozi'],
    sampleDistricts: ['Rohero', 'Kiriri', 'Kinindo', 'Mutanga'],
  },
  CF: {
    name: 'Centrafrique',
    code: 'CF',
    lang: 'fr',
    currency: 'XAF',
    phonePrefix: '+236',
    mobilePrefixes: ['75', '70', '72'],
    cities: ['Bangui', 'Bimbo', 'Berbérati'],
    sampleDistricts: ['Sica', 'Fattima', 'Lakouanga', 'Boy-Rabe'],
  },
  GQ: {
    name: 'Guinée Équatoriale',
    code: 'GQ',
    lang: 'es',
    currency: 'XAF',
    phonePrefix: '+240',
    mobilePrefixes: ['222', '555'],
    cities: ['Malabo', 'Bata'],
    sampleDistricts: ['Malabo II', 'Caracolas', 'Ela Nguema'],
  },
  DJ: {
    name: 'Djibouti',
    code: 'DJ',
    lang: 'fr',
    currency: 'DJF',
    phonePrefix: '+253',
    mobilePrefixes: ['77'],
    cities: ['Djibouti-Ville', 'Ali Sabieh'],
    sampleDistricts: ['Héron', 'Marabout', 'Plateau du Serpent'],
  },
  KM: {
    name: 'Comores',
    code: 'KM',
    lang: 'fr',
    currency: 'KMF',
    phonePrefix: '+269',
    mobilePrefixes: ['32', '33'],
    cities: ['Moroni', 'Mutsamudu'],
    sampleDistricts: ['Itsandra', 'Badjanani', 'Mtsangani'],
  },
  MU: {
    name: 'Maurice',
    code: 'MU',
    lang: 'fr',
    currency: 'MUR',
    phonePrefix: '+230',
    mobilePrefixes: ['52', '57', '58'],
    cities: ['Port-Louis', 'Beau Bassin', 'Vacoas', 'Curepipe'],
    sampleDistricts: ['Ébène Cybercity', 'Floréal', 'Caudan', 'Grand Baie'],
  },
  CV: {
    name: 'Cap-Vert',
    code: 'CV',
    lang: 'pt',
    currency: 'CVE',
    phonePrefix: '+238',
    mobilePrefixes: ['99', '98', '97'],
    cities: ['Praia', 'Mindelo', 'Espargos'],
    sampleDistricts: ['Achada Santo António', 'Prainha', 'Palmarejo'],
  },
  GW: {
    name: 'Guinée-Bissau',
    code: 'GW',
    lang: 'pt',
    currency: 'XOF',
    phonePrefix: '+245',
    mobilePrefixes: ['95', '96'],
    cities: ['Bissau', 'Bafatá', 'Gabú'],
    sampleDistricts: ['Bissau Velho', 'Santa Luzia', 'Bairro Militar'],
  },
  SL: {
    name: 'Sierra Leone',
    code: 'SL',
    lang: 'en',
    currency: 'SLE',
    phonePrefix: '+232',
    mobilePrefixes: ['76', '77', '78'],
    cities: ['Freetown', 'Bo', 'Kenema'],
    sampleDistricts: ['Aberdeen', 'Lumley', 'Brookfields', 'Hill Station'],
  },
  LR: {
    name: 'Liberia',
    code: 'LR',
    lang: 'en',
    currency: 'LRD',
    phonePrefix: '+231',
    mobilePrefixes: ['77', '88'],
    cities: ['Monrovia', 'Gbarnga', 'Kakata'],
    sampleDistricts: ['Mamba Point', 'Sinkor', 'Congo Town'],
  },
  GM: {
    name: 'Gambie',
    code: 'GM',
    lang: 'en',
    currency: 'GMD',
    phonePrefix: '+220',
    mobilePrefixes: ['70', '99', '30'],
    cities: ['Banjul', 'Serekunda', 'Brikama'],
    sampleDistricts: ['Senegambia', 'Kairaba Avenue', 'Fajara', 'Bakau'],
  },
  SD: {
    name: 'Soudan',
    code: 'SD',
    lang: 'ar',
    currency: 'SDG',
    phonePrefix: '+249',
    mobilePrefixes: ['91', '92', '96'],
    cities: ['Khartoum', 'Omdurman', 'Port-Soudan'],
    sampleDistricts: ['Riyadh', 'Amirat', 'Manshiya'],
  },
  LY: {
    name: 'Libye',
    code: 'LY',
    lang: 'ar',
    currency: 'LYD',
    phonePrefix: '+218',
    mobilePrefixes: ['91', '92'],
    cities: ['Tripoli', 'Benghazi', 'Misrata'],
    sampleDistricts: ['Hay Al Andalus', 'Gargaresh', 'Ben Ashour'],
  },
  SO: {
    name: 'Somalie',
    code: 'SO',
    lang: 'so',
    currency: 'SOS',
    phonePrefix: '+252',
    mobilePrefixes: ['61', '62'],
    cities: ['Mogadiscio', 'Hargeisa', 'Kismayo'],
    sampleDistricts: ['Hodan', 'Waberi', 'Hamar Weyne'],
  },
  MW: {
    name: 'Malawi',
    code: 'MW',
    lang: 'en',
    currency: 'MWK',
    phonePrefix: '+265',
    mobilePrefixes: ['99', '88'],
    cities: ['Lilongwe', 'Blantyre', 'Mzuzu'],
    sampleDistricts: ['Area 10', 'Area 43', 'Area 12'],
  },
};

export type CountryCode = keyof typeof COUNTRIES;

// Liste ordonnée de tous les pays africains :
// - Conserve les 12 pays historiques en tête dans leur ordre d'origine
// - Complétée avec l'ensemble des pays d'Afrique
export const AFRICAN_COUNTRIES_LIST: string[] = [
  'Sénégal',
  "Côte d'Ivoire",
  'Bénin',
  'Cameroun',
  'Guinée',
  'Mali',
  'Togo',
  'Burkina Faso',
  'Gabon',
  'Congo',
  'Maroc',
  'Rwanda',
  'RD Congo',
  'Madagascar',
  'Niger',
  'Tchad',
  'Mauritanie',
  'Algérie',
  'Tunisie',
  'Nigeria',
  'Ghana',
  'Kenya',
  'Angola',
  'Afrique du Sud',
  'Égypte',
  'Éthiopie',
  'Tanzanie',
  'Ouganda',
  'Zambie',
  'Zimbabwe',
  'Mozambique',
  'Botswana',
  'Namibie',
  'Burundi',
  'Centrafrique',
  'Guinée Équatoriale',
  'Djibouti',
  'Comores',
  'Maurice',
  'Cap-Vert',
  'Guinée-Bissau',
  'Sierra Leone',
  'Liberia',
  'Gambie',
  'Soudan',
  'Libye',
  'Somalie',
  'Malawi',
];

/**
 * Retrouve la configuration détaillée d'un pays africain par son nom ou son code.
 */
export function getCountryConfig(countryQuery: string): CountryConfig {
  if (!countryQuery) return COUNTRIES.SN;

  const q = countryQuery.trim().toLowerCase();

  // 1. Recherche par code direct
  const upperCode = countryQuery.trim().toUpperCase();
  if (COUNTRIES[upperCode]) {
    return COUNTRIES[upperCode];
  }

  // 2. Recherche exacte ou partielle par nom
  for (const config of Object.values(COUNTRIES)) {
    const normName = config.name.toLowerCase();
    if (normName === q) {
      return config;
    }
  }

  // 3. Recherche par inclusions / alias courants
  if (q.includes('ivoire') || q.includes('ci')) return COUNTRIES.CI;
  if (q.includes('sénégal') || q.includes('senegal') || q.includes('sn')) return COUNTRIES.SN;
  if (q.includes('bénin') || q.includes('benin') || q.includes('bj')) return COUNTRIES.BJ;
  if (q.includes('cameroun') || q.includes('cameroon') || q.includes('cm')) return COUNTRIES.CM;
  if (q.includes('guinée équatoriale') || q.includes('equatoriale') || q.includes('gq')) return COUNTRIES.GQ;
  if (q.includes('guinée-bissau') || q.includes('bissau') || q.includes('gw')) return COUNTRIES.GW;
  if (q.includes('guinée') || q.includes('guinee') || q.includes('gn')) return COUNTRIES.GN;
  if (q.includes('mali') || q.includes('ml')) return COUNTRIES.ML;
  if (q.includes('togo') || q.includes('tg')) return COUNTRIES.TG;
  if (q.includes('burkina') || q.includes('bf')) return COUNTRIES.BF;
  if (q.includes('gabon') || q.includes('ga')) return COUNTRIES.GA;
  if (q.includes('rd congo') || q.includes('rdc') || q.includes('congo-kinshasa') || q.includes('cd')) return COUNTRIES.CD;
  if (q.includes('congo') || q.includes('cg')) return COUNTRIES.CG;
  if (q.includes('maroc') || q.includes('morocco') || q.includes('ma')) return COUNTRIES.MA;
  if (q.includes('rwanda') || q.includes('rw')) return COUNTRIES.RW;
  if (q.includes('madagascar') || q.includes('mg')) return COUNTRIES.MG;
  if (q.includes('niger') || q.includes('ne')) return COUNTRIES.NE;
  if (q.includes('tchad') || q.includes('chad') || q.includes('td')) return COUNTRIES.TD;
  if (q.includes('mauritanie') || q.includes('mr')) return COUNTRIES.MR;
  if (q.includes('algérie') || q.includes('algerie') || q.includes('dz')) return COUNTRIES.DZ;
  if (q.includes('tunisie') || q.includes('tunisia') || q.includes('tn')) return COUNTRIES.TN;
  if (q.includes('nigeria') || q.includes('ng')) return COUNTRIES.NG;
  if (q.includes('ghana') || q.includes('gh')) return COUNTRIES.GH;
  if (q.includes('kenya') || q.includes('ke')) return COUNTRIES.KE;
  if (q.includes('angola') || q.includes('ao')) return COUNTRIES.AO;
  if (q.includes('sud') || q.includes('south africa') || q.includes('za')) return COUNTRIES.ZA;
  if (q.includes('égypte') || q.includes('egypte') || q.includes('egypt') || q.includes('eg')) return COUNTRIES.EG;
  if (q.includes('éthiopie') || q.includes('ethiopie') || q.includes('et')) return COUNTRIES.ET;
  if (q.includes('tanzanie') || q.includes('tanzania') || q.includes('tz')) return COUNTRIES.TZ;
  if (q.includes('ouganda') || q.includes('uganda') || q.includes('ug')) return COUNTRIES.UG;

  // Repli par défaut sur le Sénégal
  return COUNTRIES.SN;
}

export const SECTOR_SUGGESTIONS = [
  'Quincaillerie & Matériaux',
  'Pharmacie & Santé',
  'Hôtel & Résidence',
  'Restaurant & Traiteur',
  'Cabinet comptable & Audit',
  'Clinique médicale & Dentaire',
  'École privée & Formation',
  'Agence immobilière',
  'Garage & Pièces automobiles',
  'Boulangerie & Pâtisserie',
  'Supermarché & Épicerie',
  'Salon de coiffure & Institut de beauté',
  'Entreprise BTP & Construction',
  'Fournitures & Équipements de bureau',
  'Transport & Logistique',
];
