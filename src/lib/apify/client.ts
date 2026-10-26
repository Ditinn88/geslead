// src/lib/apify/client.ts
// Client REST natif Apify compatible 100% navigateur et serveur sans dépendances Node.js

const token =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    (import.meta.env.VITE_APIFY_TOKEN || import.meta.env.APIFY_TOKEN)) ||
  (typeof process !== 'undefined' && process.env && process.env.APIFY_TOKEN) ||
  '';

export const PLACES_ACTOR = 'compass/crawler-google-places';

export const isApifyConfigured = Boolean(token && token.trim().startsWith('apify_api_'));

/**
 * Interface d'exécution d'acteurs Apify par API REST
 */
export const apify = {
  actor(actorId: string = PLACES_ACTOR) {
    const formattedId = actorId.replace('/', '~');
    return {
      async start(inputOptions: Record<string, any> = {}, runOptions: Record<string, any> = {}) {
        const url = new URL(`https://api.apify.com/v2/acts/${formattedId}/runs`);
        url.searchParams.set('token', token);
        if (runOptions.timeout) {
          url.searchParams.set('timeout', String(runOptions.timeout));
        }

        const res = await fetch(url.toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(inputOptions),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody?.error?.message || `Erreur HTTP ${res.status} au lancement d'Apify`);
        }

        const data = await res.json();
        return data.data;
      },
    };
  },
  user() {
    return {
      async get() {
        const res = await fetch(`https://api.apify.com/v2/users/me?token=${token}`);
        if (!res.ok) {
          throw new Error(`Erreur HTTP ${res.status}`);
        }
        const data = await res.json();
        return data.data;
      },
    };
  },
};

/**
 * Valide la connexion avec l'API Apify et retourne les infos du compte
 */
export async function checkApifyConnection(): Promise<{
  connected: boolean;
  username?: string;
  email?: string;
  plan?: string;
  message: string;
}> {
  if (!token) {
    return { connected: false, message: 'Aucun token Apify configuré.' };
  }

  try {
    const res = await fetch(`https://api.apify.com/v2/users/me?token=${token}`);
    if (!res.ok) {
      return { connected: false, message: `Échec d'authentification Apify (HTTP ${res.status})` };
    }
    const data = await res.json();
    const user = data.data;
    if (user && user.username) {
      return {
        connected: true,
        username: user.username,
        email: user.email,
        plan: user.plan?.id || 'Free Tier',
        message: `Connecté à Apify (${user.username})`,
      };
    }
    return { connected: false, message: 'Réponse utilisateur Apify invalide.' };
  } catch (err) {
    return {
      connected: false,
      message: `Erreur de connexion Apify : ${(err as Error).message}`,
    };
  }
}
