/** Confetti colors: gold (take action), earth green (done), copper (house), cream (you). */
const CONFETTI_COLORS = ['#e8c547', '#6d8b6e', '#c08457', '#f6f1e3'];

/** Fixed pieces fanned around a circle, so the burst is the same on every render. */
function ring(count: number, minReach: number, step: number, baseDelay: number) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 + (index % 2 ? 0.12 : -0.12);
    const reach = minReach + (index % 4) * step;
    return {
      color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
      wide: index % 3 === 0,
      dx: `${Math.round(Math.cos(angle) * reach)}px`,
      dy: `${Math.round(Math.sin(angle) * reach)}px`,
      spin: `${(index % 2 ? 1 : -1) * (200 + index * 25)}deg`,
      delay: `${baseDelay + (index % 5) * 45}ms`,
    };
  });
}

const OUT = ring(28, 140, 60, 0);
const IN = ring(24, 260, 50, 650);

/**
 * Finish recap burst: one wave flies out from the anchor, then a second flies in
 * from the edges and lands back on it. CSS only; plays once per mount.
 */
export default function RecapConfetti({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute h-0 w-0 ${className}`}>
      {[...OUT.map((piece) => ({ ...piece, wave: 'out' })), ...IN.map((piece) => ({ ...piece, wave: 'in' }))].map(
        (piece, index) => (
          <span
            key={index}
            className={`recap-confetti-${piece.wave} absolute block rounded-sm ${piece.wide ? 'h-1.5 w-3' : 'h-3 w-1.5'}`}
            style={
              {
                backgroundColor: piece.color,
                animationDelay: piece.delay,
                '--dx': piece.dx,
                '--dy': piece.dy,
                '--spin': piece.spin,
              } as React.CSSProperties
            }
          />
        )
      )}
    </div>
  );
}
