import HeaderSwitch from './HeaderSwitch';
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
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#2E4A38" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Spinelore" />
<link rel="apple-touch-icon" href="/icon.svg" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet" />
</head>
<body style={{
fontFamily: "'EB Garamond', Georgia, serif",
background: '#E8E0D0',
color: '#2E2A22',
margin: 0,
minHeight: '100vh',
}}>
<HeaderSwitch />
<nav style={{
display: 'flex', gap: '16px', padding: '10px 16px',
background: '#33453A', fontSize: '0.8rem', letterSpacing: '0.02em',
}}>
<a href="/" style={{ color: '#A8BDAD', textDecoration: 'none' }}>Library</a>
<a href="/browse" style={{ color: '#A8BDAD', textDecoration: 'none' }}>Browse</a>
<a href="/collections" style={{ color: '#A8BDAD', textDecoration: 'none' }}>Sets &amp; series</a>
<a href="/stats" style={{ color: '#A8BDAD', textDecoration: 'none' }}>Stats</a>
<a href="/copies/new" style={{ color: '#E8C87A', textDecoration: 'none', marginLeft: 'auto' }}>+ Accession</a>
</nav>
<main style={{ maxWidth: 700, margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
{children}
</main>
</body>
</html>
);
}
