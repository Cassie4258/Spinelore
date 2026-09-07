export const KIND_LABEL: Record<string, string> = {
multi_volume_set: 'Multi-volume set',
work_series: 'Series',
publisher_series: "Publisher's series",
collected_works: 'Collected works',
};
export const KIND_UNIT: Record<string, string> = {
multi_volume_set: 'volume',
work_series: 'book',
publisher_series: 'title',
collected_works: 'volume',
};
export function seqLabel(kind: string, n: number | null | undefined, stored?: string | null) {
if (stored) return stored;
if (n == null) return null;
if (kind === 'multi_volume_set' || kind === 'collected_works') return `Vol. ${n}`;
if (kind === 'work_series') return `Book ${n}`;
return `#${n}`;
}
export function completeness(kind: string, owned: number, total: number | null) {
const unit = KIND_UNIT[kind] ?? 'title';
const plural = (n: number) => `${unit}${n === 1 ? '' : 's'}`;
if (!total) return `${owned} ${plural(owned)} owned`;
const missing = total - owned;
if (missing <= 0) {
if (kind === 'multi_volume_set' || kind === 'collected_works') return `Complete in ${total} ${plural(total)}`;
return `Complete run — all ${total} ${plural(total)}`;
}
if (kind === 'multi_volume_set') return `${owned} of ${total} ${plural(total)} — broken set`;
if (kind === 'collected_works') return `${owned} of ${total} ${plural(total)} — incomplete`;
if (kind === 'work_series') return `${owned} of ${total} ${plural(total)} in the series`;
return `${owned} of ${total} — incomplete run`;
}
export function matchingNote(kind: string) {
if (kind === 'multi_volume_set') return 'Volumes should match in binding and printing; a made-up set from mismatched printings is worth considerably less.';
if (kind === 'publisher_series' || kind === 'collected_works') return 'Uniform binding across the run matters to collectors.';
return null;
}
