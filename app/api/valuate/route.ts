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
book.condition_book && `Condition: ${book.condition_book}`,
book.signed && 'Signed by the author',
book.isbn && `ISBN: ${book.isbn}`,
].filter(Boolean).join('\n');
const prompt = `I need a market value estimate for this specific book copy:
${description}
Search the web for comparable copies currently listed for sale (AbeBooks, Biblio, eBay, rare book dealers) and, if you can find any, recent sold/auction prices. Use the actual condition, binding, edition, and signed status described above to judge which comparables are relevant — a signed copy or a different binding/edition is not directly comparable to an unsigned trade edition.
After searching, respond with ONLY a JSON object (no markdown fences, no other text) with these keys:
- "low_estimate": a plain number in USD with no currency symbol, commas, or quotes (e.g. 85, not "$85" or "85.00 USD") — or null if you found no usable comparables
- "high_estimate": a plain number in USD, same format as above — or null if you found no usable comparables
- "confidence": "low", "medium", or "high" — low if few or no relevant comparables were found, high if there are multiple solid, closely matching comparables
- "reasoning": a short paragraph explaining what you found and why you landed on this range
- "sources": array of objects with "title" and "url" for the listings/comps you used (empty array if none)
Do not fabricate comparables or prices. If you can't find relevant listings, say so honestly in reasoning and set confidence to "low" with null estimates.`;
const response = await fetch('https://api.anthropic.com/v1/messages', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'x-api-key': apiKey,
'anthropic-version': '2023-06-01',
},
body: JSON.stringify({
model: 'claude-sonnet-4-6',
max_tokens: 2000,
messages: [{ role: 'user', content: prompt }],
tools: [{ type: 'web_search_20250305', name: 'web_search' }],
}),
});
if (!response.ok) {
const errText = await response.text();
return Response.json({ error: 'Valuation request failed.', detail: errText }, { status: 502 });
}
const data = await response.json();
const text = (data.content ?? [])
.filter((b: any) => b.type === 'text')
.map((b: any) => b.text)
.join('\n');
try {
const cleaned = text.replace(/```json|```/g, '').trim();
const parsed = JSON.parse(cleaned);
const toNumber = (v: any) => {
if (v == null) return null;
if (typeof v === 'number') return v;
const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
return isNaN(n) ? null : n;
};
parsed.low_estimate = toNumber(parsed.low_estimate);
parsed.high_estimate = toNumber(parsed.high_estimate);
return Response.json(parsed);
} catch {
return Response.json({ error: 'Could not parse valuation response.', raw: text }, { status: 502 });
}
}
