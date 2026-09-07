import { askJson, describe, toNum } from '../../lib/ai';
import { withCache } from '../../lib/cache';

export async function POST(req: Request) {
  const book = await req.json();
  try {
    const result = await withCache('valuate', book, async () => {
      const d = await askJson(`I need a market value estimate for this specific book copy:

${describe(book, { full: true })}

Search the web for comparable copies currently listed for sale (AbeBooks, Biblio, eBay, rare-book dealers) and, where you can find them, recent sold or auction prices.

The printing status above is authoritative — it was read from the copyright page or entered by the owner. If a printing is given you MUST NOT describe it as unknown or unspecified; price that exact printing. "First Edition" with a printing above 1 means a later printing of the first edition: worth far less than a true first printing, but meaningfully MORE than a much later printing. Early printings (2nd–5th) sit in their own tier above the common later run — never lump them in with 20th-printing copies.

Weight these correctly, because they dominate value:
- PRINTING: a stated first printing of a significant 20th-century book is worth many times a later printing of the same year. A Book Club Edition is worth a small fraction of a trade first.
- DUST JACKET: for 20th-century firsts the jacket is frequently the majority of the value. Never average jacketed and unjacketed comparables together.
- If the copy is one volume of a multi-volume set, price it as an ODD VOLUME unless told the set is complete; if complete, price the SET and say so.
Weight sold prices far above asking prices, and adjust explicitly for any comparable that differs in printing, jacket or condition.

Respond with ONLY a JSON object (no markdown fences):
- "low_estimate": plain number in USD, no symbols or commas, or null if no usable comparables
- "high_estimate": same format, or null
- "confidence": "low" | "medium" | "high"
- "reasoning": AT MOST 120 words — name the comparables that mattered and how printing, jacket and condition moved the number
- "sources": at most 5 objects with short "title" and "url"

Do not fabricate comparables or prices. If you cannot find relevant listings, say so and set confidence to "low" with null estimates.`, { maxTokens: 4000 });
      return { ...d, low_estimate: toNum(d.low_estimate), high_estimate: toNum(d.high_estimate) };
    });
    return Response.json(result);
  } catch (e: any) {
    return Response.json({ error: e.message ?? 'Valuation failed.' }, { status: 502 });
  }
}
