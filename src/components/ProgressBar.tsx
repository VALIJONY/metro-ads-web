export function ProgressBar({
  pct,
  color = "var(--navy-active)",
  height = 6,
  track = "var(--border-soft)",
}: {
  pct: number;
  color?: string;
  height?: number;
  track?: string;
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(pct)));
  return (
    <div style={{ height, borderRadius: height / 2, background: track, overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${clamped}%`,
          background: color,
          borderRadius: height / 2,
        }}
      />
    </div>
  );
}
