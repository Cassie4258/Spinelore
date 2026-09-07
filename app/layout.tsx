export const metadata = {
title: 'Spinelore',
description: 'A private archive for a collected library.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
return (
<html lang="en">
<head>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link
href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap"
rel="stylesheet"
/>
</head>
<body
style={{
fontFamily: "'EB Garamond', Georgia, serif",
background: '#15100b',
backgroundImage:
'radial-gradient(ellipse 900px 500px at 50% -10%, rgba(184,146,63,0.07), transparent)',
color: '#e8dcc0',
margin: 0,
minHeight: '100vh',
}}
>
<header
style={{
padding: '1.5rem 1.75rem 1.25rem',
borderBottom: '1px solid #3a2f20',
display: 'flex',
justifyContent: 'space-between',
alignItems: 'flex-end',
}}
>
<a href="/" style={{ textDecoration: 'none', color: '#e8dcc0' }}>
<div
style={{
fontFamily: "'EB Garamond', serif",
fontSize: '0.7rem',
letterSpacing: '0.22em',
color: '#8a7a5c',
marginBottom: '0.25rem',
}}
>
A PRIVATE ARCHIVE
</div>
<h1
style={{
margin: 0,
fontFamily: "'Cormorant Garamond', serif",
fontStyle: 'italic',
fontWeight: 500,
fontSize: '2rem',
letterSpacing: '0.01em',
color: '#e8dcc0',
}}
>
Spinelore
</h1>
</a>
<a
href="/copies/new"
style={{
background: '#4a2318',
color: '#e8dcc0',
border: '1px solid #6b3524',
padding: '0.5rem 1.1rem',
textDecoration: 'none',
fontFamily: "'EB Garamond', serif",
fontSize: '0.85rem',
letterSpacing: '0.06em',
boxShadow: '0 0 0 1px #15100b, 0 0 0 2px #b8923f33',
}}
>
+ Accession a Book
</a>
</header>
<nav style={{
display: 'flex', gap: '1.25rem', padding: '0.75rem 1.75rem',
borderBottom: '1px solid #3a2f20', fontSize: '0.85rem',
}}>
<a href="/" style={{ color: '#c4b490', textDecoration: 'none' }}>Library</a>
<a href="/browse" style={{ color: '#c4b490', textDecoration: 'none' }}>Browse</a>
<a href="/stats" style={{ color: '#c4b490', textDecoration: 'none' }}>Stats</a>
</nav>
<main style={{ maxWidth: 700, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
{children}
</main>
</body>
</html>
);
}
