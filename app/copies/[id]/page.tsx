import { supabase } from '../../lib/supabase';
import DeleteButton from './DeleteButton';
export const dynamic = 'force-dynamic';
async function getCopy(id: string): Promise<any> {
const { data, error } = await supabase
.from('copies')
.select(`
id, signed, inscribed, dust_jacket, slipcase, condition_book, condition_jacket, defects,
provenance, purchase_date, purchase_source, purchase_price, notes, created_at,
editions ( work_id, publisher, pub_place, pub_year, edition_label, printing_number, issue_state, isbn, binding, format,
works ( title, subtitle, genre, original_pub_year, work_contributors ( role, authors ( name ) ) ) ),
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
if (!workId) return null;
const { data } = await supabase.from('set_members').select('sequence_number, sets ( name, description )').eq('work_id', workId).maybeSingle();
return data as any;
}
const label = { fontSize: '0.7rem', color: '#8a7a5c', letterSpacing: '0.1em', marginBottom: '0.2rem' };
const value = { color: '#e8dcc0', fontSize: '1rem', marginBottom: '1rem' };
function Field({ name, val }: { name: string; val: any }) {
if (val === null || val === undefined || val === '' || val === false) return null;
return (<div><div style={label}>{name}</div><div style={value}>{val === true ? 'Yes' : String(val)}</div></div>);
}
export default async function CopyDetail({ params }: { params: { id: string } }) {
const c = await getCopy(params.id);
if (!c) return <p style={{ color: '#8a7a5c' }}>This volume could not be found.</p>;
const ed = c.editions ?? {};
const w = ed.works ?? {};
const contributors = (w.work_contributors ?? []) as any[];
const byRole = (r: string) => contributors.filter(x => x.role === r).map(x => x.authors?.name).filter(Boolean).join(', ');
const workId = ed.work_id;
const series = await getSeries(workId);
const estimates = [...(c.value_estimates ?? [])].sort((a: any, b: any) => new Date(b.estimated_at).getTime() - new Date(a.estimated_at).getTime());
const latest = estimates[0];
const fmt = (n: any) => n == null ? null : `$${Number(n).toLocaleString()}`;
return (
<div>
<a href="/" style={{ color: '#8a7a5c', fontSize: '0.85rem', textDecoration: 'none' }}>← Back to Library</a>
<h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontSize: '2rem', color: '#e8dcc0', margin: '1rem 0 0.25rem' }}>{w.title ?? 'Untitled'}</h2>
{w.subtitle && <p style={{ color: '#c4b490', fontStyle: 'italic', margin: '0 0 0.5rem' }}>{w.subtitle}</p>}
<p style={{ color: '#8a7a5c', margin: '0 0 2rem' }}>{[byRole('author'), ed.publisher, ed.pub_year].filter(Boolean).join(' · ')}</p>
{c.copy_photos?.length > 0 && (
<div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
{c.copy_photos.map((p: any, i: number) => (
<a key={i} href={p.url} target="_blank" rel="noopener noreferrer">
<img src={p.url} alt={p.photo_type} style={{ width: 110, height: 150, objectFit: 'cover', border: '1px solid #4a3d2c' }} />
</a>
))}
</div>
)}
{latest && (
<div style={{ border: '1px solid #3a2f20', padding: '1.25rem', marginBottom: '2rem' }}>
<div style={label}>ESTIMATED VALUE</div>
<div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.6rem', color: '#e8dcc0' }}>
{latest.low_estimate != null && latest.high_estimate != null ? `${fmt(latest.low_estimate)} – ${fmt(latest.high_estimate)}` : fmt(latest.low_estimate ?? latest.high_estimate)}
<span style={{ fontSize: '0.7rem', color: '#8a7a5c', marginLeft: '0.75rem', letterSpacing: '0.05em' }}>CONFIDENCE: {String(latest.confidence ?? '').toUpperCase()}</span>
</div>
{latest.reasoning && <p style={{ color: '#8a7a5c', fontSize: '0.85rem', lineHeight: 1.5, marginTop: '0.75rem', whiteSpace: 'pre-wrap' }}>{latest.reasoning}</p>}
<div style={{ color: '#5c5040', fontSize: '0.75rem', marginTop: '0.5rem' }}>Estimated {new Date(latest.estimated_at).toLocaleDateString()}</div>
</div>
)}
{series?.sets && (
<div style={{ border: '1px solid #3a2f20', padding: '1.25rem', marginBottom: '2rem' }}>
<div style={label}>SERIES / SET</div>
<div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', color: '#e8dcc0' }}>
{series.sets.name}{series.sequence_number != null && ` (#${series.sequence_number})`}
</div>
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
<div style={{ borderTop: '1px solid #3a2f20', marginTop: '2rem', paddingTop: '1.5rem' }}>
<DeleteButton copyId={c.id} title={w.title ?? 'this volume'} />
</div>
</div>
);
}
