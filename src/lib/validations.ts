// src/lib/validations.ts
import { z } from 'zod';

export const LANGUAGES = ['fr', 'en', 'pt', 'ar'] as const;
export type Language = typeof LANGUAGES[number];

export const CHANNELS = ['whatsapp', 'email', 'sms', 'linkedin'] as const;
export type Channel = typeof CHANNELS[number];

export const TONES = ['professionnel', 'chaleureux', 'direct'] as const;
export type Tone = typeof TONES[number];

export const SearchSchema = z.object({
  sector: z.string().trim().min(2, 'Le secteur doit contenir au moins 2 caractères').max(80),
  city: z.string().trim().min(2, 'La ville doit contenir au moins 2 caractères').max(80),
  district: z.string().trim().max(80).optional(),
  countryCode: z.string().length(2).transform((s) => s.toUpperCase()),
  maxResults: z.coerce.number().int().min(10).max(200),
  language: z.enum(LANGUAGES).default('fr'),
});

export const GenerateSchema = z.object({
  channel: z.enum(CHANNELS),
  language: z.enum(LANGUAGES),
  tone: z.enum(TONES).default('professionnel'),
});

export const ProfileSchema = z.object({
  full_name: z.string().trim().min(2).max(100).optional(),
  company_name: z.string().trim().min(2).max(100).optional(),
  offer_description: z.string().trim().min(10, "L'offre doit être décrite en au moins 10 caractères").max(1000),
  value_proposition: z.string().trim().max(500).optional(),
  social_proof: z.string().trim().max(500).optional(),
  signature: z.string().trim().max(200).optional(),
  default_language: z.enum(LANGUAGES).default('fr'),
  default_country: z.string().length(2).default('SN'),
});
