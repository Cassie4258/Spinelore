export const T = {
pageBg: '#E8E0D0',
pageEdge: '#C4B79C',
card: '#F2EDE0',
cardBorder: '#C4B79C',
ink: '#2E2A22',
inkSoft: '#4A4335',
muted: '#6E6552',
faint: '#7E7460',
veryFaint: '#8C8470',
green: '#3D5245',
greenDeep: '#33453A',
greenPale: '#A8BDAD',
gilt: '#E8C87A',
giltDeep: '#9c8138',
oxblood: '#6B2620',
shelfBg: '#20180F',
};
export const card = {
background: T.card,
border: `0.5px solid ${T.cardBorder}`,
borderRadius: '6px',
padding: '11px 13px',
};
export const label = {
fontSize: '0.7rem',
color: T.faint,
letterSpacing: '0.1em',
marginBottom: '0.2rem',
display: 'block' as const,
};
export const input = {
width: '100%',
padding: '0.55rem 0.7rem',
border: `0.5px solid ${T.cardBorder}`,
background: '#FBF8F0',
color: T.ink,
fontSize: '1rem',
fontFamily: "'EB Garamond', serif",
boxSizing: 'border-box' as const,
borderRadius: '4px',
outline: 'none',
};
export const btn = {
background: 'transparent',
border: `0.5px solid #A89B80`,
color: T.inkSoft,
padding: '0.5rem 0.9rem',
cursor: 'pointer',
fontFamily: "'EB Garamond', serif",
fontSize: '0.85rem',
borderRadius: '4px',
};
export const btnPrimary = {
...btn,
background: T.green,
border: `0.5px solid ${T.green}`,
color: T.card,
};
export const btnDanger = {
...btn,
background: 'transparent',
border: `0.5px solid ${T.oxblood}`,
color: T.oxblood,
};
export const titleFont = "'Cormorant Garamond', serif";
export const section = {
border: `0.5px solid ${T.cardBorder}`,
background: T.card,
borderRadius: '6px',
padding: '1.1rem 1.2rem',
marginBottom: '1.5rem',
};
