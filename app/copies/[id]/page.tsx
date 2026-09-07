import { supabase } from '../../lib/supabase';
import DeleteButton from './DeleteButton';
import Editor from './Editor';
import { KIND_LABEL, seqLabel } from '../../lib/groupings';
export const dynamic = 'force-dynamic';
async function getCopy(id: string): Promise<any> {
const { data, error } = await supabase
.from('copies')
.select(`
id, ai_notes, signed, inscribed, dust_jacket, slipcase, condition_book, condition_jacket, defects,
provenance, purchase_date, purchase_source, purchase_price, notes, created_at,
editions ( id, work_id, publisher, pub_place, pub_year, edition_label, printing_number, issue_state, isbn, binding, format,
works ( id, title, subtitle, genre, original_pub_year, work_contributors ( role, authors ( id, name ) ) ) ),
copy_photos ( url, photo_type ),
value_estimates ( low_estimate, high_estimate, confidence, reasoning, estimated_at ),
locations ( path )
`)
.eq('id', id)
.maybeSingle();
if (error) { console.error(error); return null; }
return data;
}
async function getSeries(workId: string | undefined) {
if (!workId) return [];
const { data } = await supabase.from('set_members').select('sequence_number, sets ( id, name, kind, publisher )').eq('work_id', workId);
return (data ?? []) as any[];
}
const label = { fontSize: '0.7rem', color: '#6E6552', letterSpacing: '0.1em', marginBottom: '0.2rem' };
const value = { color: '#2E2A22', fontSize: '1rem', marginBottom: '1rem' };
function Field({ name, val }: { name: string; val: any }) {
if (val === null || val === undefined || val === '' || val === false) return null;
return (<div><div style={label}>{name}</div><div style={value}>{val === true ? 'Yes' : String(val)}</div></div>);
}
export default async function CopyDetail({ params }: { params: { id: string } }) {
const c = await getCopy(params.id);
if (!c) return <p style={{ color: '#6E6552' }}>This volume could not be found.</p>;
const ed = c.editions ?? {};
const w = ed.works ?? {};
const contributors = (w.work_contributors ?? []) as any[];
const authorEntry = contributors.find((x: any) => x.role === 'author');
const illEntry = contributors.find((x: any) => x.role === 'illustrator');
const byRole = (r: string) => contributors.filter(x => x.role === r).map(x => x.authors?.name).filter(Boolean).join(', ');
const workId = ed.work_id;
const series = await getSeries(workId);
let setContext: string | null = null;
for (const m of series) {
if (m.sets?.kind !== 'multi_volume_set') continue;
const { data: sibs } = await supabase.from('set_members').select('sequence_number').eq('set_id', m.sets.id);
const owned = (sibs ?? []).length;
const { data: sinfo } = await supabase.from('sets').select('total_known').eq('id', m.sets.id).maybeSingle();
const total = sinfo?.total_known ?? null;
const pos = m.sequence_number != null ? `volume ${m.sequence_number}` : 'one volume';
if (total && owned >= total) setContext = `This copy is ${pos} of a ${total}-volume set, and the owner holds ALL ${total} volumes — the set is complete and matched. Price the complete set.`;
else if (total) setContext = `This copy is ${pos} of a ${total}-volume set; the owner currently holds only ${owned} of ${total}. Price it as an odd volume of a broken set.`;
else setContext = `This copy is ${pos} of a multi-volume set.`;
}
const estimates = [...(c.value_estimates ?? [])].sort((a: any, b: any) => new Date(b.estimated_at).getTime() - new Date(a.estimated_at).getTime());
const latest = estimates[0];
const fmt = (n: any) => n == null ? null : `$${Number(n).toLocaleString()}`;
return (
<div>
<a href="/" style={{ color: '#6E6552', fontSize: '0.85rem', textDecoration: 'none' }}>← Back to Library</a>
<h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontSize: '2rem', color: '#2E2A22', margin: '1rem 0 0.25rem' }}>{w.title ?? 'Untitled'}</h2>
{w.subtitle && <p style={{ color: '#4A4335', fontStyle: 'italic', margin: '0 0 0.5rem' }}>{w.subtitle}</p>}
<p style={{ color: '#6E6552', margin: '0 0 2rem' }}>{[byRole('author'), ed.publisher, ed.pub_year].filter(Boolean).join(' · ')}</p>
{c.copy_photos?.length > 0 && (
<div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
{c.copy_photos.map((p: any, i: number) => (
<a key={i} href={p.url} target="_blank" rel="noopener noreferrer">
<img src={p.url} alt={p.photo_type} style={{ width: 110, height: 150, objectFit: 'cover', border: '1px solid #C4B79C' }} />
</a>
))}
</div>
)}
<Editor copy={c} edition={ed} work={w} authorId={authorEntry?.authors?.id ?? null} authorName={authorEntry?.authors?.name ?? ''} illustratorId={illEntry?.authors?.id ?? null} illustratorName={illEntry?.authors?.name ?? ''} latest={latest ?? null} aiNotes={c.ai_notes ?? null} setContext={setContext} />
{series.length > 0 && (
<div style={{ border: '1px solid #C4B79C', padding: '1.25rem', marginBottom: '2rem' }}>
<div style={label}>SETS &amp; SERIES</div>
{series.map((m: any, i: number) => (
<div key={i} style={{ marginBottom: i < series.length - 1 ? '0.75rem' : 0 }}>
<div style={{ fontSize: '0.65rem', color: '#6E6552', letterSpacing: '0.1em' }}>{(KIND_LABEL[m.sets?.kind] ?? 'GROUPING').toUpperCase()}</div>
<a href={`/collections/${m.sets?.id}`} style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', color: '#2E2A22', textDecoration: 'none' }}>
{m.sets?.name}{seqLabel(m.sets?.kind, m.sequence_number) && ` (${seqLabel(m.sets?.kind, m.sequence_number)})`}
</a>
</div>
))}
</div>
)}
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1.5rem' }}>
<Field name="AUTHOR" val={byRole('author')} />
<Field name="EDITOR" val={byRole('editor')} />
<Field name="TRANSLATOR" val={byRole('translator')} />
<Field name="ILLUSTRATOR" val={byRole('illustrator')} />
<Field name="PUBLISHER" val={ed.publisher} />
<Field name="PLACE" val={ed.pub_place} />
<Field name="YEAR" val={ed.pub_year} />
<Field name="ORIGINAL YEAR" val={w.original_pub_year} />
<Field name="EDITION" val={ed.edition_label} />
<Field name="PRINTING" val={ed.printing_number} />
<Field name="ISSUE / STATE" val={ed.issue_state} />
<Field name="ISBN" val={ed.isbn} />
<Field name="BINDING" val={ed.binding} />
<Field name="FORMAT" val={ed.format} />
<Field name="GENRE" val={w.genre} />
<Field name="CONDITION" val={c.condition_book} />
<Field name="JACKET CONDITION" val={c.condition_jacket} />
<Field name="DUST JACKET" val={c.dust_jacket} />
<Field name="SLIPCASE" val={c.slipcase} />
<Field name="SIGNED" val={c.signed} />
<Field name="INSCRIBED" val={c.inscribed} />
<Field name="DEFECTS" val={c.defects} />
<Field name="PROVENANCE" val={c.provenance} />
<Field name="PURCHASE PRICE" val={fmt(c.purchase_price)} />
<Field name="PURCHASE DATE" val={c.purchase_date} />
<Field name="PURCHASED FROM" val={c.purchase_source} />
<Field name="LOCATION" val={c.locations?.path} />
<Field name="ADDED" val={new Date(c.created_at).toLocaleDateString()} />
</div>
{c.notes && (<div><div style={label}>NOTES</div><div style={{ ...value, whiteSpace: 'pre-wrap' }}>{c.notes}</div></div>)}
<div style={{ borderTop: '1px solid #C4B79C', marginTop: '2rem', paddingTop: '1.5rem' }}>
<DeleteButton copyId={c.id} title={w.title ?? 'this volume'} />
</div>
</div>
);
}
