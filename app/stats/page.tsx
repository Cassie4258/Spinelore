import { supabase } from '../lib/supabase';
export const dynamic = 'force-dynamic';
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
<rect x={x} y={y} width={barWidth} height={barHeight} fill="#b8923f" opacity={0.85} />
<text x={x + barWidth / 2} y={height - 22} fill="#8a7a5c" fontSize="11" textAnchor="middle" fontFamily="EB Garamond, serif">
{d.label}
</text>
<text x={x + barWidth / 2} y={y - 6} fill="#c4b490" fontSize="11" textAnchor="middle" fontFamily="EB Garamond, serif">
{money ? (d.value >= 1000 ? `$${(d.value / 1000).toFixed(1)}k` : `$${Math.round(d.value)}`) : String(d.value)}
</text>
</g>
);
})}
<line x1="30" y1={height - 40} x2={width - 10} y2={height - 40} stroke="#3a2f20" strokeWidth="1" />
</svg>
);
}
export default async function Stats() {
const copies = await getData();
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
border: '1px solid #3a2f20',
padding: '1.25rem 1.5rem',
flex: '1 1 140px',
};
const statNumber = {
fontFamily: "'Cormorant Garamond', serif",
fontSize: '2rem',
color: '#e8dcc0',
};
const statLabel = {
fontSize: '0.75rem',
color: '#8a7a5c',
letterSpacing: '0.08em',
marginTop: '0.3rem',
};
return (
<div>
<h2 style={{
fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
fontWeight: 500, fontSize: '1.8rem', color: '#e8dcc0', margin: '0 0 1.5rem',
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
<h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', color: '#c4b490', marginBottom: '1rem' }}>
Value by Publisher
</h3>
<BarChart data={publisherData} />
</div>
)}
{decadeData.length > 0 && (
<div>
<h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', color: '#c4b490', marginBottom: '1rem' }}>
Volumes by Decade Published
</h3>
<BarChart data={decadeData} money={false} />
</div>
)}
{totalVolumes === 0 && (
<p style={{ color: '#8a7a5c' }}>Add some books to the archive to see stats here.</p>
)}
</div>
);
}
