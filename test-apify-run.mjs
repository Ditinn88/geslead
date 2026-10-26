import { ApifyClient } from 'apify-client';
import { parsePhoneNumberFromString } from 'libphonenumber-js/max';

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN || '',
});

async function runTest() {
  console.log('🚀 Démarrage du scraping réel Apify sur Google Maps...');
  console.log('📍 Cible : Dentistes à Abidjan, Côte d\'Ivoire (Limite : 2 résultats)');

  const run = await client.actor('compass/crawler-google-places').call(
    {
      searchStringsArray: ['dentiste'],
      locationQuery: 'Abidjan, Côte d\'Ivoire',
      maxCrawledPlacesPerSearch: 2,
      language: 'fr',
      skipClosedPlaces: true,
      maxReviews: 0,
      maxImages: 0,
      scrapeContacts: false,
    },
    {
      timeout: 180, // 3 minutes max
    }
  );

  console.log(`✅ Run terminé avec statut : ${run.status}`);
  console.log(`📦 Dataset ID : ${run.defaultDatasetId}`);

  const { items } = await client.dataset(run.defaultDatasetId).listItems({
    limit: 2,
  });

  console.log(`\n📋 Résultats extraits (${items.length}) :`);

  items.forEach((p, idx) => {
    const rawPhone = p.phoneUnformatted || p.phone || 'Non renseigné';
    const phone = rawPhone !== 'Non renseigné' ? parsePhoneNumberFromString(rawPhone, 'CI') : null;
    const isMobile = phone ? (phone.getType() === 'MOBILE' || phone.getType() === 'FIXED_LINE_OR_MOBILE') : false;

    console.log(`\n--- DENTISTE #${idx + 1} ---`);
    console.log(`Nom : ${p.title}`);
    console.log(`Catégorie : ${p.categoryName || 'Cabinet dentaire'}`);
    console.log(`Adresse : ${p.address || p.street || 'Abidjan'}`);
    console.log(`Téléphone Brut : ${rawPhone}`);
    console.log(`Téléphone E.164 : ${phone?.number || 'Non normalisé'}`);
    console.log(`Compatible WhatsApp (Mobile) : ${isMobile ? 'OUI (Direct wa.me)' : 'NON (Ligne fixe ou absent)'}`);
    console.log(`Site Web : ${p.website || 'AUCUN SITE WEB (Forte opportunité)'}`);
    console.log(`Note Google : ${p.totalScore ? p.totalScore + ' ★' : 'Pas de note'} (${p.reviewsCount || 0} avis)`);
    console.log(`Google Maps URL : ${p.url || 'Non disponible'}`);
  });
}

runTest().catch((err) => {
  console.error('❌ Erreur lors du run Apify :', err.message);
  process.exit(1);
});
