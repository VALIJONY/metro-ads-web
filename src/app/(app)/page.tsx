"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { ProgressBar } from "@/components/ProgressBar";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatDate } from "@/lib/format";

export default function DashboardPage() {
  const { t, td } = useLanguage();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.reports.dashboard(),
  });
  const { data: expiring } = useQuery({
    queryKey: ["ending-soon", 30],
    queryFn: () => api.reports.endingSoon(30),
  });

  return (
    <>
      <PageHeader crumbs={[{ label: t("dashboard.title") }]} />
      <div style={{ padding: "28px 32px 48px", display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-.01em" }}>
            {t("dashboard.title")}
          </h1>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-muted)" }}>
            {t("dashboard.subtitle", { date: data ? formatDate(data.date) : "..." })}
          </p>
        </div>

        {isLoading && <EmptyNote>{t("common.loading")}</EmptyNote>}
        {isError && (
          <EmptyNote>
            {t("common.error.loadFailed")} {t("common.backendHint")}
          </EmptyNote>
        )}

        {data && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
              <StatCard
                label={t("dashboard.totalSpaces")}
                value={data.inventory.total_spaces}
                sub={t("dashboard.totalSpacesSub", {
                  trains: data.inventory.trains,
                  cars: data.inventory.cars,
                })}
              />
              <StatCard
                label={t("dashboard.occupied")}
                value={data.occupancy.occupied}
                valueColor="var(--occupied)"
                sub={t("dashboard.occupiedSub")}
              />
              <StatCard
                label={t("dashboard.free")}
                value={data.occupancy.free}
                valueColor="var(--free-fg)"
                sub={t("dashboard.freeSub")}
              />
              <StatCard label={t("dashboard.rate")} value={`${data.occupancy.rate}%`} progressPct={data.occupancy.rate} />
              <StatCard
                label={t("dashboard.expiring")}
                value={data.contracts.ending_soon}
                valueColor="var(--warn)"
                sub={t("dashboard.expiringSub")}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16, alignItems: "start" }}>
              <section
                style={{
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                  padding: "20px 22px 22px",
                  boxShadow: "var(--shadow-card)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{t("dashboard.byDepot")}</h2>
                {data.by_depot.map((d) => {
                  const pct = d.sellable ? Math.round((d.occupied / d.sellable) * 100) : 0;
                  return (
                    <div
                      key={d.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        padding: "14px 0",
                        borderTop: "1px solid var(--border-soft)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                        <Link href="/depots" style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                          {td(d.name) || d.code}
                        </Link>
                        <span style={{ font: "500 12px/1 var(--font-jetbrains-mono), monospace", color: "var(--text-muted)" }}>
                          {d.occupied} / {d.sellable}
                        </span>
                      </div>
                      <ProgressBar pct={pct} color="var(--coral)" height={8} />
                      <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-muted)" }}>
                        <span>{t("dashboard.byDepotRate", { pct })}</span>
                        <span>{t("dashboard.byDepotFree", { count: d.sellable - d.occupied })}</span>
                      </div>
                    </div>
                  );
                })}
              </section>

              <section
                style={{
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                  padding: "20px 22px 8px",
                  boxShadow: "var(--shadow-card)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <h2 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800 }}>{t("dashboard.upcomingExpiring")}</h2>
                {!expiring?.length && (
                  <div style={{ padding: "12px 8px", fontSize: 13, color: "var(--text-muted)" }}>
                    {t("dashboard.noExpiring")}
                  </div>
                )}
                {expiring?.slice(0, 7).map((c) => (
                  <Link
                    key={c.id}
                    href="/contracts"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: "4px 14px",
                      padding: "12px 8px",
                      borderTop: "1px solid var(--border-soft)",
                      borderRadius: 8,
                      color: "var(--text)",
                    }}
                  >
                    <span style={{ fontSize: 13.5, fontWeight: 700 }}>{td(c.client.name)}</span>
                    <span
                      style={{
                        justifySelf: "end",
                        padding: "3px 8px",
                        borderRadius: 7,
                        background: c.days_left <= 10 ? "#ffe3dd" : "#fff0cf",
                        color: c.days_left <= 10 ? "#8c2f1d" : "#7a5205",
                        border: `1px solid ${c.days_left <= 10 ? "#f0c7be" : "#f0dcae"}`,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {t("dashboard.daysLeft", { days: c.days_left })}
                    </span>
                    <span
                      style={{
                        gridColumn: "1/-1",
                        font: "500 11.5px/1.5 var(--font-jetbrains-mono), monospace",
                        color: "var(--text-faint)",
                      }}
                    >
                      {c.number} · {formatDate(c.end_date)}
                    </span>
                  </Link>
                ))}
              </section>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px dashed #cfd9e3",
        borderRadius: 16,
        padding: "24px",
        color: "var(--text-muted)",
        fontSize: 13.5,
      }}
    >
      {children}
    </div>
  );
}
