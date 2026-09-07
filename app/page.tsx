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
export default async function Home() {
const copies = await getCopies();
return (
<div>
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
{copies.length} {copies.length === 1 ? 'VOLUME' : 'VOLUMES'} IN THE ARCHIVE
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
<div
style={{
fontFamily: "'Cormorant Garamond', serif",
fontSize: '1.35rem',
fontWeight: 500,
color: '#e8dcc0',
}}
>
{c.editions?.works?.title ?? 'Untitled'}
</div>
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
