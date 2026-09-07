/** Extract JSON from a model reply, repairing truncated output where possible. */
export function parseAiJson(text: string): any | null {
if (!text) return null;
const cleaned = text.replace(/```json|```/g, '').trim();
const start = cleaned.indexOf('{');
if (start === -1) return null;
const body = cleaned.slice(start);
// 1. straightforward parse
const end = body.lastIndexOf('}');
if (end > 0) {
try { return JSON.parse(body.slice(0, end + 1)); } catch {}
}
// 2. repair truncation: close any open string, then close open brackets
try {
let s = body;
const quotes = (s.match(/(?<!\\)"/g) || []).length;
if (quotes % 2 === 1) s += '"';
const opens = (s.match(/\{/g) || []).length, closes = (s.match(/\}/g) || []).length;
const aOpens = (s.match(/\[/g) || []).length, aCloses = (s.match(/\]/g) || []).length;
s = s.replace(/,\s*$/, '');
s += ']'.repeat(Math.max(0, aOpens - aCloses));
s += '}'.repeat(Math.max(0, opens - closes));
return JSON.parse(s);
} catch {}
// 3. last resort: pull the numeric fields out directly
const num = (k: string) => {
const m = body.match(new RegExp(`"${k}"\\s*:\\s*"?\\$?([0-9][0-9,.]*)`));
return m ? parseFloat(m[1].replace(/,/g, '')) : null;
};
const low = num('low_estimate'), high = num('high_estimate');
if (low != null || high != null) {
const conf = body.match(/"confidence"\s*:\s*"(low|medium|high)"/i);
const reason = body.match(/"reasoning"\s*:\s*"([\s\S]{0,1200}?)(?:"\s*[,}]|$)/);
return {
low_estimate: low, high_estimate: high,
confidence: conf ? conf[1].toLowerCase() : 'low',
reasoning: reason ? reason[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : 'Recovered from a truncated response; treat with caution.',
sources: [],
_recovered: true,
};
}
return null;
}
