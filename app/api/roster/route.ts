import { askJson } from '../../lib/ai';
import { withCache } from '../../lib/cache';

export async function POST(req: Request) {
  const { seriesName, publisher, kind } = await req.json();
  try {
    const result = await withCache('roster', { title: seriesName, publisher }, () => askJson(`Find the complete list of volumes in this book grouping:

Name: ${seriesName}
${publisher ? `Publisher: ${publisher}` : ''}
${kind ? `Type: ${kind}` : ''}

Search the web for a definitive list. Respond with ONLY a JSON object (no fences):
{
"total_known": integer total volumes issued, or null,
"complete": true if this is the full list, false if partial,
"note": "one sentence on the source and any caveats",
"titles": [{ "sequence_number": integer or null, "title": "...", "author": "..." }]
}

List every volume you can confirm, ordered by sequence number. Do not invent titles to pad the list to a round number — if you can only confirm 80 of a claimed 100, return the 80 and set complete to false.`, { maxTokens: 8000 }));
    return Response.json(result);
  } catch (e: any) {
    return Response.json({ error: e.message ?? 'Roster lookup failed.' }, { status: 502 });
  }
}
