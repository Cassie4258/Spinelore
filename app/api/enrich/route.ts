import { askJson, describe, toInt, toNum } from '../../lib/ai';
import { withCache } from '../../lib/cache';

export async function POST(req: Request) {
  const book = await req.json();
  try {
    const result = await withCache('enrich', book, async () => {
      const d = await askJson(`A book collector is cataloguing this copy. Known from photographs:

${describe(book, { full: true })}

In ONE research pass, search the web and return everything below, preferring sources specific to this publisher's edition.

A book may belong to SEVERAL groupings at once — return every one that applies:
- multi_volume_set: ONE work across several physical volumes (Gibbon's Decline and Fall in 6 vols). Cite as "Vol. III".
- work_series: distinct complete works sharing continuity by one author, read in order (A Court of Thorns and Roses). Cite as "Book 2".
- publisher_series: unrelated works under a uniform imprint (Easton Press 100 Greatest Books Ever Written). Cite as "#32".
- collected_works: one author's works issued as a matched uniform edition.
An Easton Press volume of a Sarah J. Maas novel belongs to BOTH a work_series and a publisher_series. Return both. If none apply, return an empty array.

Respond with ONLY a JSON object (no fences):
{
"genre": "short label such as Poetry, Novel, History — or empty string",
"original_pub_year": integer year the WORK first appeared, or null,
"illustrator": "illustrator of THIS edition if not already given, else empty string",
"translator": "translator of THIS edition, else empty string",
"edition_label": "only if documented for this edition, else empty string",
"groupings": [{
  "kind": "multi_volume_set" | "work_series" | "publisher_series" | "collected_works",
  "name": "CANONICAL name only — no publisher, year, format or volume-count qualifiers. Good: \\"The Faerie Queene\\". Bad: \\"The Faerie Queene (Tonson, 1758), 2-volume octavo edition\\".",
  "publisher": "for publisher_series and collected_works, else null",
  "sequence_number": integer position of THIS copy (use the volume number above if given), or null,
  "sequence_label": "'Vol. III' | 'Book 2' | '#32' | null",
  "total_known": integer total in the grouping, or null,
  "confidence": "low" | "medium" | "high",
  "reasoning": "one or two sentences"
}],
"valuation": {
  "low_estimate": plain number in USD or null,
  "high_estimate": plain number in USD or null,
  "confidence": "low" | "medium" | "high",
  "reasoning": "at most 100 words on the comparables and how printing, jacket and condition affected the range",
  "sources": at most 5 of [{"title": "...", "url": "..."}]
}
}

Do not fabricate series numbers, print runs, issue points or prices. Use null or an empty string where you cannot confirm something, and say so in the relevant reasoning. Weight sold prices above asking prices, and judge comparables against the stated condition, binding, printing and jacket status.`, { maxTokens: 5000 });
      return {
        ...d,
        original_pub_year: toInt(d.original_pub_year),
        groupings: Array.isArray(d.groupings)
          ? d.groupings.map((g: any) => ({ ...g, sequence_number: toInt(g.sequence_number), total_known: toInt(g.total_known) }))
          : [],
        valuation: d.valuation
          ? { ...d.valuation, low_estimate: toNum(d.valuation.low_estimate), high_estimate: toNum(d.valuation.high_estimate) }
          : null,
      };
    });
    return Response.json(result);
  } catch (e: any) {
    return Response.json({ error: e.message ?? 'Enrichment failed.' }, { status: 502 });
  }
}
