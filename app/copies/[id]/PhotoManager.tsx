'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
const btn = { background: 'transparent', border: '0.5px solid #A89B80', color: '#4A4335', padding: '0.5rem 0.9rem', cursor: 'pointer', fontFamily: "'EB Garamond', serif", fontSize: '0.85rem', borderRadius: '4px' };
const TYPES = ['cover','spine','title_page','copyright_page','jacket_front','jacket_back','signature','other'];
export default function PhotoManager({ copyId, photos, edition, work }: any) {
const router = useRouter();
const [busy, setBusy] = useState<string | null>(null);
const [msg, setMsg] = useState<string | null>(null);
const [found, setFound] = useState<string[]>([]);
const [type, setType] = useState('copyright_page');
async function upload(e: React.ChangeEvent<HTMLInputElement>) {
const files = e.target.files;
if (!files?.length) return;
setBusy('upload'); setMsg(null);
try {
for (const file of Array.from(files)) {
const path = `${Date.now()}-${file.name}`;
const { error: upErr } = await supabase.storage.from('book-photos').upload(path, file);
if (upErr) throw upErr;
const { data } = supabase.storage.from('book-photos').getPublicUrl(path);
await supabase.from('copy_photos').insert({ copy_id: copyId, url: data.publicUrl, photo_type: type });
}
router.refresh();
} catch (err: any) { setMsg(err.message ?? 'Upload failed.'); } finally { setBusy(null); }
}
async function removePhoto(url: string) {
setBusy(url);
await supabase.from('copy_photos').delete().eq('copy_id', copyId).eq('url', url);
setBusy(null); router.refresh();
}
/** Re-read every stored photo and fill any field still empty. */
async function reread() {
setBusy('reread'); setMsg(null); setFound([]);
try {
const filled: string[] = [];
const editionPatch: any = {};
const copyPatch: any = {};
for (const p of photos) {
const res = await fetch('/api/reread', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: p.url }) });
if (!res.ok) continue;
const d = await res.json();
if (!edition.edition_label && !editionPatch.edition_label && d.edition_label) { editionPatch.edition_label = d.edition_label; filled.push(`edition: ${d.edition_label}`); }
if (edition.printing_number == null && editionPatch.printing_number == null && d.printing_number) { editionPatch.printing_number = String(d.printing_number); filled.push(`printing: ${d.printing_number}`); }
if (!edition.issue_state && !editionPatch.issue_state && d.issue_state) { editionPatch.issue_state = d.issue_state; filled.push(`issue points: ${d.issue_state}`); }
if (!edition.isbn && !editionPatch.isbn && d.isbn) { editionPatch.isbn = d.isbn; filled.push(`ISBN: ${d.isbn}`); }
if (!edition.binding && !editionPatch.binding && d.binding) { editionPatch.binding = d.binding; filled.push(`binding: ${d.binding}`); }
}
if (Object.keys(editionPatch).length) await supabase.from('editions').update(editionPatch).eq('id', edition.id);
if (Object.keys(copyPatch).length) await supabase.from('copies').update(copyPatch).eq('id', copyId);
setFound(filled.length ? filled : ['nothing new found in the photographs']);
router.refresh();
} catch (err: any) { setMsg(err.message ?? 'Could not read the photographs.'); } finally { setBusy(null); }
}
return (
<div style={{ background: '#F2EDE0', border: '0.5px solid #C4B79C', borderRadius: '6px', padding: '1.1rem 1.2rem', marginBottom: '1.5rem' }}>
<div style={{ fontSize: '0.7rem', color: '#7E7460', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>PHOTOGRAPHS</div>
{msg && <p style={{ color: '#8C3A2B', fontSize: '0.85rem' }}>{msg}</p>}
{photos?.length > 0 && (
<div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
{photos.map((p: any, i: number) => (
<div key={i} style={{ position: 'relative' }}>
<a href={p.url} target="_blank" rel="noopener noreferrer">
<img src={p.url} alt={p.photo_type} style={{ width: 78, height: 104, objectFit: 'cover', border: '0.5px solid #C4B79C', borderRadius: '3px', display: 'block' }} />
</a>
<div style={{ fontSize: '0.6rem', color: '#8C8470', textAlign: 'center', marginTop: 2 }}>{(p.photo_type || '').replace(/_/g, ' ')}</div>
<button type="button" onClick={() => removePhoto(p.url)} disabled={busy === p.url}
style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, lineHeight: '18px', borderRadius: '50%', border: '0.5px solid #6B2620', background: '#F2EDE0', color: '#6B2620', cursor: 'pointer', fontSize: '12px', padding: 0 }}>×</button>
</div>
))}
</div>
)}
<div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
<select value={type} onChange={e => setType(e.target.value)}
style={{ padding: '0.45rem 0.6rem', border: '0.5px solid #C4B79C', borderRadius: '4px', background: '#FBF8F0', color: '#2E2A22', fontFamily: "'EB Garamond', serif", fontSize: '0.85rem' }}>
{TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
</select>
<label style={{ ...btn, display: 'inline-block' }}>
{busy === 'upload' ? 'Uploading…' : '+ Add photograph'}
<input type="file" accept="image/*" capture="environment" multiple onChange={upload} style={{ display: 'none' }} />
</label>
{photos?.length > 0 && (
<button type="button" style={btn} onClick={reread} disabled={busy === 'reread'}>
{busy === 'reread' ? 'Reading photographs…' : 'Re-read photos for missing details'}
</button>
)}
</div>
{found.length > 0 && (
<p style={{ color: '#3D5245', fontSize: '0.85rem', marginTop: '0.7rem' }}>
Found — {found.join(' · ')}
</p>
)}
</div>
);
}
