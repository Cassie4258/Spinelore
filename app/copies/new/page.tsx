'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { KIND_LABEL, seqLabel } from '../../lib/groupings';
const inputStyle = {
width: '100%',
padding: '0.55rem 0.1rem',
border: 'none',
borderBottom: '1px solid #4a3d2c',
background: 'transparent',
color: '#e8dcc0',
fontSize: '1.05rem',
fontFamily: "'EB Garamond', serif",
boxSizing: 'border-box' as const,
outline: 'none',
};
const labelStyle = {
fontSize: '0.75rem',
color: '#8a7a5c',
letterSpacing: '0.1em',
marginBottom: '0.3rem',
display: 'block',
};
export default function NewCopy() {
const router = useRouter();
const [saving, setSaving] = useState(false);
const [error, setError] = useState<string | null>(null);
const [photos, setPhotos] = useState<{ url: string; type: string }[]>([]);
const [uploading, setUploading] = useState(false);
const [extracting, setExtracting] = useState(false);
const [aiFilled, setAiFilled] = useState<string[]>([]);
const [valuing, setValuing] = useState(false);
const [valueResult, setValueResult] = useState<{
low: number | null; high: number | null; confidence: string;
reasoning: string; sources: { title: string; url: string }[];
} | null>(null);
const [enriching, setEnriching] = useState(false);
const [enriched, setEnriched] = useState<any>(null);
const [seriesResult, setSeriesResult] = useState<{
is_part_of_series: boolean; series_name: string | null;
series_publisher: string | null; sequence_number: number | null;
confidence: string; reasoning: string;
} | null>(null);
const [enrichDone, setEnrichDone] = useState(false);
const [dupes, setDupes] = useState<any[]>([]);
const [groupings, setGroupings] = useState<any[]>([]);
const [form, setForm] = useState({
title: '',
author: '',
illustrator: '',
genre: '',
publisher: '',
pub_year: '',
isbn: '',
binding: '',
signed: false,
condition_book: '',
purchase_price: '',
value_low: '',
value_high: '',
notes: '',
});
const update = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));
async function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
const files = e.target.files;
if (!files || files.length === 0) return;
setUploading(true);
try {
for (const file of Array.from(files)) {
const path = `${Date.now()}-${file.name}`;
const { error: uploadErr } = await supabase.storage
.from('book-photos')
.upload(path, file);
if (uploadErr) throw uploadErr;
const { data } = supabase.storage.from('book-photos').getPublicUrl(path);
setPhotos(p => [...p, { url: data.publicUrl, type: 'cover' }]);
// Try AI extraction on every photo, filling in whatever fields are still empty
{
setExtracting(true);
try {
const reader = new FileReader();
const base64: string = await new Promise((resolve, reject) => {
reader.onload = () => resolve((reader.result as string).split(',')[1]);
reader.onerror = reject;
reader.readAsDataURL(file);
});
const res = await fetch('/api/extract', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ imageBase64: base64, mediaType: file.type }),
});
if (res.ok) {
const suggestions = await res.json();
const filled: string[] = [];
setForm(f => {
const next = { ...f };
for (const key of ['title', 'author', 'illustrator', 'publisher', 'pub_year', 'isbn', 'binding', 'genre', 'condition_book']) {
const sKey = key === 'condition_book' ? 'condition' : key;
if (!next[key as keyof typeof next] && suggestions[sKey]) {
(next as any)[key] = suggestions[sKey];
filled.push(key);
}
}
return next;
});
if (filled.length > 0) {
setAiFilled(prev => Array.from(new Set([...prev, ...filled])));
}
}
} catch {
// AI extraction is best-effort; ignore failures silently
} finally {
setExtracting(false);
}
}
}
} catch (err: any) {
setError(err.message ?? 'Photo upload failed.');
} finally {
setUploading(false);
}
}
async function handleEstimateValue() {
setValuing(true);
setValueResult(null);
setError(null);
try {
const res = await fetch('/api/valuate', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
title: form.title,
author: form.author,
publisher: form.publisher,
pub_year: form.pub_year,
binding: form.binding,
condition_book: form.condition_book,
signed: form.signed,
isbn: form.isbn,
}),
});
const data = await res.json();
if (res.ok) {
setValueResult({
low: data.low_estimate, high: data.high_estimate,
confidence: data.confidence, reasoning: data.reasoning,
sources: data.sources || [],
});
} else {
setError(data.error || 'Valuation failed.');
}
} catch {
setError('Valuation request failed.');
} finally {
setValuing(false);
}
}
async function checkDupes(title: string) {
if (!title.trim()) { setDupes([]); return; }
const { data } = await supabase.from('copies').select('id, condition_book, editions ( publisher, pub_year, works ( title ) )');
const norm = (x: string) => (x || '').toLowerCase().replace(/^(the|a|an)\s+/, '').replace(/[^a-z0-9 ]/g, '').trim();
const hits = (data ?? []).filter((c: any) => norm(c.editions?.works?.title) === norm(title));
setDupes(hits);
}
async function runEnrich(f0: any) {
setEnriching(true);
try {
const res = await fetch('/api/enrich', {
method: 'POST', headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ title: f0.title, author: f0.author, illustrator: f0.illustrator, publisher: f0.publisher, pub_year: f0.pub_year, binding: f0.binding, isbn: f0.isbn, condition_book: f0.condition_book, signed: f0.signed }),
});
const d = await res.json();
if (res.ok) {
setEnriched(d);
setSeriesResult(d.groupings?.[0] ?? null);
setGroupings(d.groupings ?? []);
if (d.valuation && (d.valuation.low_estimate != null || d.valuation.high_estimate != null)) {
setValueResult({ low: d.valuation.low_estimate, high: d.valuation.high_estimate, confidence: d.valuation.confidence, reasoning: d.valuation.reasoning, sources: d.valuation.sources || [] });
}
setForm(prev => {
const next = { ...prev };
if (!next.genre && d.genre) next.genre = d.genre;
if (!next.illustrator && d.illustrator) next.illustrator = d.illustrator;
return next;
});
}
} catch {
} finally { setEnriching(false); setEnrichDone(true); }
}
useEffect(() => {
if (!enrichDone && !enriching && form.title.trim() && form.publisher.trim()) runEnrich(form);
if (form.title.trim()) checkDupes(form.title);
}, [form.title, form.publisher, enrichDone, enriching]);
async function handleSubmit(e: React.FormEvent) {
e.preventDefault();
setSaving(true);
setError(null);
try {
const { data: work, error: workErr } = await supabase
.from('works')
.insert({ title: form.title, genre: form.genre || null, original_pub_year: enriched?.original_pub_year ?? null })
.select()
.single();
if (workErr) throw workErr;
if (form.author.trim()) {
const { data: author, error: authorErr } = await supabase
.from('authors')
.insert({ name: form.author })
.select()
.single();
if (authorErr) throw authorErr;
await supabase.from('work_contributors').insert({
work_id: work.id,
author_id: author.id,
role: 'author',
});
}
if (enriched?.translator) {
const { data: tr } = await supabase.from('authors').insert({ name: enriched.translator }).select().single();
if (tr) await supabase.from('work_contributors').insert({ work_id: work.id, author_id: tr.id, role: 'translator' });
}
if (form.illustrator.trim()) {
const { data: ill } = await supabase.from('authors').insert({ name: form.illustrator }).select().single();
if (ill) await supabase.from('work_contributors').insert({ work_id: work.id, author_id: ill.id, role: 'illustrator' });
}
const { data: edition, error: editionErr } = await supabase
.from('editions')
.insert({
work_id: work.id,
publisher: form.publisher || null,
pub_year: form.pub_year ? parseInt(form.pub_year) : null,
isbn: form.isbn || null,
binding: form.binding || null,
edition_label: enriched?.edition_label || null,
})
.select()
.single();
if (editionErr) throw editionErr;
const { data: copy, error: copyErr } = await supabase.from('copies').insert({
edition_id: edition.id,
signed: form.signed,
condition_book: form.condition_book || null,
purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
notes: form.notes || null,
}).select().single();
if (copyErr) throw copyErr;
if (photos.length > 0) {
await supabase.from('copy_photos').insert(
photos.map(p => ({ copy_id: copy.id, url: p.url, photo_type: p.type }))
);
}
if (valueResult && (valueResult.low != null || valueResult.high != null)) {
await supabase.from('value_estimates').insert({
copy_id: copy.id,
low_estimate: valueResult.low,
high_estimate: valueResult.high,
confidence: valueResult.confidence,
reasoning: valueResult.reasoning +
(valueResult.sources.length
? '\n\nSources: ' + valueResult.sources.map(s => s.url).join(', ')
: ''),
});
}
for (const g of groupings) {
if (!g?.name) continue;
const full = g.publisher ? `${g.publisher} — ${g.name}` : g.name;
const { data: existing } = await supabase.from('sets').select('id').eq('name', full).maybeSingle();
let setId = existing?.id;
if (!setId) {
const { data: ns } = await supabase.from('sets').insert({
name: full, kind: g.kind ?? 'publisher_series', publisher: g.publisher ?? null,
description: g.reasoning ?? null, total_known: g.total_known ?? null,
requires_matching: g.kind === 'multi_volume_set' || g.kind === 'publisher_series' || g.kind === 'collected_works',
}).select().single();
setId = ns?.id;
}
if (setId) {
await supabase.from('set_members').insert({
set_id: setId, work_id: work.id, edition_id: edition.id,
sequence_number: g.sequence_number ?? null,
}).select();
}
}
router.push('/');
router.refresh();
} catch (err: any) {
setError(err.message ?? 'Something went wrong saving this book.');
} finally {
setSaving(false);
}
}
return (
<div>
<h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 500, fontSize: '1.8rem', color: '#e8dcc0', margin: '0 0 0.25rem' }}>
Accession a Volume
</h2>
<p style={{ color: '#8a7a5c', fontSize: '0.9rem', marginBottom: '2rem' }}>
Record the essentials now — rarity, provenance, and valuation can be added to the volume's entry later.
</p>
<form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.4rem' }}>
<div>
<label style={labelStyle}>PHOTOGRAPHS</label>
<label style={{
display: 'inline-block',
background: 'transparent',
border: '1px solid #4a3d2c',
color: '#c4b490',
padding: '0.55rem 1.1rem',
cursor: 'pointer',
fontSize: '0.9rem',
fontFamily: "'EB Garamond', serif",
}}>
{uploading ? 'Uploading…' : '⁘ Take or Choose a Photograph'}
<input
type="file"
accept="image/*"
capture="environment"
multiple
onChange={handlePhotoCapture}
style={{ display: 'none' }}
/>
</label>
{extracting && (
<p style={{ color: '#8a7a5c', fontSize: '0.85rem', marginTop: '0.5rem', fontStyle: 'italic' }}>
Reading the cover for title, author, publisher…
</p>
)}
{aiFilled.length > 0 && (
<p style={{ color: '#8faa7a', fontSize: '0.85rem', marginTop: '0.5rem' }}>
Filled from photograph: {aiFilled.join(', ')} — please verify before saving.
</p>
)}
{photos.length > 0 && (
<div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
{photos.map((p, i) => (
<img key={i} src={p.url} style={{ width: 58, height: 78, objectFit: 'cover', border: '1px solid #4a3d2c' }} />
))}
</div>
)}
</div>
{dupes.length > 0 && (
<div style={{ border: '1px solid #6b5524', background: '#241d10', padding: '1rem', fontSize: '0.9rem' }}>
<div style={{ color: '#d8b24f', marginBottom: '0.5rem' }}>You may already own this — {dupes.length} {dupes.length === 1 ? 'copy' : 'copies'} of this title in the archive:</div>
{dupes.map((d: any) => (
<div key={d.id} style={{ marginBottom: '0.25rem' }}>
<a href={`/copies/${d.id}`} style={{ color: '#c4b490' }}>
{[d.editions?.publisher, d.editions?.pub_year, d.condition_book].filter(Boolean).join(' · ') || 'existing copy'}
</a>
</div>
))}
<div style={{ color: '#8a7a5c', fontSize: '0.8rem', marginTop: '0.5rem' }}>Multiple copies are fine — carry on if this is a different edition or a second copy.</div>
</div>
)}
<div>
<label style={labelStyle}>TITLE *</label>
<input style={inputStyle} required value={form.title}
onChange={e => update('title', e.target.value)} />
</div>
<div>
<label style={labelStyle}>AUTHOR</label>
<input style={inputStyle} value={form.author}
onChange={e => update('author', e.target.value)} />
</div>
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
<div>
<label style={labelStyle}>ILLUSTRATOR</label>
<input style={inputStyle} value={form.illustrator}
onChange={e => update('illustrator', e.target.value)} />
</div>
<div>
<label style={labelStyle}>GENRE</label>
<input style={inputStyle} value={form.genre}
onChange={e => update('genre', e.target.value)} placeholder="Poetry, Novel, History…" />
</div>
</div>
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
<div>
<label style={labelStyle}>PUBLISHER</label>
<input style={inputStyle} value={form.publisher}
onChange={e => update('publisher', e.target.value)} />
</div>
<div>
<label style={labelStyle}>PUBLICATION YEAR</label>
<input style={inputStyle} type="number" value={form.pub_year}
onChange={e => update('pub_year', e.target.value)} />
</div>
</div>
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
<div>
<label style={labelStyle}>ISBN</label>
<input style={inputStyle} value={form.isbn}
onChange={e => update('isbn', e.target.value)} />
</div>
<div>
<label style={labelStyle}>BINDING</label>
<input style={inputStyle} value={form.binding}
onChange={e => update('binding', e.target.value)}
placeholder="Hardcover, paperback..." />
</div>
</div>
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
<div>
<label style={labelStyle}>CONDITION</label>
<select style={{ ...inputStyle, background: '#15100b' }} value={form.condition_book}
onChange={e => update('condition_book', e.target.value)}>
{['', 'Fine', 'Near Fine', 'Very Good', 'Good', 'Fair', 'Poor'].map(g => <option key={g} value={g}>{g || '— select —'}</option>)}
</select>
</div>
<div>
<label style={labelStyle}>PURCHASE PRICE</label>
<input style={inputStyle} type="number" step="0.01" value={form.purchase_price}
onChange={e => update('purchase_price', e.target.value)} />
</div>
</div>
<div style={{ borderTop: '1px solid #3a2f20', paddingTop: '1.2rem' }}>
<label style={labelStyle}>SETS &amp; SERIES</label>
{enriching && (
<p style={{ color: '#8a7a5c', fontSize: '0.85rem', fontStyle: 'italic' }}>
Researching edition, series, genre and market value…
</p>
)}
{!enriching && enrichDone && groupings.length > 0 && groupings.map((g: any, i: number) => (
<div key={i} style={{ marginBottom: '0.75rem' }}>
<div style={{ fontSize: '0.65rem', color: '#8a7a5c', letterSpacing: '0.1em' }}>{(KIND_LABEL[g.kind] ?? 'Grouping').toUpperCase()}</div>
<div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.15rem', color: '#e8dcc0' }}>
{g.publisher && `${g.publisher} — `}{g.name}
{seqLabel(g.kind, g.sequence_number, g.sequence_label) && ` (${seqLabel(g.kind, g.sequence_number, g.sequence_label)})`}
</div>
{g.reasoning && <p style={{ color: '#8a7a5c', fontSize: '0.8rem', marginTop: '0.2rem' }}>{g.reasoning}</p>}
</div>
))}
{!enriching && enrichDone && groupings.length === 0 && (
<p style={{ color: '#5c5040', fontSize: '0.85rem' }}>Not part of a known set or series.</p>
)}
</div>
<div style={{ borderTop: '1px solid #3a2f20', paddingTop: '1.2rem' }}>
<label style={labelStyle}>ESTIMATED VALUE</label>
<button
type="button"
onClick={handleEstimateValue}
disabled={valuing || !form.title}
style={{
display: 'inline-block',
background: 'transparent',
border: '1px solid #4a3d2c',
color: '#c4b490',
padding: '0.55rem 1.1rem',
cursor: 'pointer',
fontSize: '0.9rem',
fontFamily: "'EB Garamond', serif",
opacity: (!form.title) ? 0.5 : 1,
}}
>
{valuing ? 'Searching comparables…' : valueResult ? '⁘ Re-check value' : '⁘ Estimate Value (AI Web Search)'}
</button>
{valueResult && (
<div style={{ marginTop: '0.9rem' }}>
<div style={{
fontFamily: "'Cormorant Garamond', serif",
fontSize: '1.3rem',
color: '#e8dcc0',
}}>
{valueResult.low != null && valueResult.high != null
? `$${valueResult.low.toLocaleString()} – $${valueResult.high.toLocaleString()}`
: 'No reliable estimate found'}
<span style={{ fontSize: '0.75rem', color: '#8a7a5c', marginLeft: '0.6rem', letterSpacing: '0.05em' }}>
CONFIDENCE: {valueResult.confidence?.toUpperCase()}
</span>
</div>
<p style={{ color: '#8a7a5c', fontSize: '0.85rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
{valueResult.reasoning}
</p>
{valueResult.sources.length > 0 && (
<div style={{ marginTop: '0.5rem' }}>
{valueResult.sources.slice(0, 5).map((s, i) => (
<div key={i} style={{ fontSize: '0.8rem' }}>
<a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: '#8a9aaa' }}>
{s.title}
</a>
</div>
))}
</div>
)}
</div>
)}
</div>
<label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'system-ui, sans-serif' }}>
<input type="checkbox" checked={form.signed}
onChange={e => update('signed', e.target.checked)} />
Signed by the author
</label>
<div>
<label style={labelStyle}>NOTES</label>
<textarea style={{ ...inputStyle, minHeight: '80px' }} value={form.notes}
onChange={e => update('notes', e.target.value)} />
</div>
{error && <p style={{ color: '#c0685a' }}>{error}</p>}
<button type="submit" disabled={saving} style={{
background: '#4a2318',
color: '#e8dcc0',
border: '1px solid #6b3524',
padding: '0.8rem',
fontSize: '0.95rem',
letterSpacing: '0.05em',
fontFamily: "'EB Garamond', serif",
cursor: 'pointer',
opacity: saving ? 0.6 : 1,
boxShadow: '0 0 0 1px #15100b, 0 0 0 2px #b8923f33',
}}>
{saving ? 'Recording…' : 'Add to the Archive'}
</button>
</form>
</div>
);
}
