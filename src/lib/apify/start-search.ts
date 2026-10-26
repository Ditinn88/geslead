// src/lib/apify/start-search.ts
import { apify, PLACES_ACTOR } from './client';

export interface SearchConfig {
  sector: string;
  city: string;
  district?: string | null;
  country_code: string;
  language?: string;
  max_results: number;
}

export async function startPlacesRun(s: SearchConfig, webhookUrl?: string) {
  const locationQuery = [s.district, s.city, s.country_code].filter(Boolean).join(', ');

  const inputOptions: Record<string, any> = {
    searchStringsArray: [s.sector],
    locationQuery,
    maxCrawledPlacesPerSearch: s.max_results,
    language: s.language || 'fr',
    skipClosedPlaces: true,
    maxReviews: 0,
    maxImages: 0,
    scrapeContacts: false,
  };

  const runOptions: Record<string, any> = {
    timeout: 900,
  };

  if (webhookUrl) {
    runOptions.webhooks = [
      {
        eventTypes: ['ACTOR.RUN.SUCCEEDED', 'ACTOR.RUN.FAILED', 'ACTOR.RUN.TIMED_OUT', 'ACTOR.RUN.ABORTED'],
        requestUrl: webhookUrl,
      },
    ];
  }

  return apify.actor(PLACES_ACTOR).start(inputOptions, runOptions);
}
