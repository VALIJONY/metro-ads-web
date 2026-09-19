import { ProgressBar } from "./ProgressBar";

export function StatCard({
  label,
  value,
  valueColor,
  sub,
  progressPct,
}: {
  label: string;
  value: React.ReactNode;
  valueColor?: string;
  sub?: React.ReactNode;
  progressPct?: number;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "18px 20px",
        boxShadow: "var(--shadow-card)",
        display: "flex",
        flexDirection: "column",
        gap: 9,
      }}
    >
      <div
        style={{
          font: "600 10px/1 var(--font-jetbrains-mono), monospace",
          color: "#8494a5",
          letterSpacing: ".1em",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: valueColor ?? "var(--text)", letterSpacing: "-.02em" }}>
        {value}
      </div>
      {progressPct !== undefined ? (
        <ProgressBar pct={progressPct} />
      ) : sub ? (
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{sub}</div>
      ) : null}
    </div>
  );
}
