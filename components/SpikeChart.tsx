'use client';

export default function SpikeChart({
  values,
  tone = 'plain',
  roomy = false,
}: {
  values: number[];
  tone?: 'up' | 'down' | 'plain';
  roomy?: boolean;
}) {
  const width = roomy ? 72 : 56;
  const height = roomy ? 28 : 22;
  const points = values.length ? values : [0];
  const max = Math.max(...points, 1);
  const gap = 1;
  const barWidth = Math.max(1.5, (width - gap * (points.length - 1)) / points.length);
  const fill = tone === 'up' ? '#22c55e' : tone === 'down' ? '#ff2a2a' : '#e8c547';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className="shrink-0"
    >
      {points.map((value, index) => {
        const barHeight = Math.max(2, (value / max) * height);
        const last = index === points.length - 1;
        return (
          <rect
            key={index}
            x={index * (barWidth + gap)}
            y={height - barHeight}
            width={barWidth}
            height={barHeight}
            rx="0.5"
            fill={last ? fill : 'rgba(246, 241, 227, 0.35)'}
          />
        );
      })}
    </svg>
  );
}
