"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { isoToday, money } from "@/lib/format";
import type { FreeSpace } from "@/lib/types";

export default function FreeSpacesPage() {
  const { t, td } = useLanguage();

  const [startDate, setStartDate] = useState(isoToday());
  const [endDate, setEndDate] = useState(isoToday());
  const [depot, setDepot] = useState<number | "">("");
  const [train, setTrain] = useState<number | "">("");
  const [adType, setAdType] = useState<number | "">("");
  const [minArea, setMinArea] = useState("");

  const { data: depots } = useQuery({ queryKey: ["depots"], queryFn: () => api.depots.list() });
  const { data: trains } = useQuery({ queryKey: ["trains-all"], queryFn: () => api.trains.list() });
  const { data: adTypes } = useQuery({ queryKey: ["ad-types"], queryFn: () => api.adTypes.list() });

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["free-spaces-search", startDate, endDate, depot, train, adType, minArea],
    queryFn: () =>
      api.spaces.free({
        start_date: startDate,
        end_date: endDate,
        depot: depot || undefined,
        train: train || undefined,
        ad_type: adType || undefined,
        min_area: minArea || undefined,
      }),
    enabled: !!startDate && !!endDate,
  });

  function search() {
    refetch();
  }

  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const groups = useMemo(() => {
    if (!data) return [];
    const map = new Map<number, { train: FreeSpace["train"]; depot: FreeSpace["depot"]; spaces: FreeSpace[] }>();
    for (const s of data.results) {
      if (!map.has(s.train.id)) map.set(s.train.id, { train: s.train, depot: s.depot, spaces: [] });
      map.get(s.train.id)!.spaces.push(s);
    }
    return Array.from(map.values()).sort((a, b) => a.train.number.localeCompare(b.train.number));
  }, [data]);

  function toggle(trainId: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(trainId)) next.delete(trainId);
      else next.add(trainId);
      return next;
    });
  }

  return (
    <>
      <PageHeader crumbs={[{ label: t("nav.dashboard"), href: "/" }, { label: t("freeSpaces.title") }]} />
      <div style={{ padding: "28px 32px 48px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-.01em" }}>{t("freeSpaces.title")}</h1>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-muted)" }}>{t("freeSpaces.subtitle")}</p>
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 16, boxShadow: "var(--shadow-card)", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
            <Field label={t("freeSpaces.fieldStartDate")}>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={input} />
            </Field>
            <Field label={t("freeSpaces.fieldEndDate")}>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={input} />
            </Field>
            <Field label={t("freeSpaces.fieldDepot")}>
              <select value={depot} onChange={(e) => setDepot(e.target.value ? Number(e.target.value) : "")} style={input}>
                <option value="">{t("common.all")}</option>
                {depots?.results.map((d) => (
                  <option key={d.id} value={d.id}>{d.code}</option>
                ))}
              </select>
            </Field>
            <Field label={t("freeSpaces.fieldTrain")}>
              <select value={train} onChange={(e) => setTrain(e.target.value ? Number(e.target.value) : "")} style={input}>
                <option value="">{t("common.all")}</option>
                {trains?.results
                  .filter((tr) => !depot || tr.depot_detail.id === depot)
                  .map((tr) => (
                    <option key={tr.id} value={tr.id}>{tr.number}</option>
                  ))}
              </select>
            </Field>
            <Field label={t("freeSpaces.fieldAdType")}>
              <select value={adType} onChange={(e) => setAdType(e.target.value ? Number(e.target.value) : "")} style={input}>
                <option value="">{t("common.all")}</option>
                {adTypes?.results.map((a) => (
                  <option key={a.id} value={a.id}>{td(a.name)}</option>
                ))}
              </select>
            </Field>
            <Field label={t("freeSpaces.fieldMinArea")}>
              <input value={minArea} onChange={(e) => setMinArea(e.target.value)} inputMode="decimal" style={input} />
            </Field>
          </div>
          <Button onClick={search} disabled={isFetching || !startDate || !endDate} className="w-fit bg-[var(--navy)] hover:bg-[var(--navy-active)]">
            {isFetching ? t("common.loading") : t("freeSpaces.search")}
          </Button>
        </div>

        {!data && isFetching && <p style={{ fontSize: 13.5, color: "var(--text-muted)" }}>{t("common.loading")}</p>}

        {data && (
          <>
            <StatCard label={t("freeSpaces.results")} value={data.count} />

            {groups.length === 0 && (
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 16, boxShadow: "var(--shadow-card)", padding: 22, color: "var(--text-muted)", fontSize: 13.5 }}>
                {t("freeSpaces.noResults")}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {groups.map(({ train: tr, depot: dp, spaces }) => {
                const isOpen = expanded.has(tr.id);
                return (
                  <div key={tr.id} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 16, boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
                    <button
                      onClick={() => toggle(tr.id)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "15px 20px",
                        border: 0,
                        background: "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <ChevronDown
                        style={{ width: 16, height: 16, color: "var(--text-muted)", transition: "transform .15s", transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)", flexShrink: 0 }}
                      />
                      <span style={{ font: "800 15px/1 var(--font-jetbrains-mono), monospace" }}>{tr.number}</span>
                      <span style={{ padding: "4px 10px", borderRadius: 7, background: "#e8eef4", color: "var(--navy)", fontSize: 11.5, fontWeight: 700 }}>
                        {dp.code}
                      </span>
                      <span style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--text-muted)", fontWeight: 600 }}>
                        {t("freeSpaces.spacesCount", { count: spaces.length })}
                      </span>
                    </button>

                    {isOpen && (
                      <div style={{ borderTop: "1px solid var(--border-soft)", overflowX: "auto" }}>
                        <div style={{ minWidth: 640 }}>
                          <div style={thead}>
                            <span>{t("freeSpaces.colCode")}</span>
                            <span>{t("freeSpaces.colCar")}</span>
                            <span>{t("freeSpaces.colAdType")}</span>
                            <span>{t("freeSpaces.colArea")}</span>
                            <span>{t("freeSpaces.colPrice")}</span>
                            <span></span>
                          </div>
                          {spaces.map((s) => (
                            <div key={s.id} style={row}>
                              <span style={{ font: "700 12.5px/1 var(--font-jetbrains-mono), monospace" }}>{s.code}</span>
                              <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>{s.car_position}</span>
                              <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>{td(s.ad_type.name)}</span>
                              <span style={{ font: "500 12.5px/1 var(--font-jetbrains-mono), monospace", color: "var(--text-2)" }}>{s.area_m2} m²</span>
                              <span style={{ font: "600 12.5px/1 var(--font-jetbrains-mono), monospace" }}>{money(s.base_price)}</span>
                              <Link
                                href={`/trains/${s.train.id}`}
                                style={{ border: "1px solid var(--border)", background: "#fff", color: "var(--navy)", fontSize: 11.5, fontWeight: 700, padding: "7px 12px", borderRadius: 8, justifySelf: "start" }}
                              >
                                {t("freeSpaces.open")}
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ font: "600 10px/1 var(--font-jetbrains-mono), monospace", color: "#8494a5", letterSpacing: ".09em" }}>{label}</label>
      {children}
    </div>
  );
}

const input: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid var(--border)",
  borderRadius: 9,
  fontSize: 13,
  color: "var(--text)",
  background: "#fff",
  outline: "none",
};

const thead: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.3fr .6fr 1.2fr .8fr 1fr auto",
  gap: 14,
  padding: "11px 20px",
  background: "#f8fafc",
  borderBottom: "1px solid var(--border)",
  font: "700 10.5px/1 var(--font-jetbrains-mono), monospace",
  color: "var(--text-faint)",
  letterSpacing: ".08em",
};

const row: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.3fr .6fr 1.2fr .8fr 1fr auto",
  gap: 14,
  padding: "12px 20px",
  borderBottom: "1px solid var(--border-soft)",
  alignItems: "center",
};
