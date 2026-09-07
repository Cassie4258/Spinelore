export async function POST(req: Request) {
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) return Response.json({ error: 'ANTHROPIC_API_KEY is not configured.' }, { status: 501 });
const { seriesName, publisher, kind } = await req.json();
const prompt = `Find the complete list of volumes/titles in this book grouping:

Name: ${seriesName}
${kind ? `Type: ${kind} (multi_volume_set = one work across several volumes; work_series = an author's connected novels read in order; publisher_series = unrelated works under one imprint; collected_works = one author's works in a matched uniform edition)` : ''}
${publisher ? `Publisher: ${publisher}` : ''}

Search the web for a definitive list. Respond with ONLY a JSON object (no markdown fences):
{
"total_known": integer total number of volumes issued in the series, or null if not established,
"complete": true if you believe the list below is the full series, false if partial,
"note": "one sentence on the source and any caveats (e.g. the series expanded over time, numbering disputed)",
"titles": [ { "sequence_number": integer or null, "title": "...", "author": "..." } ]
}

List every volume you can confirm, ordered by sequence number where numbered. Do not invent titles to pad the list to a round number — if you can only confirm 80 of a claimed 100, return the 80 you can confirm and set complete to false.`;
const response = await fetch('https://api.anthropic.com/v1/messages', {
method: 'POST',
headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 8000, messages: [{ role: 'user', content: prompt }], tools: [{ type: 'web_search_20250305', name: 'web_search' }] }),
});
if (!response.ok) return Response.json({ error: 'Roster lookup failed.', detail: await response.text() }, { status: 502 });
const data = await response.json();
const text = (data.content ?? []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n');
try {
const cleaned = text.replace(/```json|```/g, '').trim();
return Response.json(JSON.parse(cleaned.slice(cleaned.indexOf('{'), cleaned.lastIndexOf('}') + 1)));
} catch {
return Response.json({ error: 'Could not parse roster response.', raw: text }, { status: 502 });
}
}
