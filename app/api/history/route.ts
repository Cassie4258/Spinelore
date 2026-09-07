import { parseAiJson } from '../../lib/aijson';
export async function POST(req: Request) {
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) return Response.json({ error: 'ANTHROPIC_API_KEY is not configured.' }, { status: 501 });
const book = await req.json();
const description = [
book.title && `Title: ${book.title}`,
book.author && `Author: ${book.author}`,
book.publisher && `Publisher: ${book.publisher}`,
book.pub_year && `Publication year: ${book.pub_year}`,
book.edition_label && `Edition: ${book.edition_label}`,
book.printing_number && `Printing: ${book.printing_number}`,
book.binding && `Binding: ${book.binding}`,
book.isbn && `ISBN: ${book.isbn}`,
].filter(Boolean).join('\n');
const prompt = `I am a book collector cataloguing this specific copy:
${description}
Search the web and write a collector's briefing on it. Respond with ONLY a JSON object (no markdown fences) with these keys:
- "summary": 2-3 sentences on what the work is and why it matters.
- "history": one paragraph on the publication and reception history of the work.
- "edition_notes": one paragraph specifically about THIS publisher's edition — what distinguishes it (illustrator, translator, binding, series membership, print run, issue points, known variants, anything a collector should know). If you cannot find edition-specific information, say so plainly rather than guessing.
- "collector_significance": one of "Low", "Moderate", "Notable", "High", "Exceptional", with a one-sentence justification in "significance_reason".
- "sources": at most 6 objects of {"title","url"}. Keep each of the prose fields under 120 words.
Do not fabricate facts, print runs, or issue points. Distinguish clearly between what is documented and what is inferred.`;
const response = await fetch('https://api.anthropic.com/v1/messages', {
method: 'POST',
headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
body: JSON.stringify({
model: 'claude-sonnet-4-6', max_tokens: 3000,
messages: [{ role: 'user', content: prompt }],
tools: [{ type: 'web_search_20250305', name: 'web_search' }],
}),
});
if (!response.ok) return Response.json({ error: 'History request failed.', detail: await response.text() }, { status: 502 });
const data = await response.json();
const text = (data.content ?? []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n');
{
const parsedRaw = parseAiJson(text);
if (!parsedRaw) return Response.json({ error: 'Could not parse the response.', raw: text.slice(0, 400) }, { status: 502 });
const cleaned = '';
const start = cleaned.indexOf('{'); const end = cleaned.lastIndexOf('}');
return Response.json(JSON.parse(cleaned.slice(start, end + 1)));
}
}
