'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
const inp = { width: '100%', padding: '0.5rem 0.1rem', border: 'none', borderBottom: '1px solid #4a3d2c', background: 'transparent', color: '#e8dcc0', fontSize: '1rem', fontFamily: "'EB Garamond', serif", boxSizing: 'border-box' as const, outline: 'none' };
const lbl = { fontSize: '0.7rem', color: '#8a7a5c', letterSpacing: '0.1em', marginBottom: '0.2rem', display: 'block' };
const btn = { background: 'transparent', border: '1px solid #4a3d2c', color: '#c4b490', padding: '0.5rem 1rem', cursor: 'pointer', fontFamily: "'EB Garamond', serif", fontSize: '0.85rem' };
const primary = { ...btn, background: '#4a2318', border: '1px solid #6b3524', color: '#e8dcc0' };
const section = { border: '1px solid #3a2f20', padding: '1.25rem', marginBottom: '2rem' };
export default function Editor({ copy, edition, work, authorId, authorName, illustratorId, illustratorName, latest, aiNotes }: any) {
const router = useRouter();
const [mode, setMode] = useState<'view' | 'edit'>('view');
const [busy, setBusy] = useState<string | null>(null);
const [msg, setMsg] = useState<string | null>(null);
const [f, setF] = useState({
title: work.title ?? '', author: authorName ?? '', illustrator: illustratorName ?? '', genre: work.genre ?? '',
publisher: edition.publisher ?? '', pub_year: edition.pub_year ?? '', edition_label: edition.edition_label ?? '',
printing_number: edition.printing_number ?? '', issue_state: edition.issue_state ?? '', isbn: edition.isbn ?? '', binding: edition.binding ?? '',
condition_book: copy.condition_book ?? '', condition_jacket: copy.condition_jacket ?? '', defects: copy.defects ?? '', provenance: copy.provenance ?? '',
purchase_price: copy.purchase_price ?? '', purchase_date: copy.purchase_date ?? '', purchase_source: copy.purchase_source ?? '',
signed: !!copy.signed, inscribed: !!copy.inscribed, dust_jacket: !!copy.dust_jacket, slipcase: !!copy.slipcase, notes: copy.notes ?? '',
});
const set = (k: string, v: any) => setF(p => ({ ...p, [k]: v }));
const nul = (v: any) => (v === '' ? null : v);
async function save() {
setBusy('save'); setMsg(null);
try {
await supabase.from('works').update({ title: f.title, genre: nul(f.genre) }).eq('id', work.id);
if (f.author.trim()) {
if (authorId) await supabase.from('authors').update({ name: f.author }).eq('id', authorId);
else {
const { data: a } = await supabase.from('authors').insert({ name: f.author }).select().single();
if (a) await supabase.from('work_contributors').insert({ work_id: work.id, author_id: a.id, role: 'author' });
}
}
if (f.illustrator.trim()) {
if (illustratorId) await supabase.from('authors').update({ name: f.illustrator }).eq('id', illustratorId);
else {
const { data: a } = await supabase.from('authors').insert({ name: f.illustrator }).select().single();
if (a) await supabase.from('work_contributors').insert({ work_id: work.id, author_id: a.id, role: 'illustrator' });
}
}
await supabase.from('editions').update({
publisher: nul(f.publisher), pub_year: f.pub_year ? parseInt(String(f.pub_year)) : null, edition_label: nul(f.edition_label),
printing_number: nul(f.printing_number), issue_state: nul(f.issue_state), isbn: nul(f.isbn), binding: nul(f.binding),
}).eq('id', edition.id);
await supabase.from('copies').update({
condition_book: nul(f.condition_book), condition_jacket: nul(f.condition_jacket), defects: nul(f.defects), provenance: nul(f.provenance),
purchase_price: f.purchase_price === '' ? null : parseFloat(String(f.purchase_price)), purchase_date: nul(f.purchase_date), purchase_source: nul(f.purchase_source),
signed: f.signed, inscribed: f.inscribed, dust_jacket: f.dust_jacket, slipcase: f.slipcase, notes: nul(f.notes),
}).eq('id', copy.id);
setMode('view'); router.refresh();
} catch (e: any) { setMsg(e.message ?? 'Save failed.'); } finally { setBusy(null); }
}
const [mLow, setMLow] = useState(''); const [mHigh, setMHigh] = useState(''); const [mNote, setMNote] = useState('');
const [showManual, setShowManual] = useState(false);
async function saveManualValue() {
setBusy('manual');
await supabase.from('value_estimates').insert({ copy_id: copy.id, low_estimate: mLow ? parseFloat(mLow) : null, high_estimate: mHigh ? parseFloat(mHigh) : null, confidence: 'manual', reasoning: mNote || 'Entered manually by the collector.' });
setShowManual(false); setBusy(null); router.refresh();
}
async function runAiValuation() {
setBusy('ai'); setMsg(null);
try {
const res = await fetch('/api/valuate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: f.title, author: f.author, publisher: f.publisher, pub_year: f.pub_year, binding: f.binding, condition_book: f.condition_book, signed: f.signed, isbn: f.isbn }) });
const d = await res.json();
if (!res.ok) throw new Error(d.error || 'Valuation failed');
await supabase.from('value_estimates').insert({ copy_id: copy.id, low_estimate: d.low_estimate, high_estimate: d.high_estimate, confidence: d.confidence, reasoning: d.reasoning + ((d.sources ?? []).length ? '\n\nSources: ' + d.sources.map((s: any) => s.url).join(', ') : '') });
router.refresh();
} catch (e: any) { setMsg(e.message); } finally { setBusy(null); }
}
async function reEnrich() {
setBusy('enrich'); setMsg(null);
try {
const res = await fetch('/api/enrich', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: f.title, author: f.author, illustrator: f.illustrator, publisher: f.publisher, pub_year: f.pub_year, binding: f.binding, isbn: f.isbn, condition_book: f.condition_book, signed: f.signed }) });
const d = await res.json();
if (!res.ok) throw new Error(d.error || 'Enrichment failed');
const updates: any = {};
if (!work.genre && d.genre) updates.genre = d.genre;
if (!work.original_pub_year && d.original_pub_year) updates.original_pub_year = d.original_pub_year;
if (Object.keys(updates).length) await supabase.from('works').update(updates).eq('id', work.id);
if (d.series?.is_part_of_series && d.series.series_name) {
const full = d.series.series_publisher ? `${d.series.series_publisher} — ${d.series.series_name}` : d.series.series_name;
let { data: existing } = await supabase.from('sets').select('id').eq('name', full).maybeSingle();
let setId = existing?.id;
if (!setId) {
const { data: ns } = await supabase.from('sets').insert({ name: full, publisher: d.series.series_publisher ?? null, description: d.series.reasoning }).select().single();
setId = ns?.id;
}
if (setId) {
const { data: already } = await supabase.from('set_members').select('set_id').eq('set_id', setId).eq('work_id', work.id).maybeSingle();
if (!already) await supabase.from('set_members').insert({ set_id: setId, work_id: work.id, edition_id: edition.id, sequence_number: d.series.sequence_number });
}
}
if (d.valuation && (d.valuation.low_estimate != null || d.valuation.high_estimate != null)) {
await supabase.from('value_estimates').insert({ copy_id: copy.id, low_estimate: d.valuation.low_estimate, high_estimate: d.valuation.high_estimate, confidence: d.valuation.confidence, reasoning: d.valuation.reasoning + ((d.valuation.sources ?? []).length ? '\n\nSources: ' + d.valuation.sources.map((x: any) => x.url).join(', ') : '') });
}
router.refresh();
} catch (e: any) { setMsg(e.message); } finally { setBusy(null); }
}
async function generateHistory() {
setBusy('history'); setMsg(null);
try {
const res = await fetch('/api/history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: f.title, author: f.author, publisher: f.publisher, pub_year: f.pub_year, edition_label: f.edition_label, printing_number: f.printing_number, binding: f.binding, isbn: f.isbn }) });
const d = await res.json();
if (!res.ok) throw new Error(d.error || 'History failed');
await supabase.from('copies').update({ ai_notes: { ...d, generated_at: new Date().toISOString() } }).eq('id', copy.id);
router.refresh();
} catch (e: any) { setMsg(e.message); } finally { setBusy(null); }
}
const GRADES = ['', 'Fine', 'Near Fine', 'Very Good', 'Good', 'Fair', 'Poor'];
const Sel = ({ k, label }: any) => (
<div><label style={lbl}>{label}</label>
<select style={{ ...inp, background: '#15100b' }} value={f[k as keyof typeof f] as string} onChange={e => set(k, e.target.value)}>
{GRADES.map(g => <option key={g} value={g}>{g || '— select —'}</option>)}
</select></div>
);
const F = ({ k, label, type = 'text', wide = false }: any) => (
<div style={wide ? { gridColumn: '1 / -1' } : {}}>
<label style={lbl}>{label}</label>
{type === 'textarea'
? <textarea style={{ ...inp, minHeight: 70 }} value={f[k as keyof typeof f] as string} onChange={e => set(k, e.target.value)} />
: <input style={inp} type={type} value={f[k as keyof typeof f] as any} onChange={e => set(k, e.target.value)} />}
</div>
);
const Chk = ({ k, label }: any) => (
<label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#c4b490', fontSize: '0.9rem' }}>
<input type="checkbox" checked={f[k as keyof typeof f] as boolean} onChange={e => set(k, e.target.checked)} /> {label}
</label>
);
return (
<div>
{msg && <p style={{ color: '#c0685a' }}>{msg}</p>}
<div style={section}>
<div style={lbl}>ESTIMATED VALUE</div>
{latest ? (
<div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.6rem', color: '#e8dcc0' }}>
{latest.low_estimate != null && latest.high_estimate != null ? `$${Number(latest.low_estimate).toLocaleString()} – $${Number(latest.high_estimate).toLocaleString()}` : latest.low_estimate != null || latest.high_estimate != null ? `$${Number(latest.low_estimate ?? latest.high_estimate).toLocaleString()}` : '—'}
<span style={{ fontSize: '0.7rem', color: '#8a7a5c', marginLeft: '0.75rem', letterSpacing: '0.05em' }}>
{latest.confidence === 'manual' ? 'YOUR OWN VALUE' : `AI · CONFIDENCE: ${String(latest.confidence ?? '').toUpperCase()}`}
</span>
</div>
) : <p style={{ color: '#8a7a5c', fontSize: '0.9rem' }}>No valuation yet.</p>}
{latest?.reasoning && <p style={{ color: '#8a7a5c', fontSize: '0.85rem', lineHeight: 1.5, marginTop: '0.75rem', whiteSpace: 'pre-wrap' }}>{latest.reasoning}</p>}
<div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
<button type="button" style={btn} onClick={runAiValuation} disabled={busy === 'ai'}>{busy === 'ai' ? 'Searching comparables…' : latest ? 'Re-run AI valuation' : 'Run AI valuation'}</button>
<button type="button" style={btn} onClick={() => setShowManual(s => !s)}>Enter my own value</button>
</div>
{showManual && (
<div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
<div><label style={lbl}>LOW ($)</label><input style={inp} type="number" value={mLow} onChange={e => setMLow(e.target.value)} /></div>
<div><label style={lbl}>HIGH ($)</label><input style={inp} type="number" value={mHigh} onChange={e => setMHigh(e.target.value)} /></div>
<div style={{ gridColumn: '1 / -1' }}><label style={lbl}>BASIS (optional)</label><input style={inp} value={mNote} onChange={e => setMNote(e.target.value)} placeholder="e.g. Appraised by … in 2025" /></div>
<div><button type="button" style={primary} onClick={saveManualValue} disabled={busy === 'manual'}>{busy === 'manual' ? 'Saving…' : 'Save my value'}</button></div>
</div>
)}
</div>
<div style={section}>
<div style={lbl}>HISTORY & EDITION NOTES</div>
{aiNotes ? (
<div style={{ color: '#c4b490', fontSize: '0.95rem', lineHeight: 1.6 }}>
<p style={{ color: '#e8dcc0' }}>{aiNotes.summary}</p>
<div style={{ ...lbl, marginTop: '1rem' }}>HISTORY</div><p>{aiNotes.history}</p>
<div style={{ ...lbl, marginTop: '1rem' }}>ABOUT THIS EDITION</div><p>{aiNotes.edition_notes}</p>
{aiNotes.collector_significance && (<><div style={{ ...lbl, marginTop: '1rem' }}>COLLECTOR SIGNIFICANCE</div><p><strong style={{ color: '#e8dcc0' }}>{aiNotes.collector_significance}</strong> — {aiNotes.significance_reason}</p></>)}
{aiNotes.sources?.length > 0 && (<div style={{ marginTop: '0.75rem' }}>{aiNotes.sources.slice(0, 6).map((s: any, i: number) => (<div key={i} style={{ fontSize: '0.8rem' }}><a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: '#8a9aaa' }}>{s.title}</a></div>))}</div>)}
<div style={{ color: '#5c5040', fontSize: '0.75rem', marginTop: '0.75rem' }}>Generated {new Date(aiNotes.generated_at).toLocaleDateString()} · AI research — verify before relying on it</div>
</div>
) : <p style={{ color: '#8a7a5c', fontSize: '0.9rem' }}>No history generated yet.</p>}
<button type="button" style={{ ...btn, marginTop: '1rem' }} onClick={generateHistory} disabled={busy === 'history'}>{busy === 'history' ? 'Researching…' : aiNotes ? 'Regenerate history' : 'Generate history & edition notes'}</button>
</div>
{mode === 'view' ? (
<div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
<button type="button" style={btn} onClick={() => setMode('edit')}>Edit details</button>
<button type="button" style={btn} onClick={reEnrich} disabled={busy === 'enrich'}>{busy === 'enrich' ? 'Researching…' : 'Fill gaps with AI research'}</button>
</div>
) : (
<div style={section}>
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
<F k="title" label="TITLE" wide /><F k="author" label="AUTHOR" wide />
<F k="illustrator" label="ILLUSTRATOR" wide />
<F k="publisher" label="PUBLISHER" /><F k="pub_year" label="YEAR" type="number" />
<F k="edition_label" label="EDITION" /><F k="printing_number" label="PRINTING" />
<F k="issue_state" label="ISSUE / STATE" /><F k="isbn" label="ISBN" />
<F k="binding" label="BINDING" /><F k="genre" label="GENRE" />
<Sel k="condition_book" label="CONDITION" /><Sel k="condition_jacket" label="JACKET CONDITION" />
<F k="defects" label="DEFECTS" wide /><F k="provenance" label="PROVENANCE" wide />
<F k="purchase_price" label="PURCHASE PRICE" type="number" /><F k="purchase_date" label="PURCHASE DATE" type="date" />
<F k="purchase_source" label="PURCHASED FROM" wide />
<div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
<Chk k="signed" label="Signed" /><Chk k="inscribed" label="Inscribed" /><Chk k="dust_jacket" label="Dust jacket" /><Chk k="slipcase" label="Slipcase" />
</div>
<F k="notes" label="NOTES" type="textarea" wide />
</div>
<div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
<button type="button" style={primary} onClick={save} disabled={busy === 'save'}>{busy === 'save' ? 'Saving…' : 'Save changes'}</button>
<button type="button" style={btn} onClick={() => setMode('view')}>Cancel</button>
</div>
</div>
)}
</div>
);
}
