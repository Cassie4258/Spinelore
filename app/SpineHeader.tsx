export default function SpineHeader({ compact = false }: { compact?: boolean }) {
if (compact) {
return (
<a href="/" style={{ display: 'block', textDecoration: 'none' }}>
<svg viewBox="0 0 380 40" style={{ width: '100%', display: 'block' }} role="img" aria-label="Spinelore">
<rect width="380" height="40" fill="#2E4A38" />
<rect width="380" height="2" fill="#3d5d48" opacity="0.75" />
<rect y="38" width="380" height="2" fill="#1e3325" />
<rect x="14" width="5" height="40" fill="#1e3325" />
<rect x="14" width="1.5" height="40" fill="#3f6249" />
<rect x="361" width="5" height="40" fill="#1e3325" />
<rect x="361" width="1.5" height="40" fill="#3f6249" />
<rect x="30" y="8" width="320" height="0.7" fill="#C9A227" opacity="0.5" />
<rect x="30" y="31" width="320" height="0.7" fill="#C9A227" opacity="0.5" />
<text x="190" y="26" textAnchor="middle" fontFamily="'Cormorant Garamond', Georgia, serif" fontStyle="italic" fontSize="20" fill="#DDB94E">Spinelore</text>
</svg>
</a>
);
}
return (
<a href="/" style={{ display: 'block', textDecoration: 'none' }}>
<svg viewBox="0 0 380 92" style={{ width: '100%', display: 'block' }} role="img" aria-label="Spinelore — a private archive">
<rect width="380" height="92" fill="#20180F" />
<rect x="4" y="8" width="27" height="76" fill="#4a3520" />
<rect x="4" y="8" width="27" height="2.5" fill="#5c4429" opacity="0.8" />
<rect x="28.5" y="8" width="2.5" height="76" fill="#33240f" />
<rect x="4" y="26" width="27" height="4" fill="#33240f" />
<rect x="4" y="26" width="27" height="1" fill="#5c4429" />
<rect x="4" y="56" width="27" height="4" fill="#33240f" />
<rect x="4" y="56" width="27" height="1" fill="#5c4429" />
<rect x="9" y="17" width="17" height="0.6" fill="#C9A227" opacity="0.45" />
<rect x="9" y="70" width="17" height="0.6" fill="#C9A227" opacity="0.45" />
<rect x="10" y="36" width="15" height="0.6" fill="#C9A227" opacity="0.3" />
<rect x="33" y="8" width="19" height="76" fill="#3A2A38" />
<rect x="33" y="8" width="19" height="2.5" fill="#4a3648" opacity="0.8" />
<rect x="49.5" y="8" width="2.5" height="76" fill="#291d28" />
<rect x="33" y="33" width="19" height="4" fill="#291d28" />
<rect x="33" y="33" width="19" height="1" fill="#4a3648" />
<rect x="33" y="61" width="19" height="4" fill="#291d28" />
<rect x="33" y="61" width="19" height="1" fill="#4a3648" />
<rect x="37" y="20" width="11" height="0.6" fill="#C9A227" opacity="0.4" />
<rect x="54" y="8" width="31" height="76" fill="#6B2620" />
<rect x="54" y="8" width="31" height="2.5" fill="#7d3029" opacity="0.8" />
<rect x="82" y="8" width="3" height="76" fill="#4a1713" />
<rect x="54" y="24" width="31" height="4.5" fill="#4a1713" />
<rect x="54" y="24" width="31" height="1.2" fill="#7d3029" />
<rect x="54" y="62" width="31" height="4.5" fill="#4a1713" />
<rect x="54" y="62" width="31" height="1.2" fill="#7d3029" />
<rect x="59" y="16" width="21" height="0.6" fill="#C9A227" opacity="0.5" />
<rect x="59" y="75" width="21" height="0.6" fill="#C9A227" opacity="0.5" />
<rect x="61" y="40" width="17" height="0.6" fill="#C9A227" opacity="0.35" />
<rect x="61" y="48" width="17" height="0.6" fill="#C9A227" opacity="0.35" />
<rect x="87" y="6" width="212" height="80" fill="#2E4A38" />
<rect x="87" y="6" width="212" height="3" fill="#3d5d48" opacity="0.75" />
<rect x="87" y="83" width="212" height="3" fill="#1e3325" />
<rect x="87" y="6" width="6" height="80" fill="#1e3325" />
<rect x="87" y="6" width="2" height="80" fill="#3f6249" />
<rect x="112" y="6" width="6" height="80" fill="#1e3325" />
<rect x="112" y="6" width="2" height="80" fill="#3f6249" />
<rect x="268" y="6" width="6" height="80" fill="#1e3325" />
<rect x="268" y="6" width="2" height="80" fill="#3f6249" />
<rect x="293" y="6" width="6" height="80" fill="#1e3325" />
<rect x="293" y="6" width="2" height="80" fill="#3f6249" />
<rect x="126" y="15" width="136" height="0.8" fill="#C9A227" opacity="0.55" />
<rect x="126" y="17.5" width="136" height="0.5" fill="#C9A227" opacity="0.3" />
<rect x="126" y="76" width="136" height="0.8" fill="#C9A227" opacity="0.55" />
<rect x="126" y="73.5" width="136" height="0.5" fill="#C9A227" opacity="0.3" />
<text x="194" y="50" textAnchor="middle" fontFamily="'Cormorant Garamond', Georgia, serif" fontStyle="italic" fontSize="26" fill="#DDB94E">Spinelore</text>
<text x="194" y="67" textAnchor="middle" fontFamily="'EB Garamond', Georgia, serif" fontSize="7.5" letterSpacing="3.2" fill="#9c8138">A PRIVATE ARCHIVE</text>
<text x="100" y="49" textAnchor="middle" fontFamily="Georgia, serif" fontSize="10" fill="#8f7a35" opacity="0.8">❖</text>
<text x="286" y="49" textAnchor="middle" fontFamily="Georgia, serif" fontSize="10" fill="#8f7a35" opacity="0.8">❖</text>
<rect x="301" y="8" width="25" height="76" fill="#3E3020" />
<rect x="301" y="8" width="25" height="2.5" fill="#4f3e2a" opacity="0.8" />
<rect x="323.5" y="8" width="2.5" height="76" fill="#2a2015" />
<rect x="301" y="30" width="25" height="4" fill="#2a2015" />
<rect x="301" y="30" width="25" height="1" fill="#4f3e2a" />
<rect x="301" y="58" width="25" height="4" fill="#2a2015" />
<rect x="301" y="58" width="25" height="1" fill="#4f3e2a" />
<rect x="306" y="20" width="15" height="0.6" fill="#C9A227" opacity="0.4" />
<rect x="306" y="72" width="15" height="0.6" fill="#C9A227" opacity="0.4" />
<rect x="328" y="8" width="21" height="76" fill="#2E4038" />
<rect x="328" y="8" width="21" height="2.5" fill="#3d5348" opacity="0.8" />
<rect x="346.5" y="8" width="2.5" height="76" fill="#1e2b25" />
<rect x="328" y="28" width="21" height="4" fill="#1e2b25" />
<rect x="328" y="28" width="21" height="1" fill="#3d5348" />
<rect x="328" y="60" width="21" height="4" fill="#1e2b25" />
<rect x="328" y="60" width="21" height="1" fill="#3d5348" />
<rect x="332" y="19" width="13" height="0.6" fill="#C9A227" opacity="0.4" />
<rect x="351" y="8" width="26" height="76" fill="#5a3a22" />
<rect x="351" y="8" width="26" height="2.5" fill="#6d4829" opacity="0.8" />
<rect x="374.5" y="8" width="2.5" height="76" fill="#3d2615" />
<rect x="351" y="34" width="26" height="4" fill="#3d2615" />
<rect x="351" y="34" width="26" height="1" fill="#6d4829" />
<rect x="351" y="64" width="26" height="4" fill="#3d2615" />
<rect x="351" y="64" width="26" height="1" fill="#6d4829" />
<rect x="356" y="22" width="16" height="0.6" fill="#C9A227" opacity="0.4" />
<rect y="86" width="380" height="6" fill="#171008" />
<rect y="86" width="380" height="1" fill="#2a1e12" />
</svg>
</a>
);
}
