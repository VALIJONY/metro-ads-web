"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiRequestError } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatThousands, unformatThousands } from "@/lib/format";
import type { LayoutCar, Side } from "@/lib/types";

export function CreateSpaceModal({
  trainNumber,
  cars,
  onClose,
  invalidateKey,
}: {
  trainNumber: string;
  cars: LayoutCar[];
  onClose: () => void;
  invalidateKey: unknown[];
}) {
  const { t, td } = useLanguage();
  const queryClient = useQueryClient();
  const { data: adTypes } = useQuery({ queryKey: ["ad-types"], queryFn: () => api.adTypes.list() });

  const [carId, setCarId] = useState(cars[0]?.id);
  const [adType, setAdType] = useState<number | undefined>(undefined);
  const [side, setSide] = useState<Side>("left");
  const [position, setPosition] = useState<number | null>(null);
  const [areaM2, setAreaM2] = useState("1.2");
  const [basePrice, setBasePrice] = useState("0");
  const [error, setError] = useState<string | null>(null);

  function selectAdType(id: number) {
    setAdType(id);
    const found = adTypes?.results.find((a) => a.id === id);
    if (found) setBasePrice(found.default_base_price);
  }

  const car = cars.find((c) => c.id === carId) ?? cars[0];
  const takenLeft = useMemo(
    () => new Set(car?.spaces.filter((s) => s.side === "left").map((s) => s.position)),
    [car]
  );
  const takenRight = useMemo(
    () => new Set(car?.spaces.filter((s) => s.side === "right").map((s) => s.position)),
    [car]
  );

  const mutation = useMutation({
    mutationFn: () => {
      if (!carId || !adType || position === null) throw new Error(t("createSpace.validationError"));
      return api.spaces.create({ car: carId, ad_type: adType, side, position, area_m2: areaM2, base_price: basePrice });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateKey });
      onClose();
    },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : t("createSpace.error")),
  });

  function isTaken(s: Side, p: number) {
    return s === "left" ? takenLeft.has(p) : takenRight.has(p);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,42,67,.34)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 620,
          maxWidth: "100%",
          maxHeight: "100%",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 40px 80px -40px rgba(15,42,67,.7)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "22px 26px", borderBottom: "1px solid var(--border-soft)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{t("createSpace.title")}</h2>
            <span style={{ fontSize: 12.5, color: "var(--text-faint)" }}>{t("createSpace.subtitle", { number: trainNumber })}</span>
          </div>
          <button onClick={onClose} style={{ border: "1px solid var(--border)", background: "#fff", width: 32, height: 32, borderRadius: 9, color: "var(--text-muted)" }}>
            ✕
          </button>
        </div>

        <div style={{ padding: "22px 26px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label={t("createSpace.car")}>
              <select value={carId} onChange={(e) => { setCarId(Number(e.target.value)); setPosition(null); }} style={input}>
                {cars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {t("createSpace.carOption", { position: c.position })}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("createSpace.adType")}>
              <select value={adType ?? ""} onChange={(e) => selectAdType(Number(e.target.value))} style={input}>
                <option value="" disabled>
                  {t("common.select")}
                </option>
                {adTypes?.results.map((at) => (
                  <option key={at.id} value={at.id}>
                    {td(at.name)}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={t("createSpace.slotPicker")}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <SlotRow label={t("trainDetail.sideLeft")} side="left" active={side} onPick={(p) => { setSide("left"); setPosition(p); }} selectedPos={side === "left" ? position : null} isTaken={(p) => isTaken("left", p)} />
              <SlotRow label={t("trainDetail.sideRight")} side="right" active={side} onPick={(p) => { setSide("right"); setPosition(p); }} selectedPos={side === "right" ? position : null} isTaken={(p) => isTaken("right", p)} />
            </div>
            <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
              {position === null
                ? t("createSpace.slotHintEmpty")
                : t("createSpace.slotHintPicked", {
                    side: side === "left" ? t("trainDetail.sideLeft") : t("trainDetail.sideRight"),
                    position,
                  })}
            </span>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label={t("createSpace.area")}>
              <input value={areaM2} onChange={(e) => setAreaM2(e.target.value)} style={{ ...input, fontFamily: "var(--font-jetbrains-mono)" }} />
            </Field>
            <Field label={t("createSpace.price")}>
              <input
                value={formatThousands(basePrice)}
                onChange={(e) => setBasePrice(unformatThousands(e.target.value))}
                inputMode="numeric"
                style={{ ...input, fontFamily: "var(--font-jetbrains-mono)" }}
              />
            </Field>
          </div>

          {error && (
            <div style={{ padding: "10px 13px", borderRadius: 10, background: "#ffe3dd", border: "1px solid #f0c7be", color: "#8c2f1d", fontSize: 12.5, fontWeight: 600 }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ padding: "18px 26px", borderTop: "1px solid var(--border-soft)", display: "flex", gap: 10, justifyContent: "flex-end", background: "#fbfcfd" }}>
          <button onClick={onClose} style={{ border: "1px solid var(--border)", background: "#fff", color: "var(--text-2)", fontSize: 13.5, fontWeight: 700, padding: "12px 18px", borderRadius: 10 }}>
            {t("common.cancel")}
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !adType || position === null}
            style={{
              border: 0,
              background: "var(--navy)",
              color: "#fff",
              fontSize: 13.5,
              fontWeight: 700,
              padding: "12px 22px",
              borderRadius: 10,
              opacity: !adType || position === null ? 0.6 : 1,
            }}
          >
            {mutation.isPending ? t("common.creating") : t("createSpace.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}

function SlotRow({
  label,
  side,
  active,
  selectedPos,
  onPick,
  isTaken,
}: {
  label: string;
  side: Side;
  active: Side;
  selectedPos: number | null;
  onPick: (p: number) => void;
  isTaken: (p: number) => boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: 78, fontSize: 12, color: "var(--text-faint)", fontWeight: 600 }}>{label}</span>
      <div style={{ display: "flex", gap: 6, flex: 1 }}>
        {[1, 2, 3, 4, 5, 6].map((p) => {
          const taken = isTaken(p);
          const on = side === active && selectedPos === p;
          return (
            <button
              key={p}
              disabled={taken}
              onClick={() => onPick(p)}
              style={{
                flex: 1,
                height: 34,
                borderRadius: 6,
                border: on ? "2px solid var(--navy)" : `1.5px dashed ${taken ? "#c3cfda" : "#2f9e5e"}`,
                background: taken ? "var(--border-soft)" : on ? "var(--navy)" : "#eafaf0",
                color: on ? "#fff" : taken ? "#94a3b8" : "#14532d",
                font: "700 11px/1 var(--font-jetbrains-mono), monospace",
                cursor: taken ? "not-allowed" : "pointer",
              }}
            >
              {p}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label: l, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <label
        style={{
          font: "600 10.5px/1 var(--font-jetbrains-mono), monospace",
          color: "var(--text-faint-2)",
          letterSpacing: ".09em",
        }}
      >
        {l}
      </label>
      {children}
    </div>
  );
}

const input: React.CSSProperties = {
  padding: "11px 13px",
  border: "1px solid var(--border)",
  borderRadius: 10,
  fontSize: 13.5,
  fontWeight: 600,
  background: "#fff",
  color: "var(--text)",
  outline: "none",
};
