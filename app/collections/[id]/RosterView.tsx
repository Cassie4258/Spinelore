'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
const btn = { background: 'transparent', border: '1px solid #4a3d2c', color: '#c4b490', padding: '0.5rem 1rem', cursor: 'pointer', fontFamily: "'EB Garamond', serif", fontSize: '0.85rem' };
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
const res = await fetch('/api/roster', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seriesName: set.name, publisher: set.publisher }) });
const d = await res.json();
if (!res.ok) throw new Error(d.error || 'Lookup failed');
await supabase.from('sets').update({ roster: d, total_known: d.total_known ?? (d.titles?.length ?? null), roster_fetched_at: new Date().toISOString() }).eq('id', set.id);
router.refresh();
} catch (e: any) { setMsg(e.message); } finally { setBusy(false); }
}
if (roster.length === 0) {
return (
<div>
{msg && <p style={{ color: '#c0685a' }}>{msg}</p>}
<p style={{ color: '#8a7a5c', fontSize: '0.9rem' }}>The full list of volumes in this collection hasn’t been looked up yet.</p>
<button type="button" style={btn} onClick={fetchRoster} disabled={busy}>{busy ? 'Researching the full series…' : 'Look up all volumes in this collection'}</button>
</div>
);
}
const tab = (on: boolean) => ({ ...btn, marginRight: '0.5rem', background: on ? '#b8923f' : 'transparent', color: on ? '#15100b' : '#c4b490', borderColor: on ? '#b8923f' : '#4a3d2c' });
return (
<div>
{msg && <p style={{ color: '#c0685a' }}>{msg}</p>}
<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
<div><div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', color: '#e8dcc0' }}>{ownedCount}</div><div style={{ fontSize: '0.7rem', color: '#8a7a5c', letterSpacing: '0.08em' }}>OWNED</div></div>
<div><div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', color: '#c0685a' }}>{roster.length - ownedCount}</div><div style={{ fontSize: '0.7rem', color: '#8a7a5c', letterSpacing: '0.08em' }}>MISSING</div></div>
<div><div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', color: '#c4b490' }}>{Math.round((ownedCount / roster.length) * 100)}%</div><div style={{ fontSize: '0.7rem', color: '#8a7a5c', letterSpacing: '0.08em' }}>COMPLETE</div></div>
</div>
{set.roster?.note && <p style={{ color: '#8a7a5c', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '1rem' }}>{set.roster.note}</p>}
<input value={q} onChange={e => setQ(e.target.value)} placeholder="Search this collection by title or author…"
style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #3a2f20', background: '#1a1410', color: '#e8dcc0', fontFamily: "'EB Garamond', serif", fontSize: '1rem', boxSizing: 'border-box', marginBottom: '0.75rem', outline: 'none' }} />
<div style={{ marginBottom: '1rem' }}>
<button type="button" style={tab(filter === 'all')} onClick={() => setFilter('all')}>All {roster.length}</button>
<button type="button" style={tab(filter === 'owned')} onClick={() => setFilter('owned')}>Owned {ownedCount}</button>
<button type="button" style={tab(filter === 'missing')} onClick={() => setFilter('missing')}>Missing {roster.length - ownedCount}</button>
</div>
{rows.length === 0 && <p style={{ color: '#8a7a5c', fontSize: '0.9rem' }}>Nothing matches that search.</p>}
{rows.map((t: any, i: number) => (
<div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline', padding: '0.6rem 0', borderBottom: '1px solid #29221755' }}>
<span style={{ width: 34, textAlign: 'right', color: '#5c5040', fontSize: '0.8rem', flexShrink: 0 }}>{t.sequence_number ?? '—'}</span>
<span style={{ color: t.owned ? '#8faa7a' : '#5c5040', flexShrink: 0 }}>{t.owned ? '●' : '○'}</span>
<span style={{ flex: 1 }}>
<span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.05rem', color: t.owned ? '#e8dcc0' : '#8a7a5c' }}>{t.title}</span>
{t.author && <span style={{ color: '#5c5040', fontSize: '0.8rem', marginLeft: '0.5rem' }}>{t.author}</span>}
</span>
</div>
))}
<button type="button" style={{ ...btn, marginTop: '1.25rem' }} onClick={fetchRoster} disabled={busy}>{busy ? 'Refreshing…' : 'Refresh the series list'}</button>
</div>
);
}
