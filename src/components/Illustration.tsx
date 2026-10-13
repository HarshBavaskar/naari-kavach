/**
 * Geometric, non-figurative art. Hex lattice + one calm route between two
 * points, in brand tokens so it adapts to light and dark. No characters,
 * no mascots: the product should feel steady, not playful.
 */
export function RouteArt() {
  const hex = (cx: number, cy: number, r = 22) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i + Math.PI / 6;
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(' ');
  const cells: Array<[number, number, string]> = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 7; col++) {
      const cx = 30 + col * 38 + (row % 2 ? 19 : 0);
      const cy = 26 + row * 33;
      const tone = (row === 1 && col === 4) || (row === 2 && col === 5) ? 'var(--risk-2)' : row === 2 && col === 4 ? 'var(--risk-3)' : 'var(--surface-3)';
      cells.push([cx, cy, tone]);
    }
  }
  return (
    <svg viewBox="0 0 280 150" role="img" aria-label="Route between two points avoiding risky blocks">
      {cells.map(([x, y, tone], i) => (
        <polygon key={i} points={hex(x, y, 18)} fill={tone} opacity={tone === 'var(--surface-3)' ? 0.55 : 0.5} />
      ))}
      <path d="M48 118 C 90 118, 92 40, 150 40 S 210 30, 236 34" fill="none" stroke="var(--surface)" strokeWidth="10" strokeLinecap="round" />
      <path d="M48 118 C 90 118, 92 40, 150 40 S 210 30, 236 34" fill="none" stroke="var(--primary)" strokeWidth="5" strokeLinecap="round" />
      <circle cx="48" cy="118" r="9" fill="var(--primary)" />
      <circle cx="48" cy="118" r="3.5" fill="var(--surface)" />
      <rect x="227" y="25" width="18" height="18" rx="5" fill="var(--sos)" />
      <rect x="233" y="31" width="6" height="6" rx="2" fill="var(--surface)" />
    </svg>
  );
}
