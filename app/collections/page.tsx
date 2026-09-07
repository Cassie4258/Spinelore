import { supabase } from '../lib/supabase';
export const dynamic = 'force-dynamic';
export default async function Collections() {
const { data: sets } = await supabase.from('sets').select('id, name, publisher, total_known, roster, set_members ( work_id )').order('name');
const list = sets ?? [];
return (
<div>
<h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 500, fontSize: '1.8rem', color: '#e8dcc0', margin: '0 0 0.35rem' }}>Collections</h2>
<p style={{ color: '#8a7a5c', fontSize: '0.85rem', margin: '0 0 1.5rem' }}>Publisher series and sets represented in the archive</p>
{list.length === 0 && (
<div style={{ border: '1px dashed #4a3d2c', padding: '2rem', color: '#8a7a5c' }}>
<p style={{ margin: 0 }}>No collections detected yet. When you accession a book that belongs to a publisher series, it will appear here.</p>
</div>
)}
{list.map((s: any) => {
const owned = s.set_members?.length ?? 0;
const total = s.total_known ?? (s.roster?.titles?.length ?? null);
const pct = total ? Math.round((owned / total) * 100) : null;
return (
<a key={s.id} href={`/collections/${s.id}`} style={{ display: 'block', borderLeft: '2px solid #b8923f', borderBottom: '1px solid #29221777', padding: '1.1rem 0 1.1rem 1.25rem', textDecoration: 'none' }}>
<div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem', color: '#e8dcc0' }}>{s.name}</div>
<div style={{ color: '#8a7a5c', fontSize: '0.85rem', marginTop: '0.3rem' }}>
{owned} owned{total ? ` of ${total}` : ''}{pct !== null ? ` · ${pct}% complete` : ''}
</div>
{pct !== null && (
<div style={{ height: 3, background: '#292217', marginTop: '0.6rem', maxWidth: 260 }}>
<div style={{ height: 3, background: '#b8923f', width: `${pct}%` }} />
</div>
)}
</a>
);
})}
</div>
);
}
