// src/lib/billing/creator.ts
// Gestion de l'accès Créateur / Administrateur pour l'utilisation gratuite et illimitée de GESLEAD

export const CREATOR_STORAGE_KEY = 'geslead_creator_mode_active';
export const CREATOR_PASSCODE = 'GESLEAD-VIP';

// Liste d'emails ou motifs reconnus automatiquement comme créateurs/admins
export const DEFAULT_CREATOR_EMAILS = [
  'ingdiallo88@gmail.com',
  'admin@geslead.com',
  'creator@geslead.com',
  'contact@geslead.com',
  'ditinn@geslead.com',
];

/**
 * Détermine si le mode créateur est activé pour l'utilisateur courant.
 */
export function checkIsCreator(user?: { email?: string | null; user_metadata?: Record<string, any>; plan?: string } | null): boolean {
  // 1. Activation manuelle persistée en localStorage
  try {
    if (typeof window !== 'undefined' && localStorage.getItem(CREATOR_STORAGE_KEY) === 'true') {
      return true;
    }
  } catch {}

  // 2. Variable d'environnement VITE_CREATOR_EMAIL
  const envCreatorEmail = typeof import.meta !== 'undefined' && import.meta.env?.VITE_CREATOR_EMAIL;
  if (user?.email && envCreatorEmail && user.email.toLowerCase().trim() === String(envCreatorEmail).toLowerCase().trim()) {
    return true;
  }

  // 3. Email dans la liste des créateurs ou contenant 'creator'/'admin'
  if (user?.email) {
    const emailLower = user.email.toLowerCase().trim();
    if (DEFAULT_CREATOR_EMAILS.some((e) => emailLower === e.toLowerCase())) {
      return true;
    }
    if (emailLower.includes('creator') || emailLower.startsWith('admin@')) {
      return true;
    }
  }

  // 4. Métadonnées utilisateur Supabase ou plan en base
  if (user?.user_metadata?.is_creator === true || user?.plan === 'creator' || user?.plan === 'admin') {
    return true;
  }

  return false;
}

/**
 * Active ou désactive le mode créateur dans le navigateur.
 */
export function setCreatorMode(enabled: boolean): void {
  try {
    if (typeof window !== 'undefined') {
      if (enabled) {
        localStorage.setItem(CREATOR_STORAGE_KEY, 'true');
      } else {
        localStorage.removeItem(CREATOR_STORAGE_KEY);
      }
    }
  } catch {}
}
