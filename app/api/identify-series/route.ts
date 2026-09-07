export async function POST(req: Request) {
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) return Response.json({ error: 'ANTHROPIC_API_KEY is not configured.' }, { status: 501 });
const book = await req.json();
const description = [
book.title && `Title: ${book.title}`,
book.author && `Author: ${book.author}`,
book.publisher && `Publisher: ${book.publisher}`,
book.pub_year && `Publication year: ${book.pub_year}`,
book.binding && `Binding: ${book.binding}`,
].filter(Boolean).join('\n');
const prompt = `I need to know whether this specific book edition belongs to a named, numbered publisher series or set — for example, Easton Press's "100 Greatest Books Ever Written" (this specific title might be, e.g., #86 in that series), Franklin Library's "100 Greatest Books of All Time", Heritage Press collections, or similar collector series.
Book:
${description}
Search the web to confirm whether this exact publisher's edition of this title is part of such a named series, and if so, what number/position it holds in that series (if the series is numbered).
Respond with ONLY a JSON object (no markdown fences, no other text) with these keys:
- "is_part_of_series": true or false
- "series_name": the exact series name (e.g. "100 Greatest Books Ever Written"), or null if not part of a series
- "series_publisher": the publisher of the series (e.g. "Easton Press"), or null
- "sequence_number": the number/position in the series if known (as a plain integer, no "#" or text), or null if unknown or unnumbered
- "confidence": "low", "medium", or "high"
- "reasoning": one or two sentences on what you found
If you can't confirm series membership from search results, set is_part_of_series to false and explain why in reasoning. Do not guess or fabricate a series number.`;
const response = await fetch('https://api.anthropic.com/v1/messages', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'x-api-key': apiKey,
'anthropic-version': '2023-06-01',
},
body: JSON.stringify({
model: 'claude-sonnet-4-6',
max_tokens: 1200,
messages: [{ role: 'user', content: prompt }],
tools: [{ type: 'web_search_20250305', name: 'web_search' }],
}),
});
if (!response.ok) {
const errText = await response.text();
return Response.json({ error: 'Series identification failed.', detail: errText }, { status: 502 });
}
const data = await response.json();
const text = (data.content ?? [])
.filter((b: any) => b.type === 'text')
.map((b: any) => b.text)
.join('\n');
try {
const cleaned = text.replace(/```json|```/g, '').trim();
const parsed = JSON.parse(cleaned);
if (parsed.sequence_number != null) {
const n = parseInt(String(parsed.sequence_number).replace(/[^0-9]/g, ''));
parsed.sequence_number = isNaN(n) ? null : n;
}
return Response.json(parsed);
} catch {
return Response.json({ error: 'Could not parse series response.', raw: text }, { status: 502 });
}
}
