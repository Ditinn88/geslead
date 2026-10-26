// src/lib/geo.ts

export const COUNTRIES = {
  SN: {
    name: 'Sénégal',
    lang: 'fr',
    currency: 'XOF',
    phonePrefix: '+221',
    cities: ['Dakar', 'Thiès', 'Saint-Louis', 'Touba', 'Mbour', 'Ziguinchor'],
    districts: {
      Dakar: ['Plateau', 'Almadies', 'Point E', 'Mermoz', 'Ngor', 'Ouakam', 'Fann', 'Yoff', 'Grand Dakar'],
    },
  },
  CI: {
    name: "Côte d'Ivoire",
    lang: 'fr',
    currency: 'XOF',
    phonePrefix: '+225',
    cities: ['Abidjan', 'Bouaké', 'Yamoussoukro', 'San-Pédro', 'Korhogo'],
    districts: {
      Abidjan: ['Plateau', 'Cocody', 'Marcory', 'Zone 4', 'Treichville', 'Yopougon', 'Riviera', 'Deux Plateaux'],
    },
  },
  CM: {
    name: 'Cameroun',
    lang: 'fr',
    currency: 'XAF',
    phonePrefix: '+237',
    cities: ['Douala', 'Yaoundé', 'Bafoussam', 'Garoua', 'Kribi'],
    districts: {
      Douala: ['Akwa', 'Bonanjo', 'Bonapriso', 'Deido', 'Bali'],
      Yaoundé: ['Bastos', 'Centre-ville', 'Omnisports'],
    },
  },
  CD: {
    name: 'RD Congo',
    lang: 'fr',
    currency: 'CDF',
    phonePrefix: '+243',
    cities: ['Kinshasa', 'Lubumbashi', 'Goma', 'Kolwezi'],
    districts: {
      Kinshasa: ['Gombe', 'Kalamu', 'Ngaliema', 'Limete'],
    },
  },
  MA: {
    name: 'Maroc',
    lang: 'fr',
    currency: 'MAD',
    phonePrefix: '+212',
    cities: ['Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Fès', 'Agadir'],
    districts: {
      Casablanca: ['Maarif', 'Gauthier', 'Anfa', 'Bourgogne', 'Sidi Maarouf'],
    },
  },
  NG: {
    name: 'Nigeria',
    lang: 'en',
    currency: 'NGN',
    phonePrefix: '+234',
    cities: ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan'],
    districts: {
      Lagos: ['Victoria Island', 'Ikoyi', 'Lekki Phase 1', 'Ikeja', 'Yaba'],
    },
  },
  GH: {
    name: 'Ghana',
    lang: 'en',
    currency: 'GHS',
    phonePrefix: '+233',
    cities: ['Accra', 'Kumasi', 'Takoradi', 'Tema'],
    districts: {
      Accra: ['Airport Residential', 'Osu', 'East Legon', 'Cantonments'],
    },
  },
  KE: {
    name: 'Kenya',
    lang: 'en',
    currency: 'KES',
    phonePrefix: '+254',
    cities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'],
    districts: {
      Nairobi: ['Westlands', 'Kilimani', 'Upper Hill', 'CBD', 'Karen'],
    },
  },
  AO: {
    name: 'Angola',
    lang: 'pt',
    currency: 'AOA',
    phonePrefix: '+244',
    cities: ['Luanda', 'Benguela', 'Huambo', 'Lubango'],
    districts: {
      Luanda: ['Ingombota', 'Maianga', 'Talatona', 'Miramar'],
    },
  },
} as const;

export type CountryCode = keyof typeof COUNTRIES;

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
