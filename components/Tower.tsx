// Simple stacked-ring "discipline tower" — number of filled rings = stones earned.
export default function Tower({ stones, total = 7 }: { stones: number; total?: number }) {
  const rings = Array.from({ length: total }, (_, i) => i < stones);
  const ringHeight = 16;
  const width = 160;

  return (
    <svg viewBox={`0 0 ${width} ${ringHeight * total + 20}`} className="w-full max-w-[180px] mx-auto">
      {rings.map((filled, i) => {
        const y = ringHeight * (total - i - 1) + 10;
        const inset = i * 4;
        return (
          <g key={i}>
            <ellipse
              cx={width / 2}
              cy={y}
              rx={(width - inset * 2) / 2}
              ry={ringHeight / 2}
              fill={filled ? '#e8d9b5' : 'none'}
              stroke={filled ? '#cdbb8e' : '#3a4570'}
              strokeWidth={1.5}
              strokeDasharray={filled ? undefined : '4 3'}
            />
          </g>
        );
      })}
    </svg>
  );
}
