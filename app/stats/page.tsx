import { supabase } from '../lib/supabase';
export const dynamic = 'force-dynamic';
async function getCacheStats() {
const { data } = await supabase.from('research_cache').select('kind, hits');
const rows = data ?? [];
const saved = rows.reduce((n: number, r: any) => n + (r.hits ?? 0), 0);
return { entries: rows.length, saved };
}
async function getData() {
const { data: copies } = await supabase
.from('copies')
.select(`
id, signed, purchase_price,
editions ( publisher, pub_year ),
value_estimates ( low_estimate, high_estimate, estimated_at )
`);
return copies ?? [];
}
function normPub(p: any) {
if (!p) return 'Unknown';
return String(p).replace(/^the\s+/i, '').trim();
}
function latestEstimate(estimates: any[]) {
if (!estimates || estimates.length === 0) return null;
return [...estimates].sort(
(a, b) => new Date(b.estimated_at).getTime() - new Date(a.estimated_at).getTime()
)[0];
}
function midValue(est: any) {
if (!est) return 0;
if (est.low_estimate != null && est.high_estimate != null) return (est.low_estimate + est.high_estimate) / 2;
return est.low_estimate ?? est.high_estimate ?? 0;
}
function BarChart({ data, width = 620, height = 220, money = true }: { data: { label: string; value: number }[]; width?: number; height?: number; money?: boolean }) {
const max = Math.max(...data.map(d => d.value), 1);
const barWidth = Math.min(50, (width - 40) / data.length - 10);
const gap = (width - 40 - barWidth * data.length) / Math.max(data.length - 1, 1);
return (
<svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
{data.map((d, i) => {
const barHeight = (d.value / max) * (height - 60);
const x = 30 + i * (barWidth + gap);
const y = height - 40 - barHeight;
return (
<g key={d.label}>
<rect x={x} y={y} width={barWidth} height={barHeight} fill="#3D5245" opacity={0.9} />
<text x={x + barWidth / 2} y={height - 22} fill="#6E6552" fontSize="11" textAnchor="middle" fontFamily="EB Garamond, serif">
{d.label}
</text>
<text x={x + barWidth / 2} y={y - 6} fill="#3D5245" fontSize="11" textAnchor="middle" fontFamily="EB Garamond, serif">
{money ? (d.value >= 1000 ? `$${(d.value / 1000).toFixed(1)}k` : `$${Math.round(d.value)}`) : String(d.value)}
</text>
</g>
);
})}
<line x1="30" y1={height - 40} x2={width - 10} y2={height - 40} stroke="#C4B79C" strokeWidth="1" />
</svg>
);
}
export default async function Stats() {
const copies = await getData();
const cache = await getCacheStats();
const totalVolumes = copies.length;
const values = copies.map(c => midValue(latestEstimate(c.value_estimates)));
const totalValue = values.reduce((a, b) => a + b, 0);
const valuedCount = values.filter(v => v > 0).length;
const signedCount = copies.filter((c: any) => c.signed).length;
const byPublisher: Record<string, number> = {};
copies.forEach((c: any) => {
const pub = normPub(c.editions?.publisher);
byPublisher[pub] = (byPublisher[pub] || 0) + midValue(latestEstimate(c.value_estimates));
});
const publisherData = Object.entries(byPublisher)
.sort((a, b) => b[1] - a[1])
.slice(0, 6)
.map(([label, value]) => ({ label: label.length > 12 ? label.slice(0, 11) + '…' : label, value }));
const byDecade: Record<string, number> = {};
copies.forEach((c: any) => {
const year = c.editions?.pub_year;
if (!year) return;
const decade = `${Math.floor(year / 10) * 10}s`;
byDecade[decade] = (byDecade[decade] || 0) + 1;
});
const decadeData = Object.entries(byDecade)
.sort((a, b) => a[0].localeCompare(b[0]))
.map(([label, value]) => ({ label, value }));
const statBox = {
border: '1px solid #C4B79C',
padding: '1.25rem 1.5rem',
flex: '1 1 140px',
};
const statNumber = {
fontFamily: "'Cormorant Garamond', serif",
fontSize: '2rem',
color: '#2E2A22',
};
const statLabel = {
fontSize: '0.75rem',
color: '#6E6552',
letterSpacing: '0.08em',
marginTop: '0.3rem',
};
return (
<div>
<h2 style={{
fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
fontWeight: 500, fontSize: '1.8rem', color: '#2E2A22', margin: '0 0 1.5rem',
}}>
Collection Intelligence
</h2>
<div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
<div style={statBox}>
<div style={statNumber}>{totalVolumes}</div>
<div style={statLabel}>TOTAL VOLUMES</div>
</div>
<div style={statBox}>
<div style={statNumber}>${Math.round(totalValue).toLocaleString()}</div>
<div style={statLabel}>ESTIMATED VALUE ({valuedCount} valued)</div>
</div>
<div style={statBox}>
<div style={statNumber}>{signedCount}</div>
<div style={statLabel}>SIGNED COPIES</div>
</div>
<div style={statBox}>
<div style={statNumber}>
{totalVolumes > 0 ? `$${Math.round(totalValue / totalVolumes).toLocaleString()}` : '—'}
</div>
<div style={statLabel}>AVG. VALUE / VOLUME</div>
</div>
</div>
{publisherData.length > 0 && (
<div style={{ marginBottom: '2.5rem' }}>
<h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', color: '#4A4335', marginBottom: '1rem' }}>
Value by Publisher
</h3>
<BarChart data={publisherData} />
</div>
)}
{decadeData.length > 0 && (
<div>
<h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', color: '#4A4335', marginBottom: '1rem' }}>
Volumes by Decade Published
</h3>
<BarChart data={decadeData} money={false} />
</div>
)}
{cache.entries > 0 && (
<div style={{ marginTop: '2.5rem', background: '#F2EDE0', border: '0.5px solid #C4B79C', borderRadius: '6px', padding: '1rem 1.1rem' }}>
<div style={{ fontSize: '0.7rem', color: '#7E7460', letterSpacing: '0.1em' }}>RESEARCH CACHE</div>
<p style={{ color: '#6E6552', fontSize: '0.85rem', margin: '0.4rem 0 0', lineHeight: 1.5 }}>
{cache.entries} {cache.entries === 1 ? 'result' : 'results'} stored · {cache.saved} repeat {cache.saved === 1 ? 'lookup' : 'lookups'} served without a new web search.
</p>
</div>
)}
{totalVolumes === 0 && (
<p style={{ color: '#6E6552' }}>Add some books to the archive to see stats here.</p>
)}
</div>
);
}
