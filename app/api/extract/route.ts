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
text: `This is a photo of a book (cover, spine, or title page). Extract what you can see and respond with ONLY a JSON object, no other text, no markdown fences, with these keys (use empty string if not visible/unknown): title, author, illustrator, publisher, pub_year, isbn, binding, genre, condition, edition_label, printing_number, issue_state, volume_number, total_volumes.
For edition_label: copy any edition statement exactly as printed ("First Edition", "Book Club Edition", "Limited Edition", "Collector's Edition"); empty string if none.
For printing_number: this is CRITICAL to value. Read the copyright page carefully. If it says "FIRST PRINTING" or "First Impression" return 1. If there is a number line such as "2 4 6 8 9 7 5 3 1" the lowest number present is the printing, so return that. If it names a later printing ("Second Printing", "Twentieth Printing") return that integer. If a Book Club Edition is indicated say so in edition_label and leave printing_number empty. Empty string only if genuinely no printing information is visible.
For issue_state: note any stated points, states or issues; empty string if none. For volume_number give just the integer if the spine or title page indicates this is one volume of several (e.g. 'VOL. II', 'Volume Second', 'Tome I' -> 2, 2, 1); empty string if it is a single-volume book. For total_volumes give the integer if stated (e.g. 'in six volumes'); empty string otherwise. Read Roman numerals and spelled-out ordinals correctly. For genre give a short label (e.g. Poetry, Novel, History, Philosophy, Children's). For condition, if the photo shows the physical book, give a standard bookseller grade (Fine, Near Fine, Very Good, Good, Fair, Poor) based on visible wear; otherwise empty string. Strip any volume designation out of the title itself — return the work's title, not 'Faerie Queene Vol. II'. Do not guess or invent information that is not visibly present in the image.`,
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
