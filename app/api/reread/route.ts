export async function POST(req: Request) {
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) return Response.json({ error: 'ANTHROPIC_API_KEY is not configured.' }, { status: 501 });
const { url } = await req.json();
const img = await fetch(url);
if (!img.ok) return Response.json({ error: 'Could not fetch photo.' }, { status: 502 });
const buf = Buffer.from(await img.arrayBuffer());
const b64 = buf.toString('base64');
const mediaType = img.headers.get('content-type') || 'image/jpeg';
const response = await fetch('https://api.anthropic.com/v1/messages', {
method: 'POST',
headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
body: JSON.stringify({
model: 'claude-sonnet-4-6', max_tokens: 700,
messages: [{ role: 'user', content: [
{ type: 'image', source: { type: 'base64', media_type: mediaType.split(';')[0], data: b64 } },
{ type: 'text', text: `This is a photograph of a collectible book. Read it closely and respond with ONLY a JSON object (no fences) with these keys, using an empty string where the information is not visible:
"edition_label" — any edition statement exactly as printed ("First Edition", "Book Club Edition").
"printing_number" — CRITICAL. If the page states "FIRST PRINTING" or "First Impression" return 1. If there is a number line such as "2 4 6 8 9 7 5 3 1", return the lowest number shown. If it names a later printing return that integer.
"issue_state" — issue points visible on a dust jacket or page: the printed jacket price (e.g. "$6.95"), any date or letter code on the flap (e.g. "10/57"), publisher device, or stated points. Record exactly what you see.
"isbn" — if printed.
"binding" — if evident.
Do not infer or guess anything that is not legible in this image.` },
] }],
}),
});
if (!response.ok) return Response.json({ error: 'Read failed.' }, { status: 502 });
const data = await response.json();
const text = (data.content ?? []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
try {
const c = text.replace(/```json|```/g, '').trim();
return Response.json(JSON.parse(c.slice(c.indexOf('{'), c.lastIndexOf('}') + 1)));
} catch {
return Response.json({ error: 'Could not parse.' }, { status: 502 });
}
}
