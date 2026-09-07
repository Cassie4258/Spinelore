import { parseAiJson } from '../../lib/aijson';
export async function POST(req: Request) {
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) return Response.json({ error: 'ANTHROPIC_API_KEY is not configured.' }, { status: 501 });
const book = await req.json();
const known = [
book.title && `Title: ${book.title}`,
book.author && `Author: ${book.author}`,
book.illustrator && `Illustrator: ${book.illustrator}`,
book.publisher && `Publisher: ${book.publisher}`,
book.pub_year && `Publication year: ${book.pub_year}`,
book.binding && `Binding: ${book.binding}`,
book.isbn && `ISBN: ${book.isbn}`,
book.condition_book && `Condition: ${book.condition_book}`,
book.volume_number && `This copy is volume ${book.volume_number}`,
book.total_volumes && `The set comprises ${book.total_volumes} volumes`,
book.signed && 'Signed by the author',
].filter(Boolean).join('\n');
const prompt = `A book collector is cataloguing this copy. Here is what is already known from photographs:

${known}

In ONE research pass, search the web and return everything below. Prefer sources specific to this publisher's edition.

Respond with ONLY a JSON object (no markdown fences, no other text):
{
"genre": "short label such as Poetry, Novel, History, Philosophy, Drama, Children's — or empty string if unclear",
"original_pub_year": integer year the WORK was first published (not this edition), or null,
"illustrator": "illustrator of THIS edition if known and not already given, else empty string",
"translator": "translator of THIS edition if known, else empty string",
"edition_label": "e.g. 'Collector's Edition', 'First Edition', 'Limited Edition' — only if documented for this edition, else empty string",
"groupings": [
  {
    "kind": "multi_volume_set" | "work_series" | "publisher_series" | "collected_works",
    "name": "CANONICAL name only — the work or series title as commonly catalogued. Do NOT append qualifiers like publisher, year, format or volume count. Good: \"The Faerie Queene\". Bad: \"The Faerie Queene (Tonson, 1758), 2-volume octavo edition\".",
    "publisher": "publisher, for publisher_series and collected_works; otherwise null",
    "sequence_number": integer position of THIS copy in the grouping (use the volume number stated above if given), or null,
    "sequence_label": "how collectors cite the position: 'Vol. III', 'Book 2', '#32', or null",
    "total_known": integer total volumes/titles in the grouping, or null,
    "confidence": "low" | "medium" | "high",
    "reasoning": "one or two sentences"
  }
],
"valuation": {
  "low_estimate": plain number in USD (no symbols/commas/quotes) or null,
  "high_estimate": plain number in USD or null,
  "confidence": "low" | "medium" | "high",
  "reasoning": "at most 100 words on the comparables and how printing, jacket and condition affected the range",
  "sources": at most 5 of [{"title": "...", "url": "..."}]
}
}

Definitions for "groupings" — a book may belong to SEVERAL at once, so return every one that applies:
- multi_volume_set: ONE work issued across several physical volumes (e.g. Gibbon's Decline and Fall in 6 vols). Cite position as "Vol. III".
- work_series: distinct complete works sharing continuity by one author, read in order (e.g. A Court of Thorns and Roses). Cite as "Book 2".
- publisher_series: unrelated works issued under a uniform publisher imprint (e.g. Easton Press 100 Greatest Books Ever Written, Loeb Classical Library). Cite as "#32".
- collected_works: multiple distinct works issued together as one matched uniform edition (e.g. The Works of Dickens in 20 vols).
Example: an Easton Press volume of a Sarah J. Maas novel belongs to BOTH a work_series and a publisher_series. Return both. If it belongs to none, return an empty array.

Rules: do not fabricate series numbers, print runs, issue points, or prices. If you cannot confirm something, use null or an empty string and say so in the relevant reasoning field. For valuation weight actual sold prices above asking prices, and judge comparables against the stated condition, binding, edition and signed status.`;
const response = await fetch('https://api.anthropic.com/v1/messages', {
method: 'POST',
headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
body: JSON.stringify({
model: 'claude-sonnet-4-6', max_tokens: 5000,
messages: [{ role: 'user', content: prompt }],
tools: [{ type: 'web_search_20250305', name: 'web_search' }],
}),
});
if (!response.ok) return Response.json({ error: 'Enrichment failed.', detail: await response.text() }, { status: 502 });
const data = await response.json();
const text = (data.content ?? []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n');
{
const parsedRaw = parseAiJson(text);
if (!parsedRaw) return Response.json({ error: 'Could not parse the response.', raw: text.slice(0, 400) }, { status: 502 });
const cleaned = '';
const parsed = JSON.parse(cleaned.slice(cleaned.indexOf('{'), cleaned.lastIndexOf('}') + 1));
const num = (v: any) => { if (v == null) return null; if (typeof v === 'number') return v; const n = parseFloat(String(v).replace(/[^0-9.]/g, '')); return isNaN(n) ? null : n; };
const int = (v: any) => { if (v == null) return null; const n = parseInt(String(v).replace(/[^0-9]/g, '')); return isNaN(n) ? null : n; };
if (parsed.valuation) { parsed.valuation.low_estimate = num(parsed.valuation.low_estimate); parsed.valuation.high_estimate = num(parsed.valuation.high_estimate); }
if (Array.isArray(parsed.groupings)) parsed.groupings = parsed.groupings.map((g: any) => ({ ...g, sequence_number: int(g.sequence_number), total_known: int(g.total_known) }));
else parsed.groupings = [];
parsed.original_pub_year = int(parsed.original_pub_year);
return Response.json(parsed);
}
}
