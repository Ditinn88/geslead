// src/lib/apify/ingest-run.ts
import { apify } from './client';
import { normalizePlace, type ApifyPlace } from './normalize';
import { supabase } from '../supabase/client';

const TERMINAL_STATUSES = ['SUCCEEDED', 'FAILED', 'TIMED-OUT', 'ABORTED'];

export async function ingestRun(runId: string, searchMeta: { id: string; user_id: string; city: string; country_code: string; max_results: number }) {
  // 1. Fetch latest run state directly from Apify
  const run = await apify.run(runId).get();
  if (!run || !TERMINAL_STATUSES.includes(run.status)) {
    return { status: run?.status || 'RUNNING', count: 0 };
  }

  if (run.status !== 'SUCCEEDED') {
    if (supabase) {
      await supabase.from('searches').update({
        status: 'failed',
        error: run.status,
        finished_at: new Date().toISOString()
      }).eq('id', searchMeta.id);
    }
    return { status: run.status, count: 0 };
  }

  // 2. Fetch items from default dataset
  const { items } = await apify
    .dataset(run.defaultDatasetId)
    .listItems({ clean: true, limit: searchMeta.max_results });

  const rows = (items as ApifyPlace[])
    .map((p) => normalizePlace(p, searchMeta))
    .filter((r): r is NonNullable<typeof r> => r !== null);

  // Deduplicate place_id
  const uniqueLeads = [...new Map(rows.map((r) => [r.place_id, r])).values()];

  let count = 0;
  if (uniqueLeads.length && supabase) {
    const { data: leads, error } = await supabase
      .from('leads')
      .upsert(uniqueLeads, { onConflict: 'user_id,place_id' })
      .select('id');

    if (!error && leads) {
      const searchLeadRows = leads.map((l) => ({
        search_id: searchMeta.id,
        lead_id: l.id,
      }));

      await supabase.from('search_leads').upsert(searchLeadRows, {
        onConflict: 'search_id,lead_id',
        ignoreDuplicates: true,
      });

      count = leads.length;
    }

    await supabase.from('searches').update({
      status: 'succeeded',
      results_count: count,
      finished_at: new Date().toISOString()
    }).eq('id', searchMeta.id);
  }

  return { status: 'succeeded', count, items: uniqueLeads };
}
