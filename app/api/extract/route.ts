export async function POST(req: Request) {
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
return Response.json({ error: 'AI extraction not configured yet.' }, { status: 501 });
}
const { imageBase64, mediaType } = await req.json();
const response = await fetch('https://api.anthropic.com/v1/messages', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'x-api-key': apiKey,
'anthropic-version': '2023-06-01',
},
body: JSON.stringify({
model: 'claude-sonnet-4-6',
max_tokens: 500,
messages: [
{
role: 'user',
content: [
{
type: 'image',
source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 },
},
{
type: 'text',
text: `This is a photo of a book (cover, spine, or title page). Extract what you can see and respond with ONLY a JSON object, no other text, no markdown fences, with these keys (use empty string if not visible/unknown): title, author, illustrator, publisher, pub_year, isbn, binding, genre, condition. For genre give a short label (e.g. Poetry, Novel, History, Philosophy, Children's). For condition, if the photo shows the physical book, give a standard bookseller grade (Fine, Near Fine, Very Good, Good, Fair, Poor) based on visible wear; otherwise empty string. Do not guess or invent information that is not visibly present in the image.`,
},
],
},
],
}),
});
if (!response.ok) {
return Response.json({ error: 'AI request failed.' }, { status: 502 });
}
const data = await response.json();
const text = (data.content ?? [])
.filter((b: any) => b.type === 'text')
.map((b: any) => b.text)
.join('');
try {
const cleaned = text.replace(/```json|```/g, '').trim();
const parsed = JSON.parse(cleaned);
return Response.json(parsed);
} catch {
return Response.json({ error: 'Could not parse AI response.' }, { status: 502 });
}
}
