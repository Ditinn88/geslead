export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          company_name: string | null
          offer_description: string | null
          value_proposition: string | null
          social_proof: string | null
          signature: string | null
          default_language: string
          default_country: string
          plan: string
          lead_credits: number
          ai_credits: number
          credits: number
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          company_name?: string | null
          offer_description?: string | null
          value_proposition?: string | null
          social_proof?: string | null
          signature?: string | null
          default_language?: string
          default_country?: string
          plan?: string
          lead_credits?: number
          ai_credits?: number
          credits?: number
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          company_name?: string | null
          offer_description?: string | null
          value_proposition?: string | null
          social_proof?: string | null
          signature?: string | null
          default_language?: string
          default_country?: string
          plan?: string
          lead_credits?: number
          ai_credits?: number
          credits?: number
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          payer_id: string
          provider: string
          amount_total: number
          currency: string
          status: 'pending' | 'completed' | 'failed' | 'expired' | 'refunded'
          payment_type: string
          reference_id: string
          credits: number
          provider_transaction_id: string | null
          checkout_url: string | null
          webhook_received_at: string | null
          completed_at: string | null
          failure_reason: string | null
          customer_email: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        // Écritures réservées aux Edge Functions (clé secrète)
        Insert: never
        Update: never
      }
      searches: {
        Row: {
          id: string
          user_id: string
          sector: string
          city: string
          district: string | null
          country_code: string
          language: string
          max_results: number
          status: 'pending' | 'running' | 'ingesting' | 'succeeded' | 'failed'
          apify_run_id: string | null
          results_count: number
          error: string | null
          created_at: string
          finished_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          sector: string
          city: string
          district?: string | null
          country_code: string
          language?: string
          max_results: number
          status?: 'pending' | 'running' | 'ingesting' | 'succeeded' | 'failed'
          apify_run_id?: string | null
          results_count?: number
          error?: string | null
          created_at?: string
          finished_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          sector?: string
          city?: string
          district?: string | null
          country_code?: string
          language?: string
          max_results?: number
          status?: 'pending' | 'running' | 'ingesting' | 'succeeded' | 'failed'
          apify_run_id?: string | null
          results_count?: number
          error?: string | null
          created_at?: string
          finished_at?: string | null
        }
      }
      leads: {
        Row: {
          id: string
          user_id: string
          place_id: string
          name: string
          category: string | null
          address: string | null
          city: string | null
          country_code: string | null
          phone_raw: string | null
          phone_e164: string | null
          is_mobile: boolean | null
          website: string | null
          email: string | null
          rating: number | null
          reviews_count: number | null
          maps_url: string | null
          lat: number | null
          lng: number | null
          status: 'new' | 'contacted' | 'replied' | 'won' | 'lost'
          notes: string | null
          raw: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          place_id: string
          name: string
          category?: string | null
          address?: string | null
          city?: string | null
          country_code?: string | null
          phone_raw?: string | null
          phone_e164?: string | null
          is_mobile?: boolean | null
          website?: string | null
          email?: string | null
          rating?: number | null
          reviews_count?: number | null
          maps_url?: string | null
          lat?: number | null
          lng?: number | null
          status?: 'new' | 'contacted' | 'replied' | 'won' | 'lost'
          notes?: string | null
          raw?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          place_id?: string
          name?: string
          category?: string | null
          address?: string | null
          city?: string | null
          country_code?: string | null
          phone_raw?: string | null
          phone_e164?: string | null
          is_mobile?: boolean | null
          website?: string | null
          email?: string | null
          rating?: number | null
          reviews_count?: number | null
          maps_url?: string | null
          lat?: number | null
          lng?: number | null
          status?: 'new' | 'contacted' | 'replied' | 'won' | 'lost'
          notes?: string | null
          raw?: Json | null
          created_at?: string
        }
      }
      search_leads: {
        Row: {
          search_id: string
          lead_id: string
        }
        Insert: {
          search_id: string
          lead_id: string
        }
        Update: {
          search_id?: string
          lead_id?: string
        }
      }
      messages: {
        Row: {
          id: string
          user_id: string
          lead_id: string
          channel: 'whatsapp' | 'email' | 'sms' | 'linkedin'
          language: string
          tone: string | null
          subject: string | null
          body: string
          model: string | null
          input_tokens: number | null
          output_tokens: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lead_id: string
          channel: 'whatsapp' | 'email' | 'sms' | 'linkedin'
          language: string
          tone?: string | null
          subject?: string | null
          body: string
          model?: string | null
          input_tokens?: number | null
          output_tokens?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lead_id?: string
          channel?: 'whatsapp' | 'email' | 'sms' | 'linkedin'
          language?: string
          tone?: string | null
          subject?: string | null
          body?: string
          model?: string | null
          input_tokens?: number | null
          output_tokens?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      leads_by_search: {
        Row: {
          search_id: string
          id: string
          name: string
          category: string | null
          address: string | null
          city: string | null
          country_code: string | null
          phone_e164: string | null
          is_mobile: boolean | null
          website: string | null
          email: string | null
          rating: number | null
          reviews_count: number | null
          maps_url: string | null
          status: string
          notes: string | null
          created_at: string
          last_message_channel: 'whatsapp' | 'email' | 'sms' | 'linkedin' | null
          last_message_subject: string | null
          last_message: string | null
        }
      }
    }
    Functions: {
      consume_credits: {
        Args: { p_kind: string; p_amount: number }
        Returns: boolean
      }
      refund_credits: {
        Args: { p_user: string; p_kind: string; p_amount: number }
        Returns: void
      }
      spend_search_credits: {
        Args: Record<string, never>
        Returns: number
      }
    }
  }
}
