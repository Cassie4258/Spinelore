import { parseAiJson } from './aijson';

/** One place that knows how to ask Claude for JSON, with or without web search. */
export async function askJson(prompt: string, opts: { maxTokens?: number; search?: boolean } = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured.');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: opts.maxTokens ?? 3000,
      messages: [{ role: 'user', content: prompt }],
      ...(opts.search === false ? {} : { tools: [{ type: 'web_search_20250305', name: 'web_search' }] }),
    }),
  });
  if (!res.ok) throw new Error(`Claude request failed: ${res.status}`);
  const data = await res.json();
  const text = (data.content ?? []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n');
  const parsed = parseAiJson(text);
  if (!parsed) throw new Error('Could not parse the response.');
  return parsed;
}

export const toNum = (v: any) => {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : n;
};
export const toInt = (v: any) => {
  if (v == null) return null;
  const n = parseInt(String(v).replace(/[^0-9]/g, ''));
  return isNaN(n) ? null : n;
};

/** Describe a copy once, for every prompt that needs it. */
export function describe(b: any, opts: { full?: boolean } = {}) {
  const lines = [
    b.title && `Title: ${b.title}`,
    b.author && `Author: ${b.author}`,
    b.illustrator && `Illustrator: ${b.illustrator}`,
    b.publisher && `Publisher: ${b.publisher}`,
    b.pub_year && `Publication year: ${b.pub_year}`,
    b.edition_label && `Edition statement: ${b.edition_label}`,
    b.printing_number && `Printing: ${b.printing_number}${String(b.printing_number).trim() === '1'
      ? ' — FIRST PRINTING' : ' — a stated later printing, NOT the first'}`,
    b.issue_state && `Issue / state: ${b.issue_state}`,
    b.binding && `Binding: ${b.binding}`,
    b.volume_number && `This copy is volume ${b.volume_number}`,
    b.total_volumes && `The set comprises ${b.total_volumes} volumes`,
  ];
  if (opts.full) lines.push(
    b.condition_book && `Condition of book: ${b.condition_book}`,
    b.dust_jacket ? `Dust jacket: PRESENT${b.condition_jacket ? `, condition ${b.condition_jacket}` : ''}` : 'Dust jacket: not present',
    b.slipcase && 'Slipcase present',
    b.defects && `Defects: ${b.defects}`,
    b.signed && 'Signed by the author',
    b.inscribed && 'Inscribed',
    b.provenance && `Provenance: ${b.provenance}`,
    b.isbn && `ISBN: ${b.isbn}`,
    b.set_context && b.set_context,
  );
  return lines.filter(Boolean).join('\n');
}
