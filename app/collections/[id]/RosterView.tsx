'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { KIND_UNIT, completeness, matchingNote, seqLabel } from '../../lib/groupings';
const btn = { background: 'transparent', border: '1px solid #C4B79C', color: '#4A4335', padding: '0.5rem 1rem', cursor: 'pointer', fontFamily: "'EB Garamond', serif", fontSize: '0.85rem' };
function norm(s: string) { return (s || '').toLowerCase().replace(/^(the|a|an)\s+/, '').replace(/[^a-z0-9 ]/g, '').trim(); }
export default function RosterView({ set, ownedTitles }: any) {
const router = useRouter();
const [busy, setBusy] = useState(false);
const [msg, setMsg] = useState<string | null>(null);
const [q, setQ] = useState('');
const [filter, setFilter] = useState<'all' | 'owned' | 'missing'>('all');
const roster = set.roster?.titles ?? [];
const ownedSet = useMemo(() => new Set(ownedTitles.map(norm)), [ownedTitles]);
const rows = useMemo(() => {
const r = roster.map((t: any) => ({ ...t, owned: ownedSet.has(norm(t.title)) }));
const needle = norm(q);
return r.filter((t: any) => {
if (filter === 'owned' && !t.owned) return false;
if (filter === 'missing' && t.owned) return false;
if (!needle) return true;
return norm(t.title).includes(needle) || norm(t.author || '').includes(needle);
});
}, [roster, ownedSet, q, filter]);
const ownedCount = roster.filter((t: any) => ownedSet.has(norm(t.title))).length;
async function fetchRoster() {
setBusy(true); setMsg(null);
try {
const res = await fetch('/api/roster', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seriesName: set.name, publisher: set.publisher, kind: set.kind }) });
const d = await res.json();
if (!res.ok) throw new Error(d.error || 'Lookup failed');
await supabase.from('sets').update({ roster: d, total_known: d.total_known ?? (d.titles?.length ?? null), roster_fetched_at: new Date().toISOString() }).eq('id', set.id);
router.refresh();
} catch (e: any) { setMsg(e.message); } finally { setBusy(false); }
}
const isSet = set.kind === 'multi_volume_set';
const totalKnown = set.total_known ?? null;
const complete = isSet && totalKnown != null && ownedTitles.length >= totalKnown;
if (roster.length === 0) {
return (
<div>
{msg && <p style={{ color: '#8C3A2B' }}>{msg}</p>}
{complete && (
<div style={{ background: '#E7EFE4', border: '0.5px solid #3D5245', borderRadius: '6px', padding: '0.9rem 1rem', marginBottom: '1rem' }}>
<div style={{ fontSize: '0.7rem', color: '#3D5245', letterSpacing: '0.1em' }}>COMPLETE SET</div>
<p style={{ color: '#2E2A22', fontSize: '0.9rem', margin: '0.3rem 0 0', lineHeight: 1.5 }}>
You hold all {totalKnown} volumes. A complete matched set is normally worth considerably more than its volumes valued separately — re-run the valuation on any volume and it will now be priced as a complete set.
</p>
</div>
)}
<p style={{ color: '#6E6552', fontSize: '0.9rem' }}>The full list for this set/series hasn’t been looked up yet.</p>
<button type="button" style={btn} onClick={fetchRoster} disabled={busy}>{busy ? 'Researching the full list…' : 'Look up every title in this set/series'}</button>
</div>
);
}
const tab = (on: boolean) => ({ ...btn, marginRight: '0.5rem', background: on ? '#3D5245' : 'transparent', color: on ? '#F2EDE0' : '#4A4335', borderColor: on ? '#3D5245' : '#C4B79C' });
return (
<div>
{msg && <p style={{ color: '#8C3A2B' }}>{msg}</p>}
{complete && (
<div style={{ background: '#E7EFE4', border: '0.5px solid #3D5245', borderRadius: '6px', padding: '0.9rem 1rem', marginBottom: '1rem' }}>
<div style={{ fontSize: '0.7rem', color: '#3D5245', letterSpacing: '0.1em' }}>COMPLETE SET</div>
<p style={{ color: '#2E2A22', fontSize: '0.9rem', margin: '0.3rem 0 0', lineHeight: 1.5 }}>
You hold all {totalKnown} volumes. A complete matched set is normally worth considerably more than its volumes valued separately — re-run the valuation on any volume and it will be priced as a complete set.
</p>
</div>
)}
<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
<div><div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', color: '#2E2A22' }}>{ownedCount}</div><div style={{ fontSize: '0.7rem', color: '#6E6552', letterSpacing: '0.08em' }}>OWNED</div></div>
<div><div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', color: '#8C3A2B' }}>{roster.length - ownedCount}</div><div style={{ fontSize: '0.7rem', color: '#6E6552', letterSpacing: '0.08em' }}>MISSING</div></div>
<div><div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', color: '#4A4335' }}>{Math.round((ownedCount / roster.length) * 100)}%</div><div style={{ fontSize: '0.7rem', color: '#6E6552', letterSpacing: '0.08em' }}>COMPLETE</div></div>
</div>
{matchingNote(set.kind) && <p style={{ color: '#6E6552', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '0.5rem', fontStyle: 'italic' }}>{matchingNote(set.kind)}</p>}
{set.roster?.note && <p style={{ color: '#6E6552', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '1rem' }}>{set.roster.note}</p>}
<input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by title or author…"
style={{ width: '100%', padding: '0.6rem 0.75rem', border: '0.5px solid #C4B79C', borderRadius: '4px', background: '#FBF8F0', color: '#2E2A22', fontFamily: "'EB Garamond', serif", fontSize: '1rem', boxSizing: 'border-box', marginBottom: '0.75rem', outline: 'none' }} />
<div style={{ marginBottom: '1rem' }}>
<button type="button" style={tab(filter === 'all')} onClick={() => setFilter('all')}>All {roster.length}</button>
<button type="button" style={tab(filter === 'owned')} onClick={() => setFilter('owned')}>Owned {ownedCount}</button>
<button type="button" style={tab(filter === 'missing')} onClick={() => setFilter('missing')}>Missing {roster.length - ownedCount}</button>
</div>
{rows.length === 0 && <p style={{ color: '#6E6552', fontSize: '0.9rem' }}>Nothing matches that search.</p>}
{rows.map((t: any, i: number) => (
<div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline', padding: '0.6rem 0', borderBottom: '1px solid #C4B79C55' }}>
<span style={{ width: 52, textAlign: 'right', color: '#8C8470', fontSize: '0.75rem', flexShrink: 0 }}>{seqLabel(set.kind, t.sequence_number) ?? '—'}</span>
<span style={{ color: t.owned ? '#3D5245' : '#8C8470', flexShrink: 0 }}>{t.owned ? '●' : '○'}</span>
<span style={{ flex: 1 }}>
<span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.05rem', color: t.owned ? '#2E2A22' : '#6E6552' }}>{t.title}</span>
{t.author && <span style={{ color: '#8C8470', fontSize: '0.8rem', marginLeft: '0.5rem' }}>{t.author}</span>}
</span>
</div>
))}
<button type="button" style={{ ...btn, marginTop: '1.25rem' }} onClick={fetchRoster} disabled={busy}>{busy ? 'Refreshing…' : 'Refresh this list'}</button>
</div>
);
}
