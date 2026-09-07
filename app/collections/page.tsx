import { supabase } from '../lib/supabase';
import { KIND_LABEL, completeness } from '../lib/groupings';
export const dynamic = 'force-dynamic';
export default async function Collections() {
const { data: sets } = await supabase.from('sets').select('id, name, kind, publisher, total_known, roster, set_members ( work_id )').order('name');
const list = sets ?? [];
return (
<div>
<h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 500, fontSize: '1.8rem', color: '#2E2A22', margin: '0 0 0.35rem' }}>Sets &amp; Series</h2>
<p style={{ color: '#6E6552', fontSize: '0.85rem', margin: '0 0 1.5rem' }}>Multi-volume sets, author series, and publisher's series in the archive</p>
{list.length === 0 && (
<div style={{ border: '1px dashed #4a3d2c', padding: '2rem', color: '#6E6552' }}>
<p style={{ margin: 0 }}>No sets or series detected yet. When you accession a book that belongs to one, it will appear here.</p>
</div>
)}
{list.map((s: any) => {
const owned = s.set_members?.length ?? 0;
const total = s.total_known ?? (s.roster?.titles?.length ?? null);
const pct = total ? Math.round((owned / total) * 100) : null;
return (
<a key={s.id} href={`/collections/${s.id}`} style={{ display: 'block', borderLeft: '2px solid #3D5245', borderBottom: '1px solid #29221777', padding: '1.1rem 0 1.1rem 1.25rem', textDecoration: 'none' }}>
<div style={{ fontSize: '0.65rem', color: '#6E6552', letterSpacing: '0.1em', marginBottom: '0.15rem' }}>{(KIND_LABEL[s.kind] ?? 'Grouping').toUpperCase()}</div>
<div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem', color: '#2E2A22' }}>{s.name}</div>
<div style={{ color: '#6E6552', fontSize: '0.85rem', marginTop: '0.3rem' }}>
{completeness(s.kind, owned, total)}{pct !== null ? ` · ${pct}%` : ''}
</div>
{pct !== null && (
<div style={{ height: 3, background: '#D8CDB4', marginTop: '0.6rem', maxWidth: 260 }}>
<div style={{ height: 3, background: '#3D5245', width: `${pct}%` }} />
</div>
)}
</a>
);
})}
</div>
);
}
