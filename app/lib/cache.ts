import { createHash } from 'crypto';
import { supabase } from './supabase';

/** Fields that identify a physical edition. Condition is deliberately excluded. */
const EDITION_KEYS = ['title', 'author', 'publisher', 'pub_year', 'printing_number', 'edition_label', 'isbn'];
/** Extra fields that legitimately move a price. */
const PRICE_KEYS = ['binding', 'condition_book', 'condition_jacket', 'dust_jacket', 'slipcase', 'signed', 'inscribed', 'volume_number', 'set_context'];

const norm = (v: any) =>
  v == null || v === '' ? '' :
  typeof v === 'boolean' ? (v ? '1' : '0') :
  String(v).toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim();

export function fingerprint(kind: string, book: any) {
  const keys = kind === 'valuate' ? [...EDITION_KEYS, ...PRICE_KEYS] : EDITION_KEYS;
  const basis = kind + '|' + keys.map(k => `${k}=${norm(book[k])}`).join('|');
  return createHash('sha1').update(basis).digest('hex');
}

/** Days a cached answer stays usable. Markets move; bibliography does not. */
const TTL: Record<string, number> = { valuate: 30, enrich: 180, history: 365, roster: 180 };

export async function withCache<T>(kind: string, book: any, produce: () => Promise<T>): Promise<T & { _cached?: boolean }> {
  const key = fingerprint(kind, book);
  const cutoff = new Date(Date.now() - (TTL[kind] ?? 30) * 86400_000).toISOString();
  const { data: hit } = await supabase
    .from('research_cache').select('payload, hits')
    .eq('key', key).gte('created_at', cutoff).maybeSingle();
  if (hit?.payload) {
    supabase.from('research_cache').update({ hits: (hit.hits ?? 0) + 1 }).eq('key', key).then(() => {});
    return { ...(hit.payload as any), _cached: true };
  }
  const fresh = await produce();
  if (fresh) {
    await supabase.from('research_cache')
      .upsert({ key, kind, payload: fresh as any, hits: 0, created_at: new Date().toISOString() });
  }
  return fresh as any;
}
