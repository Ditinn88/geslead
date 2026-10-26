// src/lib/ai/prompts.ts

export const SYSTEM_PROMPT = `Tu es un Directeur Commercial B2B d'élite et Copywriter Stratégique, expert reconnu des marchés d'Afrique francophone (Sénégal, Côte d'Ivoire, Bénin, Cameroun, Guinée, Mali, Togo, etc.).
Tu rédiges des messages de prospection ultra-personnalisés, percutants et à très fort taux de conversion, envoyés par un partenaire d'affaires aux entreprises référencées sur Google Maps.

PRINCIPES PSYCHOLOGIQUES & COMMERCIAUX :
1. ACCROCHE PERSONNALISÉE (Pattern Interrupt) :
   - Mentionne immédiatement le nom exact de l'établissement et sa ville/quartier (ex: Cotonou, Thiès, Dakar, Abidjan).
   - Pas de formule générique creuse ni d'introduction banale ("J'espère que vous allez bien", "Je me permets de vous contacter").
   - Reconnais leur notoriété locale ou l'activité concrète de l'établissement.

2. DIAGNOSTIC DU MANQUE À GAGNER (The Pain / Opportunity) :
   - Si SANS SITE WEB : Souligne poliment que 80% des clients locaux à fort pouvoir d'achat cherchent des services sur leur smartphone via Google Maps. Sans lien de conversion ou catalogue mobile direct, ces clients repartent chez des concurrents.
   - Si FORTE NOTE (> 4.5★) : Complimente la confiance de leurs clients ({rating}★ avec {reviewsCount} avis), et montre comment monétiser cette réputation pour doubler leurs commandes directes.
   - Si NOTE N/A ou PEU D'AVIS : Montre l'opportunité d'automatiser la capture d'avis 5 étoiles pour se hisser au sommet des résultats de recherche locaux.
   - Si SITE EXISTANT : Propose d'éliminer les déperditions de trafic mobile en y greffant un tunnel d'engagement instantané WhatsApp.

3. PROPOSITION DE VALEUR LOCALE (Adaptée au contexte africain) :
   - Le vendeur propose des solutions concrètes : tunnels de conversion WhatsApp, catalogues interactifs, captation de prospects qualifiés locaux sans complexité technique.
   - Mets en avant la simplicité et le retour sur investissement rapide.

4. APPEL À L'ACTION (CTA) À TRÈS FAIBLE FRICTION :
   - En Afrique B2B, la vente agressive rebute. Propose une étape gratuite et sans engagement :
     * WhatsApp : "Puis-je vous envoyer une courte vidéo démo de 60 secondes directement ici ?" ou "Seriez-vous ouvert à un rapide échange de 5 minutes ce jeudi matin ?"
     * Email : Proposition d'un point d'étape de 5-10 minutes cette semaine.
     * SMS : Invitation directe et polie à répondre par "OUI" ou à échanger 5 min.

CONTRAINTES STRICTES :
- Langue : Français soigné, vouvoiement obligatoire, respectueux de l'étiquette des affaires en Afrique.
- Aucune invention de données imaginaires. Utilise fidèlement les données du prospect.
- Réponds UNIQUEMENT avec le texte final du message, sans préambule, sans métadonnées et sans guillemets.`;

export function buildPrompt(args: {
  leadName: string;
  category: string;
  city: string;
  country: string;
  rating?: number;
  reviewsCount?: number;
  hasWebsite: boolean;
  companyName: string;
  offerDescription: string;
  channel: 'whatsapp' | 'email' | 'sms' | 'linkedin';
  language?: 'fr' | 'en' | 'pt' | 'ar';
  tone?: 'professionnel' | 'chaleureux' | 'direct';
}) {
  const websiteStatus = args.hasWebsite
    ? "Possède un site internet répertorié"
    : "AUCUN site web (manque à gagner critique, opportunité de catalogue WhatsApp direct)";

  const socialProof = args.rating && args.rating > 0
    ? `Note Google Maps : ${args.rating}/5 basée sur ${args.reviewsCount || 0} avis vérifiés`
    : "Aucune note Google renseignée (opportunité de collecte d'avis)";

  return `<contexte_vendeur>
Partenaire : ${args.companyName || 'GESLEAD Partner'}
Expertise : ${args.offerDescription || 'Génération de prospects qualifiés & acquisition client directe sur WhatsApp'}
</contexte_vendeur>

<donnees_prospect>
Établissement : ${args.leadName}
Secteur / Activité : ${args.category || 'Service & Commerce'}
Localisation : ${args.city}, ${args.country}
Présence Digitale : ${websiteStatus}
Réputation Google : ${socialProof}
</donnees_prospect>

<directives_redaction>
Canal : ${args.channel}
Tonalité : ${args.tone || 'professionnel'}
Mission : Rédige une accroche commerciale de haute précision qui capte l'attention du dirigeant, démontre une réelle compréhension de son activité à ${args.city}, et déclenche une réponse spontanée.
</directives_redaction>`;
}

/**
 * Moteur de rédaction B2B haute conversion pour simulation instantanée et fallback robuste
 */
export function generateLocalSampleMessage(args: {
  leadName: string;
  category: string;
  city: string;
  country: string;
  rating?: number;
  reviewsCount?: number;
  hasWebsite: boolean;
  channel: 'whatsapp' | 'email' | 'sms' | 'linkedin';
  tone?: 'professionnel' | 'chaleureux' | 'direct';
  sellerName?: string;
  sellerOffer?: string;
}): string {
  const seller = args.sellerName || 'GESLEAD Partner';
  const city = args.city || 'votre ville';
  const category = (args.category || 'établissement').toLowerCase();
  const leadName = args.leadName;
  const ratingText = args.rating && args.rating > 0 ? `${args.rating}★` : null;
  const reviewsText = args.reviewsCount && args.reviewsCount > 0 ? `${args.reviewsCount} avis clients` : null;

  // 1. CANAL WHATSAPP (Format conversationnel direct à forte conversion)
  if (args.channel === 'whatsapp') {
    if (args.tone === 'chaleureux') {
      if (!args.hasWebsite) {
        return `Bonjour à l'équipe de ${leadName} ! 🤝

Je vous contacte car j'ai remarqué votre excellent travail en tant que ${category} à ${city}${ratingText ? ` (${ratingText} sur Google Maps)` : ''}.

En observant votre fiche locale, j'ai vu que vous n'aviez pas encore de site web ou de catalogue officiel rattaché à votre numéro. À ${city}, énormément de clients recherchent vos services sur smartphone et souhaitent commander ou prendre rendez-vous immédiatement sur WhatsApp.

Chez ${seller}, nous aidons les professionnels locaux à installer un canal de réservation WhatsApp direct qui double les demandes sans effort technique.

Seriez-vous ouvert à ce que je vous partage une courte vidéo de 60 secondes pour vous montrer le résultat ?

Bien chaleureusement,
${seller}`;
      } else {
        return `Bonjour à vous, équipe de ${leadName} ! 🤝

Félicitations pour la réputation remarquable de votre établissement à ${city}${ratingText ? ` avec une belle note de ${ratingText}` : ''} !

Votre site internet est une excellente vitrine, mais nous remarquons qu'à ${city}, près de 75% des visiteurs mobiles quittent les sites sans appeler s'ils n'ont pas de lien d'échange direct sur WhatsApp.

Nous accompagnons les ${category}s de la région pour ajouter un déclencheur WhatsApp intelligent qui convertit les simples visiteurs en clients payants.

Auriez-vous 5 minutes ce jeudi pour en discuter en toute simplicité ?

Bien à vous,
${seller}`;
      }
    }

    if (args.tone === 'direct') {
      if (!args.hasWebsite) {
        return `Bonjour ${leadName}.

Constat rapide sur votre présence à ${city} : votre fiche Google Maps génère de l'intérêt${ratingText ? ` (${ratingText})` : ''}, mais l'absence de vitrine web ou de catalogue mobile vous fait perdre des dizaines de clients chaque semaine au profit de concurrents directs.

Nous déployons pour les ${category}s un système clé en main connecté à WhatsApp pour capturer et convertir ces demandes locales en 48 heures chrono.

Avez-vous 3 minutes demain pour un point téléphonique rapide sur votre potentiel de croissance ?

${seller}`;
      } else {
        return `Bonjour ${leadName}.

Votre établissement est très bien noté à ${city}${ratingText ? ` (${ratingText})` : ''}. Pourtant, votre trafic web actuel pourrait générer 2 à 3 fois plus de rendez-vous qualifiés grâce à l'intégration d'un tunnel de conversion direct sur WhatsApp.

Nous aidons les ${category}s à automatiser leurs prises de contact locales.

Disponible jeudi à 11h pour un appel de 5 minutes ?

${seller}`;
      }
    }

    // Tonalité Professionnelle par défaut
    if (!args.hasWebsite) {
      return `Bonjour,

En analysant le secteur des ${category}s à ${city}, j'ai remarqué la forte notoriété de ${leadName}${ratingText ? ` (${ratingText} sur Google)` : ''}.

Cependant, votre fiche ne dispose pas encore de vitrine digitale rattachée. Aujourd'hui, la majorité des décideurs et particuliers de ${city} consultent Google Maps sur smartphone et privilégient les établissements offrant un catalogue interactif WhatsApp.

Nous accompagnons les entreprises locales pour transformer cette visibilité en flux régulier de clients qualifiés, sans frais publicitaires superflus.

Seriez-vous disposé à ce que je vous transmette une brève présentation vidéo de 90 secondes ?

Bien cordialement,
Direction Commerciale · ${seller}`;
    } else {
      return `Bonjour,

Je me permets de vous contacter suite à la consultation de la fiche de ${leadName} à ${city}. Votre réputation${ratingText ? ` (${ratingText} avec ${reviewsText || 'd’excellents retours'})` : ''} démontre la qualité de vos prestations.

Nous avons développé une solution dédiée aux ${category}s permettant de connecter directement vos visiteurs web à votre ligne WhatsApp pour accélérer les prises de décisions et éliminer les abandons.

Seriez-vous disponible pour un court échange de 5 minutes cette semaine afin d'évaluer la pertinence de ce dispositif pour votre activité ?

Sincères salutations,
${seller}`;
    }
  }

  // 2. CANAL EMAIL (Format exécutif avec objet percutant)
  if (args.channel === 'email') {
    return `OBJET : Opportunité de développement commercial pour ${leadName} à ${city}

Bonjour,

En effectuant une veille sur les acteurs majeurs du secteur ${category} à ${city}, j'ai été particulièrement attentif aux retours clients positifs attribués à ${leadName}${ratingText ? ` (${ratingText} sur Google Maps)` : ''}.

${!args.hasWebsite
  ? "Un point stratégique a toutefois retenu mon attention : votre établissement n'a pas encore de vitrine web ou de catalogue mobile rattaché, ce qui laisse le champ libre aux concurrents de la zone lors des recherches sur smartphone."
  : "Toutefois, la majorité des flux digitaux mobiles à destination de votre site gagneraient à être convertis directement vers votre canal d'affaires WhatsApp pour sécuriser les prises de contact."}

Chez ${seller}, nous concevons des dispositifs d'acquisition locale qui permettent aux entreprises leaders de rentabiliser immédiatement leur référencement.

Seriez-vous ouvert à un rapide échange téléphonique de 10 minutes mardi ou jeudi prochain pour faire le point sur vos priorités commerciales du trimestre ?

Restant à votre entière disposition,

Sincères salutations,

L'équipe commerciale · ${seller}
Spécialiste de la prospection locale & WhatsApp Business`;
  }

  // 3. CANAL SMS (Court, respectueux et percutant)
  if (args.channel === 'sms') {
    return `Bonjour ${leadName}. Vu votre belle réputation à ${city}${ratingText ? ` (${ratingText})` : ''}, nous aidons les ${category}s locaux à doubler leurs demandes clients via WhatsApp. Échange de 5 min ce jeudi ? ${seller}`;
  }

  // 4. CANAL LINKEDIN
  return `Bonjour, j'ai découvert l'activité de ${leadName} à ${city}${ratingText ? ` (${ratingText} sur Google)` : ''}. Nous accompagnons les décideurs de votre secteur pour dynamiser leur acquisition client par WhatsApp. Au plaisir d'échanger sur vos enjeux récents !`;
}
