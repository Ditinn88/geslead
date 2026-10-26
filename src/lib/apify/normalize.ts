// src/lib/apify/normalize.ts
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/max';

export interface ApifyPlace {
  placeId?: string;
  title?: string;
  categoryName?: string;
  address?: string;
  city?: string;
  countryCode?: string;
  phone?: string;
  phoneUnformatted?: string;
  website?: string;
  emails?: string[];
  totalScore?: number;
  reviewsCount?: number;
  url?: string;
  location?: { lat: number; lng: number };
  permanentlyClosed?: boolean;
}

export function normalizePlace(
  p: ApifyPlace,
  s: { user_id: string; city: string; country_code: string }
) {
  if (!p.placeId || !p.title || p.permanentlyClosed) return null;

  const country = (p.countryCode ?? s.country_code).toUpperCase() as CountryCode;
  const rawPhone = p.phoneUnformatted ?? p.phone ?? null;
  const phone = rawPhone ? parsePhoneNumberFromString(rawPhone, country) : undefined;
  const valid = phone?.isValid() ?? false;
  const type = valid ? phone!.getType() : undefined;

  return {
    user_id: s.user_id,
    place_id: p.placeId,
    name: p.title.trim(),
    category: p.categoryName ?? null,
    address: p.address ?? null,
    city: p.city ?? s.city,
    country_code: country,
    phone_raw: rawPhone,
    phone_e164: valid ? phone!.number : null,
    // WhatsApp functions primarily on mobile phones in Africa
    is_mobile: type ? type === 'MOBILE' || type === 'FIXED_LINE_OR_MOBILE' : null,
    website: p.website ?? null,
    email: p.emails?.[0] ?? null,
    rating: p.totalScore ?? null,
    reviews_count: p.reviewsCount ?? null,
    maps_url: p.url ?? null,
    lat: p.location?.lat ?? null,
    lng: p.location?.lng ?? null,
    raw: p,
  };
}
