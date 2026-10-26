// src/lib/ai/openai.ts
import { SYSTEM_PROMPT, buildPrompt, generateLocalSampleMessage } from './prompts';

export interface GenerateProspectingOptions {
  leadName: string;
  category: string;
  city: string;
  country: string;
  rating?: number;
  reviewsCount?: number;
  hasWebsite: boolean;
  companyName?: string;
  offerDescription?: string;
  channel: 'whatsapp' | 'email' | 'sms' | 'linkedin';
  language?: 'fr' | 'en' | 'pt' | 'ar';
  tone?: 'professionnel' | 'chaleureux' | 'direct';
}

export async function generateProspectingMessage(options: GenerateProspectingOptions): Promise<{
  content: string;
  source: 'openai' | 'local_fallback';
  modelUsed?: string;
  error?: string;
}> {
  const apiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY || (import.meta as any).env?.OPENAI_API_KEY;

  if (!apiKey || !apiKey.startsWith('sk-')) {
    // Clé absente : fallback immédiat haute qualité
    return {
      content: generateLocalSampleMessage({
        leadName: options.leadName,
        category: options.category,
        city: options.city,
        country: options.country,
        rating: options.rating,
        reviewsCount: options.reviewsCount,
        hasWebsite: options.hasWebsite,
        channel: options.channel,
        tone: options.tone || 'professionnel',
        sellerName: options.companyName,
        sellerOffer: options.offerDescription,
      }),
      source: 'local_fallback',
    };
  }

  const userPrompt = buildPrompt({
    leadName: options.leadName,
    category: options.category,
    city: options.city,
    country: options.country,
    rating: options.rating,
    reviewsCount: options.reviewsCount,
    hasWebsite: options.hasWebsite,
    companyName: options.companyName || 'GESLEAD Partner',
    offerDescription: options.offerDescription || 'services B2B & visibilité commerciale ciblée',
    channel: options.channel,
    language: options.language || 'fr',
    tone: options.tone || 'professionnel',
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 350,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData?.error?.message || `Erreur HTTP ${response.status}`;
      console.warn('OpenAI API Error, bascule sur le moteur local:', errMsg);

      return {
        content: generateLocalSampleMessage({
          leadName: options.leadName,
          category: options.category,
          city: options.city,
          country: options.country,
          rating: options.rating,
          reviewsCount: options.reviewsCount,
          hasWebsite: options.hasWebsite,
          channel: options.channel,
          tone: options.tone || 'professionnel',
          sellerName: options.companyName,
          sellerOffer: options.offerDescription,
        }),
        source: 'local_fallback',
        error: errMsg,
      };
    }

    const data = await response.json();
    const generatedText = data?.choices?.[0]?.message?.content?.trim();

    return {
      content: generatedText || generateLocalSampleMessage({
        leadName: options.leadName,
        category: options.category,
        city: options.city,
        country: options.country,
        rating: options.rating,
        reviewsCount: options.reviewsCount,
        hasWebsite: options.hasWebsite,
        channel: options.channel,
        tone: options.tone || 'professionnel',
        sellerName: options.companyName,
        sellerOffer: options.offerDescription,
      }),
      source: 'openai',
      modelUsed: 'gpt-4o-mini',
    };
  } catch (error: any) {
    console.warn('Exception appel OpenAI, bascule locale:', error);
    return {
      content: generateLocalSampleMessage({
        leadName: options.leadName,
        category: options.category,
        city: options.city,
        country: options.country,
        rating: options.rating,
        reviewsCount: options.reviewsCount,
        hasWebsite: options.hasWebsite,
        channel: options.channel,
        tone: options.tone || 'professionnel',
        sellerName: options.companyName,
        sellerOffer: options.offerDescription,
      }),
      source: 'local_fallback',
      error: error?.message || 'Erreur réseau',
    };
  }
}
