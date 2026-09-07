import { askJson, describe } from '../../lib/ai';
import { withCache } from '../../lib/cache';

export async function POST(req: Request) {
  const book = await req.json();
  try {
    const result = await withCache('history', book, () => askJson(`I am a book collector cataloguing this copy:

${describe(book)}

Search the web and write a collector's briefing. Respond with ONLY a JSON object (no fences):
- "summary": 2–3 sentences on what the work is and why it matters.
- "history": one paragraph on the publication and reception history of the work.
- "edition_notes": one paragraph on THIS publisher's edition specifically — illustrator, translator, binding, series membership, print run, issue points, known variants. If you cannot find edition-specific information, say so plainly rather than guessing.
- "collector_significance": one of "Low", "Moderate", "Notable", "High", "Exceptional".
- "significance_reason": one sentence justifying it.
- "sources": at most 6 objects of {"title","url"}.

Keep each prose field under 120 words. Do not fabricate facts, print runs or issue points, and distinguish what is documented from what is inferred.`, { maxTokens: 3000 }));
    return Response.json(result);
  } catch (e: any) {
    return Response.json({ error: e.message ?? 'History lookup failed.' }, { status: 502 });
  }
}
