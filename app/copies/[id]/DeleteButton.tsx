'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
export default function DeleteButton({ copyId, title }: { copyId: string; title: string }) {
const router = useRouter();
const [confirming, setConfirming] = useState(false);
const [deleting, setDeleting] = useState(false);
async function handleDelete() {
setDeleting(true);
const { error } = await supabase.from('copies').delete().eq('id', copyId);
if (error) { alert('Could not remove this volume: ' + error.message); setDeleting(false); return; }
router.push('/');
router.refresh();
}
if (!confirming) {
return (
<button type="button" onClick={() => setConfirming(true)} style={{
background: 'transparent', border: '1px solid #4a3d2c', color: '#8a7a5c',
padding: '0.5rem 1rem', cursor: 'pointer', fontFamily: "'EB Garamond', serif", fontSize: '0.85rem',
}}>Remove from Archive</button>
);
}
return (
<div style={{ border: '1px solid #6b3524', padding: '1rem', background: '#1f1410' }}>
<p style={{ color: '#e8dcc0', margin: '0 0 0.75rem', fontSize: '0.95rem' }}>
Remove <em>{title}</em> from the archive? Photos and valuation history for this copy will be deleted too.
</p>
<div style={{ display: 'flex', gap: '0.75rem' }}>
<button type="button" onClick={handleDelete} disabled={deleting} style={{
background: '#4a2318', border: '1px solid #6b3524', color: '#e8dcc0',
padding: '0.5rem 1rem', cursor: 'pointer', fontFamily: "'EB Garamond', serif", fontSize: '0.85rem',
}}>{deleting ? 'Removing…' : 'Yes, remove it'}</button>
<button type="button" onClick={() => setConfirming(false)} style={{
background: 'transparent', border: '1px solid #4a3d2c', color: '#c4b490',
padding: '0.5rem 1rem', cursor: 'pointer', fontFamily: "'EB Garamond', serif", fontSize: '0.85rem',
}}>Cancel</button>
</div>
</div>
);
}
