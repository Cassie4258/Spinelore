import { supabase } from './supabase';
export function normName(s: string) {
return (s || '')
.toLowerCase()
.replace(/\(.*?\)/g, ' ')
.replace(/\b(vol|vols|volume|volumes)\b.*$/i, ' ')
.replace(/\b\d{4}\b/g, ' ')
.replace(/\b(edition|octavo|quarto|folio|set|the|a|an|and|in|of)\b/g, ' ')
.replace(/[^a-z0-9 ]/g, ' ')
.replace(/\s+/g, ' ')
.trim();
}
/** Find an existing set whose name matches loosely, else create one. */
export async function findOrCreateSet(g: any) {
const canonical = g.publisher && g.kind !== 'multi_volume_set'
? `${g.publisher} — ${g.name}` : g.name;
const target = normName(canonical);
const { data: all } = await supabase.from('sets').select('id, name, kind, total_known');
const hit = (all ?? []).find((s: any) => {
if (s.kind && g.kind && s.kind !== g.kind) return false;
const n = normName(s.name);
return n === target || (n.length > 6 && (n.includes(target) || target.includes(n)));
});
if (hit) {
if (!hit.total_known && g.total_known) {
await supabase.from('sets').update({ total_known: g.total_known }).eq('id', hit.id);
}
return hit.id as string;
}
const { data: ns } = await supabase.from('sets').insert({
name: canonical,
kind: g.kind ?? 'publisher_series',
publisher: g.publisher ?? null,
description: g.reasoning ?? null,
total_known: g.total_known ?? null,
requires_matching: g.kind !== 'work_series',
}).select().single();
return ns?.id as string | undefined;
}
