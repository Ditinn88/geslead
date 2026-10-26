// src/lib/whatsapp.ts

/**
 * Format a phone number into an official WhatsApp click-to-chat URL.
 * Cleans non-digits, preserves international country code.
 */
export function whatsappUrl(phoneE164: string, message?: string): string {
  const cleanNumber = phoneE164.replace(/\D/g, '');
  if (!cleanNumber) return '';
  return `https://wa.me/${cleanNumber}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}

/**
 * Formats a raw phone string for visual display.
 */
export function formatDisplayPhone(phoneE164: string | null, phoneRaw: string | null): string {
  return phoneE164 || phoneRaw || 'Non renseigné';
}
