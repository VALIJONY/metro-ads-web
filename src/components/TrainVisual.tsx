"use client";

import type { LayoutCar, LayoutSpace, TrainStatus } from "@/lib/types";
import { VISUAL_STATUS } from "@/lib/status";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface SlotRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const GAP = 1.4;
const USABLE_START = 6;
const USABLE_END = 94;
const SLOT_WIDTH = (USABLE_END - USABLE_START - GAP * 5) / 6;

function slotRect(position: number, top: number): SlotRect {
  const index = position - 1;
  return {
    left: USABLE_START + index * (SLOT_WIDTH + GAP),
    top,
    width: SLOT_WIDTH,
    height: 11,
  };
}

function spaceRect(space: LayoutSpace): SlotRect {
  return slotRect(space.position, space.side === "left" ? 2 : 87);
}

export function TrainVisual({
  cars,
  trainStatus,
  selectedId,
  onSelect,
}: {
  cars: LayoutCar[];
  trainStatus: TrainStatus;
  selectedId: number | null;
  onSelect: (space: LayoutSpace) => void;
}) {
  const { t, td } = useLanguage();
  const artic = trainStatus === "new";

  return (
    <div
      style={{
        padding: "56px 34px 30px",
        overflowX: "auto",
        overflowY: "hidden",
        background: "radial-gradient(circle at 22% 12%,#ffffff 0%,#f2f6f9 45%,#e9eff4 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          minWidth: artic ? cars.length * 350 : cars.length * 365,
          transformStyle: "preserve-3d",
          transform: "perspective(2600px) rotateX(27deg) rotateZ(-1deg)",
        }}
      >
        {cars.map((car, i) => {
          const first = i === 0;
          const last = i === cars.length - 1;
          const R = "26px";
          const r = artic ? "6px" : R;
          const radius = artic ? (first ? `${R} ${r} ${r} ${R}` : last ? `${r} ${R} ${R} ${r}` : `${r} ${r} ${r} ${r}`) : R;
          const band = car.spaces.filter((s) => s.visual === "occupied" || s.visual === "ending").length;

          return (
            <div key={car.id} style={{ display: "flex", alignItems: "center", gap: 0, transformStyle: "preserve-3d" }}>
              <div style={{ position: "relative", flex: "0 0 auto", transformStyle: "preserve-3d" }}>
                <div
                  style={{
                    position: "relative",
                    width: artic ? "318px" : "332px",
                    height: "196px",
                    borderRadius: radius,
                    background: artic
                      ? "linear-gradient(180deg,#ffffff 0%,#f4f8fb 50%,#e6edf3 100%)"
                      : "linear-gradient(180deg,#ffffff 0%,#f2f6f9 50%,#e4ebf1 100%)",
                    border: "1px solid #c2cfda",
                    boxShadow: "0 30px 40px -26px rgba(15,42,67,.55), inset 0 1px 0 #fff",
                    transformStyle: "preserve-3d",
                    overflow: "hidden",
                  }}
                >
                  {/* Salon (dekorativ) */}
                  <Deco style={{ left: "3.5%", right: "3.5%", top: "13%", bottom: "13%", borderRadius: 16, background: "linear-gradient(180deg,#eaeff4,#f7f9fb 40%,#eaeff4)", border: "1px solid #d5dfe8" }} />
                  <Deco style={{ left: "6%", right: "6%", top: "41%", height: "18%", borderRadius: 8, background: "linear-gradient(90deg,#dde5ec,#f1f5f8,#dde5ec)" }} />
                  <DoorMarks top="20%" />
                  <DoorMarks top="bottom-20%" />
                  <Deco style={{ left: "26%", top: "12%", width: "9%", height: "3px", background: "#8fa2b3", borderRadius: 2 }} />
                  <Deco style={{ left: "60%", top: "12%", width: "9%", height: "3px", background: "#8fa2b3", borderRadius: 2 }} />
                  <Deco style={{ left: "26%", bottom: "12%", width: "9%", height: "3px", background: "#8fa2b3", borderRadius: 2 }} />
                  <Deco style={{ left: "60%", bottom: "12%", width: "9%", height: "3px", background: "#8fa2b3", borderRadius: 2 }} />
                  <Deco style={{ left: 0, top: 0, bottom: 0, width: "3.5%", background: "linear-gradient(90deg,rgba(15,42,67,.12),rgba(15,42,67,0))" }} />
                  <Deco style={{ right: 0, top: 0, bottom: 0, width: "3.5%", background: "linear-gradient(270deg,rgba(15,42,67,.12),rgba(15,42,67,0))" }} />

                  {car.spaces.map((space) => {
                    const rect = spaceRect(space);
                    const style = VISUAL_STATUS[space.visual];
                    const on = selectedId === space.id;
                    return (
                      <button
                        key={space.id}
                        onClick={() => onSelect(space)}
                        title={`${space.code} — ${space.booking ? td(space.booking.ad_name) : t(style.labelKey)} (${td(space.ad_type.name)})`}
                        style={{
                          position: "absolute",
                          left: `${rect.left}%`,
                          top: `${rect.top}%`,
                          width: `${rect.width}%`,
                          height: `${rect.height}%`,
                          border: `1.5px solid ${style.border}`,
                          background: style.hatched
                            ? `repeating-linear-gradient(45deg, ${style.bg}, ${style.bg} 4px, #e6e6ea 4px, #e6e6ea 8px)`
                            : style.bg,
                          color: style.fg,
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          font: "700 9px/1 var(--font-jetbrains-mono), monospace",
                          letterSpacing: ".02em",
                          cursor: "pointer",
                          padding: 0,
                          transform: on ? "translateZ(20px) scale(1.07)" : "translateZ(8px)",
                          boxShadow: on
                            ? "0 0 0 3px rgba(15,42,67,.42), 0 14px 22px -10px rgba(15,42,67,.6)"
                            : "0 4px 8px -4px rgba(15,42,67,.45), inset 0 1px 0 rgba(255,255,255,.7)",
                          zIndex: on ? 6 : 3,
                          transition: "transform .18s ease, box-shadow .18s ease",
                        }}
                      >
                        {space.side === "left" ? "L" : "R"}
                        {space.position}
                      </button>
                    );
                  })}
                </div>
                <div
                  style={{
                    margin: "12px auto 0",
                    width: "80%",
                    height: 14,
                    borderRadius: "50%",
                    background: "radial-gradient(ellipse at center,rgba(15,42,67,.2),rgba(15,42,67,0) 70%)",
                  }}
                />
                <div style={{ textAlign: "center", marginTop: 2, display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ font: "700 12px/1 var(--font-jetbrains-mono), monospace", color: "var(--navy)" }}>
                    {t("trainDetail.carLabel", { position: car.position })}
                  </span>
                  <span style={{ fontSize: 11.5, color: "var(--text-faint)" }}>
                    {t("trainDetail.carSummary", { occupied: band, free: car.spaces.length - band })}
                  </span>
                </div>
              </div>

              {!last && !artic && (
                <div style={{ width: 26, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 52 }}>
                  <div
                    style={{
                      width: 26,
                      height: 12,
                      background: "linear-gradient(#c3cfda,#7b8b9c)",
                      borderRadius: 3,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,.6)",
                    }}
                  />
                </div>
              )}
              {!last && artic && (
                <div
                  style={{
                    width: 34,
                    height: 172,
                    marginBottom: 52,
                    display: "flex",
                    alignItems: "stretch",
                    gap: 2,
                    padding: "0 1px",
                    background: "linear-gradient(180deg,#dfe6ec,#eef2f6 50%,#dfe6ec)",
                    borderTop: "1px solid #c2cfda",
                    borderBottom: "1px solid #c2cfda",
                    boxShadow: "inset 0 0 12px -6px rgba(15,42,67,.45)",
                  }}
                >
                  {Array.from({ length: 6 }).map((_, k) => (
                    <div key={k} style={{ flex: 1, background: "linear-gradient(90deg,#c3cfda,#eef2f6)" }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Deco({ style }: { style: React.CSSProperties }) {
  return <div style={{ position: "absolute", ...style }} />;
}

function DoorMarks({ top }: { top: string }) {
  const isBottom = top.startsWith("bottom-");
  const posStyle: React.CSSProperties = isBottom
    ? { bottom: top.replace("bottom-", "") }
    : { top };
  return (
    <div style={{ position: "absolute", left: "7%", right: "7%", height: "9%", display: "flex", gap: 6, ...posStyle }}>
      <div style={{ flex: 2, borderRadius: 4, background: "#dbe3ea" }} />
      <div style={{ flex: 1, background: "transparent" }} />
      <div style={{ flex: 2, borderRadius: 4, background: "#dbe3ea" }} />
      <div style={{ flex: 1, background: "transparent" }} />
      <div style={{ flex: 2, borderRadius: 4, background: "#dbe3ea" }} />
    </div>
  );
}
