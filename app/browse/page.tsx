import { supabase } from '../lib/supabase';
export const dynamic = 'force-dynamic';
async function getCopies(): Promise<any[]> {
const { data, error } = await supabase
.from('copies')
.select(`
id, signed, condition_book,
editions ( publisher, pub_year, works ( title, genre,
work_contributors ( role, authors ( name ) ) ) ),
value_estimates ( low_estimate, high_estimate, estimated_at ),
set_members ( sequence_number, sets ( name ) )
`)
.order('created_at', { ascending: false });
if (error) { console.error(error); return []; }
return data ?? [];
}
function authorName(c: any) {
const contributors = c.editions?.works?.work_contributors ?? [];
const author = contributors.find((wc: any) => wc.role === 'author');
return author?.authors?.name ?? null;
}
function latestValue(estimates: any[]) {
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
export default async function Browse({
searchParams,
}: {
searchParams: { by?: string; value?: string };
}) {
const copies = await getCopies();
const by = searchParams.by ?? 'author';
const activeValue = searchParams.value;
const groups: Record<string, any[]> = {};
for (const c of copies) {
let key = 'Unknown';
if (by === 'author') key = authorName(c) ?? 'Unknown author';
if (by === 'publisher') key = c.editions?.publisher ? String(c.editions.publisher).replace(/^the\s+/i, '').trim() : 'Unknown publisher';
if (by === 'genre') key = c.editions?.works?.genre ?? 'Ungenred';
if (by === 'series') {
const sm = c.set_members?.[0];
key = sm?.sets?.name ?? 'Not part of a series';
}
if (by === 'signed') key = c.signed ? 'Signed' : 'Unsigned';
if (!groups[key]) groups[key] = [];
groups[key].push(c);
}
const sortedKeys = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);
const visibleCopies = activeValue ? groups[activeValue] ?? [] : copies;
const tabStyle = (active: boolean) => ({
display: 'inline-block',
padding: '0.4rem 0.9rem',
marginRight: '0.5rem',
marginBottom: '0.5rem',
border: '1px solid #4a3d2c',
color: active ? '#15100b' : '#c4b490',
background: active ? '#b8923f' : 'transparent',
textDecoration: 'none',
fontSize: '0.85rem',
});
return (
<div>
<h2 style={{
fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
fontWeight: 500, fontSize: '1.8rem', color: '#e8dcc0', margin: '0 0 1.25rem',
}}>
Browse the Archive
</h2>
<div style={{ marginBottom: '1rem' }}>
{['author', 'publisher', 'genre', 'series', 'signed'].map(mode => (
<a key={mode} href={`/browse?by=${mode}`} style={{
...tabStyle(by === mode),
fontWeight: by === mode ? 600 : 400,
textTransform: 'capitalize',
}}>
{mode}
</a>
))}
</div>
<div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #3a2f20', paddingBottom: '1.25rem' }}>
{sortedKeys.map(key => (
<a key={key} href={`/browse?by=${by}&value=${encodeURIComponent(key)}`} style={tabStyle(activeValue === key)}>
{key} ({groups[key].length})
</a>
))}
{activeValue && (
<a href={`/browse?by=${by}`} style={{ color: '#8a7a5c', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
clear filter ✕
</a>
)}
</div>
<div>
{visibleCopies.map((c: any) => (
<div key={c.id} style={{
borderLeft: '2px solid #b8923f',
borderBottom: '1px solid #29221777',
padding: '1rem 0 1rem 1.25rem',
display: 'flex', justifyContent: 'space-between', gap: '1rem',
}}>
<div>
<a href={`/copies/${c.id}`} style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', color: '#e8dcc0', textDecoration: 'none' }}>
{c.editions?.works?.title ?? 'Untitled'}
</a>
<div style={{ color: '#8a7a5c', fontSize: '0.85rem', marginTop: '0.2rem' }}>
{[authorName(c), c.editions?.publisher, c.editions?.pub_year].filter(Boolean).join(' · ')}
{c.signed && '  ·  signed'}
</div>
</div>
<div style={{ fontFamily: "'Cormorant Garamond', serif", color: '#c4b490', whiteSpace: 'nowrap' }}>
{latestValue(c.value_estimates) ?? '—'}
</div>
</div>
))}
{visibleCopies.length === 0 && (
<p style={{ color: '#8a7a5c' }}>No volumes match this filter.</p>
)}
</div>
</div>
);
}
