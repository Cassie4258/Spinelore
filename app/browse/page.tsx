import { supabase } from '../lib/supabase';
import { KIND_LABEL } from '../lib/groupings';
export const dynamic = 'force-dynamic';
async function getCopies(): Promise<any[]> {
const { data, error } = await supabase
.from('copies')
.select(`
id, signed, condition_book, created_at,
editions ( publisher, pub_year, works ( title, genre,
work_contributors ( role, authors ( name ) ),
set_members ( sequence_number, sets ( name, kind ) ) ) ),
value_estimates ( low_estimate, high_estimate, estimated_at )
`)
.order('created_at', { ascending: false });
if (error) { console.error('browse query error', error); return []; }
return data ?? [];
}
function contributor(c: any, role: string) {
const list = c.editions?.works?.work_contributors ?? [];
const hit = list.find((x: any) => x.role === role);
return hit?.authors?.name ?? null;
}
function normPub(p: any) {
if (!p) return null;
return String(p).split(',')[0].replace(/^the\s+/i, '').trim();
}
function latestValue(estimates: any[]) {
if (!estimates || estimates.length === 0) return null;
const l = [...estimates].sort((a, b) => new Date(b.estimated_at).getTime() - new Date(a.estimated_at).getTime())[0];
if (l.low_estimate == null && l.high_estimate == null) return null;
const fmt = (n: number) => `$${Number(n).toLocaleString()}`;
if (l.low_estimate != null && l.high_estimate != null) return `${fmt(l.low_estimate)}–${fmt(l.high_estimate)}`;
return fmt(l.low_estimate ?? l.high_estimate);
}
const FACETS: Record<string, { label: string; keys: (c: any) => string[] }> = {
author: { label: 'Author', keys: c => [contributor(c, 'author') ?? 'Unattributed'] },
illustrator: { label: 'Illustrator', keys: c => [contributor(c, 'illustrator') ?? 'No illustrator recorded'] },
publisher: { label: 'Publisher', keys: c => [normPub(c.editions?.publisher) ?? 'Unknown publisher'] },
genre: { label: 'Genre', keys: c => [c.editions?.works?.genre || 'Not yet categorised'] },
series: { label: 'Sets & series', keys: c => {
const sm = c.editions?.works?.set_members ?? [];
const names = sm.map((m: any) => m.sets?.name).filter(Boolean);
return names.length ? names : ['Not part of a set or series'];
} },
kind: { label: 'Type', keys: c => {
const sm = c.editions?.works?.set_members ?? [];
const kinds = sm.map((m: any) => KIND_LABEL[m.sets?.kind]).filter(Boolean);
return kinds.length ? Array.from(new Set(kinds)) as string[] : ['Standalone'];
} },
decade: { label: 'Decade', keys: c => {
const y = c.editions?.pub_year;
return [y ? `${Math.floor(y / 10) * 10}s` : 'Undated'];
} },
condition: { label: 'Condition', keys: c => [c.condition_book || 'Ungraded'] },
signed: { label: 'Signed', keys: c => [c.signed ? 'Signed' : 'Unsigned'] },
};
export default async function Browse({ searchParams }: { searchParams: { by?: string; value?: string } }) {
const copies = await getCopies();
const by = (searchParams.by && FACETS[searchParams.by]) ? searchParams.by : 'author';
const active = searchParams.value;
const facet = FACETS[by];
const groups: Record<string, any[]> = {};
for (const c of copies) for (const k of facet.keys(c)) (groups[k] ||= []).push(c);
const keys = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length || a.localeCompare(b));
const shown = active ? (groups[active] ?? []) : null;
const tab = (on: boolean) => ({
display: 'inline-block', padding: '0.35rem 0.8rem', marginRight: '0.4rem', marginBottom: '0.4rem',
border: `1px solid ${on ? '#b8923f' : '#3a2f20'}`, color: on ? '#15100b' : '#c4b490',
background: on ? '#b8923f' : 'transparent', textDecoration: 'none', fontSize: '0.8rem', letterSpacing: '0.03em',
});
return (
<div>
<h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 500, fontSize: '1.8rem', color: '#e8dcc0', margin: '0 0 0.35rem' }}>
Browse the Archive
</h2>
<p style={{ color: '#8a7a5c', fontSize: '0.85rem', margin: '0 0 1.5rem' }}>
{copies.length} {copies.length === 1 ? 'volume' : 'volumes'} · choose a lens, then a category
</p>
<div style={{ marginBottom: '1.5rem' }}>
{Object.entries(FACETS).map(([k, f]) => (
<a key={k} href={`/browse?by=${k}`} style={{ ...tab(by === k), fontWeight: by === k ? 600 : 400 }}>{f.label}</a>
))}
</div>
{copies.length === 0 && <p style={{ color: '#8a7a5c' }}>The archive is empty.</p>}
{copies.length > 0 && (
<div style={{ borderTop: '1px solid #3a2f20', paddingTop: '1.25rem' }}>
<div style={{ fontSize: '0.7rem', color: '#8a7a5c', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
{facet.label.toUpperCase()} — {keys.length} {keys.length === 1 ? 'CATEGORY' : 'CATEGORIES'}
</div>
{keys.map(k => {
const on = active === k;
return (
<a key={k} href={on ? `/browse?by=${by}` : `/browse?by=${by}&value=${encodeURIComponent(k)}`}
style={{ ...tab(on), display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
padding: '0.6rem 0.9rem', marginRight: 0, marginBottom: '0.4rem', fontSize: '0.95rem',
fontFamily: "'Cormorant Garamond', serif" }}>
<span>{k}</span>
<span style={{ fontSize: '0.8rem', opacity: 0.75, marginLeft: '1rem' }}>{groups[k].length}</span>
</a>
);
})}
</div>
)}
{shown && (
<div style={{ marginTop: '2rem', borderTop: '1px solid #3a2f20', paddingTop: '1.25rem' }}>
<div style={{ fontSize: '0.7rem', color: '#8a7a5c', letterSpacing: '0.1em', marginBottom: '1rem' }}>
{shown.length} {shown.length === 1 ? 'VOLUME' : 'VOLUMES'} IN “{active?.toUpperCase()}”
</div>
{shown.map((c: any) => (
<div key={c.id} style={{ borderLeft: '2px solid #b8923f', borderBottom: '1px solid #29221777',
padding: '1rem 0 1rem 1.25rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
<div>
<a href={`/copies/${c.id}`} style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', color: '#e8dcc0', textDecoration: 'none' }}>
{c.editions?.works?.title ?? 'Untitled'}
</a>
<div style={{ color: '#8a7a5c', fontSize: '0.85rem', marginTop: '0.2rem' }}>
{[contributor(c, 'author'), normPub(c.editions?.publisher), c.editions?.pub_year].filter(Boolean).join(' · ')}
{c.signed && '  ·  signed'}
</div>
</div>
<div style={{ fontFamily: "'Cormorant Garamond', serif", color: '#c4b490', whiteSpace: 'nowrap' }}>
{latestValue(c.value_estimates) ?? '—'}
</div>
</div>
))}
</div>
)}
</div>
);
}
