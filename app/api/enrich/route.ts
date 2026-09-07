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
"series": {
  "is_part_of_series": true/false,
  "series_name": "exact series name or null",
  "series_publisher": "publisher of the series or null",
  "sequence_number": integer position in series or null,
  "confidence": "low" | "medium" | "high",
  "reasoning": "one or two sentences"
},
"valuation": {
  "low_estimate": plain number in USD (no symbols/commas/quotes) or null,
  "high_estimate": plain number in USD or null,
  "confidence": "low" | "medium" | "high",
  "reasoning": "short paragraph on what comparables you found and how condition/edition/signature affected the range",
  "sources": [{"title": "...", "url": "..."}]
}
}

Rules: do not fabricate series numbers, print runs, issue points, or prices. If you cannot confirm something, use null or an empty string and say so in the relevant reasoning field. For valuation weight actual sold prices above asking prices, and judge comparables against the stated condition, binding, edition and signed status.`;
const response = await fetch('https://api.anthropic.com/v1/messages', {
method: 'POST',
headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
body: JSON.stringify({
model: 'claude-sonnet-4-6', max_tokens: 3000,
messages: [{ role: 'user', content: prompt }],
tools: [{ type: 'web_search_20250305', name: 'web_search' }],
}),
});
if (!response.ok) return Response.json({ error: 'Enrichment failed.', detail: await response.text() }, { status: 502 });
const data = await response.json();
const text = (data.content ?? []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n');
try {
const cleaned = text.replace(/```json|```/g, '').trim();
const parsed = JSON.parse(cleaned.slice(cleaned.indexOf('{'), cleaned.lastIndexOf('}') + 1));
const num = (v: any) => { if (v == null) return null; if (typeof v === 'number') return v; const n = parseFloat(String(v).replace(/[^0-9.]/g, '')); return isNaN(n) ? null : n; };
const int = (v: any) => { if (v == null) return null; const n = parseInt(String(v).replace(/[^0-9]/g, '')); return isNaN(n) ? null : n; };
if (parsed.valuation) { parsed.valuation.low_estimate = num(parsed.valuation.low_estimate); parsed.valuation.high_estimate = num(parsed.valuation.high_estimate); }
if (parsed.series) parsed.series.sequence_number = int(parsed.series.sequence_number);
parsed.original_pub_year = int(parsed.original_pub_year);
return Response.json(parsed);
} catch {
return Response.json({ error: 'Could not parse enrichment response.', raw: text }, { status: 502 });
}
}
