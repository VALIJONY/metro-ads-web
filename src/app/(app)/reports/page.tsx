"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api, downloadReportExcel } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { ProgressBar } from "@/components/ProgressBar";
import { CreatePaymentModal } from "@/components/CreatePaymentModal";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatDate, money } from "@/lib/format";
import type { DebtRow } from "@/lib/types";

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

const MONTH_NAMES = [
  "Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek",
];

export default function ReportsPage() {
  const { t, td } = useLanguage();
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => api.reports.dashboard() });
  const { data: byAdType } = useQuery({
    queryKey: ["occupancy", "ad_type"],
    queryFn: () => api.reports.occupancy("ad_type"),
  });

  const revenueStart = useMemo(() => isoDaysAgo(365), []);
  const trendStart = useMemo(() => isoDaysAgo(30), []);
  const today = useMemo(() => isoDaysAgo(0), []);

  const { data: revenue } = useQuery({
    queryKey: ["reports-revenue"],
    queryFn: () => api.reports.revenue(revenueStart, today, "month"),
  });
  const { data: debt } = useQuery({ queryKey: ["reports-debt"], queryFn: () => api.reports.debt() });
  const { data: clientsReport } = useQuery({
    queryKey: ["reports-clients"],
    queryFn: () => api.reports.clientsReport(revenueStart, today),
  });
  const { data: trend } = useQuery({
    queryKey: ["reports-trend"],
    queryFn: () => api.reports.occupancyTrend(trendStart, today),
  });

  const [downloading, setDownloading] = useState<string | null>(null);
  const [paying, setPaying] = useState<DebtRow | null>(null);

  async function onExport(type: string) {
    setDownloading(type);
    try {
      const params =
        type === "revenue" || type === "clients"
          ? { start_date: revenueStart, end_date: today }
          : undefined;
      await downloadReportExcel(type, params);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <>
      <PageHeader crumbs={[{ label: t("nav.dashboard"), href: "/" }, { label: t("reports.title") }]} />
      <div style={{ padding: "28px 32px 48px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-.01em" }}>{t("reports.title")}</h1>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <ExportButton label={t("reports.exportDashboard")} type="dashboard" onClick={onExport} loading={downloading === "dashboard"} />
            <ExportButton label={t("reports.exportOccupancy")} type="occupancy" onClick={onExport} loading={downloading === "occupancy"} />
            <ExportButton label={t("reports.exportRevenue")} type="revenue" onClick={onExport} loading={downloading === "revenue"} />
            <ExportButton label={t("reports.exportClients")} type="clients" onClick={onExport} loading={downloading === "clients"} />
            <ExportButton label={t("reports.exportDebt")} type="debt" onClick={onExport} loading={downloading === "debt"} />
          </div>
        </div>

        {data && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
            <StatCard label={t("reports.monthRevenue")} value={money(data.finance.month_revenue)} />
            <StatCard label={t("reports.yearRevenue")} value={money(data.finance.year_revenue)} />
            <StatCard label={t("reports.paid")} value={money(data.finance.paid)} valueColor="var(--free-fg)" />
            <StatCard label={t("reports.debt")} value={money(data.finance.debt)} valueColor="var(--occupied)" />
          </div>
        )}

        <Section title={t("reports.byAdType")}>
          {byAdType?.map((row) => {
            const pct = row.sellable ? Math.round((row.occupied / row.sellable) * 100) : 0;
            return (
              <div key={row.id} style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 0", borderTop: "1px solid var(--border-soft)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, fontWeight: 700 }}>
                  <span>{td(row.name)}</span>
                  <span style={{ font: "500 12px/1 var(--font-jetbrains-mono), monospace", color: "var(--text-muted)", fontWeight: 500 }}>
                    {row.occupied} / {row.sellable}
                  </span>
                </div>
                <ProgressBar pct={pct} color="var(--coral)" height={7} />
              </div>
            );
          })}
          {byAdType && byAdType.length === 0 && <NoData />}
        </Section>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))", gap: 20 }}>
          <Section title={t("reports.revenueTitle")}>
            <TableHead cols={[t("reports.revenueMonth"), t("reports.revenueCount"), t("reports.revenueTotal")]} />
            {revenue?.map((r, i) => (
              <TableRow key={i}>
                <span>{r.m ? `${MONTH_NAMES[new Date(r.m).getMonth()]} ${new Date(r.m).getFullYear()}` : "—"}</span>
                <span style={{ fontFamily: "var(--font-jetbrains-mono)" }}>{r.count}</span>
                <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontWeight: 700 }}>{money(r.total)}</span>
              </TableRow>
            ))}
            {revenue && revenue.length === 0 && <NoData />}
          </Section>

          <Section title={t("reports.clientsTitle")}>
            <TableHead cols={[t("reports.clientsName"), t("reports.clientsBookings"), t("reports.clientsTotal")]} />
            {clientsReport?.map((c) => (
              <TableRow key={c.id}>
                <span>{td(c.name)}</span>
                <span style={{ fontFamily: "var(--font-jetbrains-mono)" }}>{c.bookings_count}</span>
                <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontWeight: 700 }}>{money(c.bookings_total)}</span>
              </TableRow>
            ))}
            {clientsReport && clientsReport.length === 0 && <NoData />}
          </Section>
        </div>

        <Section title={t("reports.debtTitle")}>
          <TableHead cols={[t("reports.debtContract"), t("reports.debtClient"), t("reports.debtAmount"), t("reports.debtPaid"), t("reports.debtBalance"), ""]} />
          {debt?.map((d) => (
            <TableRow key={d.contract.id} cols={6}>
              <Link href={`/contracts/${d.contract.id}`} style={{ fontFamily: "var(--font-jetbrains-mono)", fontWeight: 700, color: "var(--navy)" }}>
                {d.contract.number}
              </Link>
              <span>{td(d.client.name)}</span>
              <span style={{ fontFamily: "var(--font-jetbrains-mono)" }}>{money(d.amount)}</span>
              <span style={{ fontFamily: "var(--font-jetbrains-mono)", color: "var(--free-fg)" }}>{money(d.paid)}</span>
              <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontWeight: 700, color: "var(--occupied)" }}>{money(d.balance)}</span>
              <button
                onClick={() => setPaying(d)}
                style={{ border: "1px solid var(--border)", background: "#fff", color: "var(--navy)", fontSize: 11.5, fontWeight: 700, padding: "7px 12px", borderRadius: 8, justifySelf: "start" }}
              >
                {t("reports.debtPay")}
              </button>
            </TableRow>
          ))}
          {debt && debt.length === 0 && <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("reports.noDebt")}</p>}
        </Section>

        <Section title={t("reports.trendTitle")}>
          {trend && trend.length > 0 ? (
            <>
              <TableHead cols={[t("reports.trendDate"), t("reports.trendRate"), t("reports.trendContracts")]} />
              {trend.map((row) => (
                <TableRow key={row.date}>
                  <span>{formatDate(row.date)}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ flex: 1 }}><ProgressBar pct={row.occupancy_rate} height={6} /></span>
                    <span style={{ fontFamily: "var(--font-jetbrains-mono)", minWidth: 36, textAlign: "right" }}>{Math.round(row.occupancy_rate)}%</span>
                  </span>
                  <span style={{ fontFamily: "var(--font-jetbrains-mono)" }}>{row.active_contracts}</span>
                </TableRow>
              ))}
            </>
          ) : (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("reports.trendEmpty")}</p>
          )}
        </Section>
      </div>

      {paying && (
        <CreatePaymentModal
          open={!!paying}
          onOpenChange={(v) => !v && setPaying(null)}
          contractId={paying.contract.id}
          contractLabel={paying.contract.number}
          defaultAmount={paying.balance}
        />
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "20px 22px 22px",
        boxShadow: "var(--shadow-card)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <h2 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800 }}>{title}</h2>
      {children}
    </section>
  );
}

function TableHead({ cols }: { cols: string[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols.length},1fr)`, gap: 10, paddingBottom: 8, borderBottom: "1px solid var(--border)", font: "700 10px/1 var(--font-jetbrains-mono), monospace", color: "var(--text-faint)", letterSpacing: ".08em" }}>
      {cols.map((c) => (
        <span key={c}>{c}</span>
      ))}
    </div>
  );
}

function TableRow({ children, cols = 3 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border-soft)", fontSize: 12.5, alignItems: "center" }}>
      {children}
    </div>
  );
}

function NoData() {
  const { t } = useLanguage();
  return <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("reports.noData")}</p>;
}

function ExportButton({
  label,
  type,
  onClick,
  loading,
}: {
  label: string;
  type: string;
  onClick: (t: string) => void;
  loading: boolean;
}) {
  return (
    <button
      onClick={() => onClick(type)}
      disabled={loading}
      style={{
        border: "1px solid var(--border)",
        background: "#fff",
        color: "var(--navy)",
        fontSize: 12.5,
        fontWeight: 700,
        padding: "9px 14px",
        borderRadius: 9,
      }}
    >
      {loading ? "..." : label}
    </button>
  );
}
