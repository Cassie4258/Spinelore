import { supabase } from './lib/supabase';
export const dynamic = 'force-dynamic';
async function getCopies() {
const { data, error } = await supabase
.from('copies')
.select(`
id, condition_book, signed, purchase_price, created_at,
editions ( publisher, pub_year, works ( title ) ),
value_estimates ( low_estimate, high_estimate, estimated_at )
`)
.order('created_at', { ascending: false });
if (error) {
console.error(error);
return [];
}
return data ?? [];
}
function formatValue(estimates: any[]) {
if (!estimates || estimates.length === 0) return null;
const latest = [...estimates].sort(
(a, b) => new Date(b.estimated_at).getTime() - new Date(a.estimated_at).getTime()
)[0];
if (latest.low_estimate == null && latest.high_estimate == null) return null;
const fmt = (n: number) => `$${Number(n).toLocaleString()}`;
if (latest.low_estimate != null && latest.high_estimate != null) {
return `${fmt(latest.low_estimate)}–${fmt(latest.high_estimate)}`;
}
return fmt(latest.low_estimate ?? latest.high_estimate);
}
export default async function Home({ searchParams }: { searchParams: { q?: string } }) {
const all = await getCopies();
const q = (searchParams.q ?? '').toLowerCase().trim();
const copies = q ? all.filter((c: any) => {
const t = (c.editions?.works?.title ?? '').toLowerCase();
const p = (c.editions?.publisher ?? '').toLowerCase();
return t.includes(q) || p.includes(q);
}) : all;
return (
<div>
<form action="/" method="get" style={{ marginBottom: '1.25rem' }}>
<input name="q" defaultValue={q} placeholder="Search the archive by title or publisher…"
style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #3a2f20', background: '#1a1410', color: '#e8dcc0', fontFamily: "'EB Garamond', serif", fontSize: '1rem', boxSizing: 'border-box', outline: 'none' }} />
</form>
<p
style={{
color: '#8a7a5c',
fontSize: '0.85rem',
letterSpacing: '0.08em',
marginBottom: '2rem',
borderBottom: '1px solid #3a2f20',
paddingBottom: '0.75rem',
}}
>
{copies.length} {copies.length === 1 ? 'VOLUME' : 'VOLUMES'}{q ? ` MATCHING “${q.toUpperCase()}”` : ' IN THE ARCHIVE'}
</p>
{copies.length === 0 && (
<div
style={{
border: '1px dashed #4a3d2c',
padding: '3rem 2rem',
textAlign: 'center',
color: '#8a7a5c',
}}
>
<p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '1.3rem', color: '#c4b490' }}>
The shelves stand empty.
</p>
<a href="/copies/new" style={{ color: '#b8923f', fontWeight: 500 }}>
Accession the first volume →
</a>
</div>
)}
<div>
{copies.map((c: any) => {
const value = formatValue(c.value_estimates);
return (
<div
key={c.id}
style={{
borderLeft: '2px solid #b8923f',
borderBottom: '1px solid #29221777',
padding: '1.1rem 0 1.1rem 1.25rem',
display: 'flex',
justifyContent: 'space-between',
alignItems: 'flex-start',
gap: '1rem',
}}
>
<div>
<a href={`/copies/${c.id}`} style={{
fontFamily: "'Cormorant Garamond', serif",
fontSize: '1.35rem',
fontWeight: 500,
color: '#e8dcc0',
textDecoration: 'none',
}}>
{c.editions?.works?.title ?? 'Untitled'}
</a>
<div style={{ color: '#8a7a5c', fontSize: '0.9rem', marginTop: '0.3rem' }}>
{[c.editions?.publisher, c.editions?.pub_year].filter(Boolean).join(' · ')}
{c.signed && '  ·  signed'}
{c.condition_book && `  ·  ${c.condition_book}`}
</div>
</div>
<div
style={{
fontFamily: "'Cormorant Garamond', serif",
fontSize: '1.05rem',
color: value ? '#c4b490' : '#5c5040',
whiteSpace: 'nowrap',
paddingRight: '0.25rem',
}}
>
{value ?? '—'}
</div>
</div>
);
})}
</div>
</div>
);
}
