import { supabase } from '../../lib/supabase';
import RosterView from './RosterView';
import { KIND_LABEL } from '../../lib/groupings';
export const dynamic = 'force-dynamic';
export default async function CollectionDetail({ params }: { params: { id: string } }) {
const { data: set } = await supabase.from('sets').select('id, name, kind, publisher, description, total_known, roster, roster_fetched_at, requires_matching').eq('id', params.id).maybeSingle();
if (!set) return <p style={{ color: '#8a7a5c' }}>Collection not found.</p>;
const { data: members } = await supabase.from('set_members').select('sequence_number, works ( title )').eq('set_id', params.id);
const ownedTitles = (members ?? []).map((m: any) => m.works?.title).filter(Boolean);
return (
<div>
<a href="/collections" style={{ color: '#8a7a5c', fontSize: '0.85rem', textDecoration: 'none' }}>← All sets &amp; series</a>
<div style={{ fontSize: '0.65rem', color: '#8a7a5c', letterSpacing: '0.1em', marginTop: '1rem' }}>{(KIND_LABEL[set.kind] ?? 'Grouping').toUpperCase()}</div>
<h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontSize: '1.9rem', color: '#e8dcc0', margin: '1rem 0 0.25rem' }}>{set.name}</h2>
{set.publisher && <p style={{ color: '#8a7a5c', margin: '0 0 1.5rem' }}>{set.publisher}</p>}
<RosterView set={set} ownedTitles={ownedTitles} />
</div>
);
}
