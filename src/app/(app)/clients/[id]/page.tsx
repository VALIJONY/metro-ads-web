"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { StatCard } from "@/components/StatCard";
import { CONTRACT_STATUS } from "@/lib/status";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatDate, money } from "@/lib/format";

export default function ClientDetailPage() {
  const { t, td } = useLanguage();
  const params = useParams<{ id: string }>();
  const clientId = Number(params.id);

  const { data: client, isLoading, isError } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => api.clients.get(clientId),
    enabled: Number.isFinite(clientId),
  });
  const { data: contracts } = useQuery({
    queryKey: ["client-contracts", clientId],
    queryFn: () => api.clients.contracts(clientId),
    enabled: Number.isFinite(clientId),
  });

  if (isLoading) return <div style={{ padding: 48, color: "var(--text-muted)", fontSize: 14 }}>{t("common.loading")}</div>;
  if (isError || !client)
    return <div style={{ padding: 48, color: "var(--occupied)", fontSize: 14 }}>{t("clients.notFound")}</div>;

  const activeCount = contracts?.filter((c) => c.status === "active").length ?? 0;
  const totalBooked = contracts?.reduce((sum, c) => sum + Number(c.bookings_total || 0), 0) ?? 0;
  const totalPaid = contracts?.reduce((sum, c) => sum + Number(c.paid || 0), 0) ?? 0;

  return (
    <>
      <PageHeader crumbs={[{ label: t("clients.back"), href: "/clients" }, { label: td(client.name) }]} />
      <div style={{ padding: "26px 32px 48px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-.01em" }}>{td(client.name)}</h1>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12.5, color: "var(--text-muted)" }}>
            {client.tin && <span className="font-mono">{t("clients.fieldTin")}: {client.tin}</span>}
            {client.phone && <span>{client.phone}</span>}
            {client.email && <span>{client.email}</span>}
            {client.address && <span>{td(client.address)}</span>}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
          <StatCard label={t("clients.totalContracts")} value={contracts?.length ?? 0} />
          <StatCard label={t("clients.activeContracts")} value={activeCount} valueColor="var(--free-fg)" />
          <StatCard label={t("clients.totalBooked")} value={money(totalBooked)} />
          <StatCard label={t("clients.totalPaid")} value={money(totalPaid)} valueColor="var(--free-fg)" />
        </div>

        <section
          style={{
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: 16,
            boxShadow: "var(--shadow-card)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border-soft)" }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{t("nav.contracts")}</h2>
          </div>
          {!contracts?.length && (
            <div style={{ padding: 22, color: "var(--text-muted)", fontSize: 13.5 }}>{t("clients.noContracts")}</div>
          )}
          {!!contracts?.length && (
            <>
              <div style={thead}>
                <span>{t("contracts.colNumber")}</span>
                <span>{t("contracts.colStatus")}</span>
                <span>{t("contracts.colTerm")}</span>
                <span>{t("contracts.colAmount")}</span>
                <span>{t("contracts.colBalance")}</span>
              </div>
              {contracts.map((c) => (
                <Link key={c.id} href={`/contracts/${c.id}`} style={{ ...row, color: "var(--text)" }}>
                  <span style={{ font: "600 12.5px/1 var(--font-jetbrains-mono), monospace" }}>{c.number}</span>
                  <Badge style={CONTRACT_STATUS[c.status]} />
                  <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>
                    {formatDate(c.start_date)} – {formatDate(c.end_date)}
                  </span>
                  <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>{money(c.amount)}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: Number(c.balance) > 0 ? "var(--occupied)" : "var(--free-fg)" }}>
                    {money(c.balance)}
                  </span>
                </Link>
              ))}
            </>
          )}
        </section>
      </div>
    </>
  );
}

const thead: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.2fr .9fr 1.3fr 1fr 1fr",
  gap: 16,
  padding: "12px 22px",
  background: "#f8fafc",
  borderBottom: "1px solid var(--border)",
  font: "700 10.5px/1 var(--font-jetbrains-mono), monospace",
  color: "var(--text-faint)",
  letterSpacing: ".09em",
};

const row: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.2fr .9fr 1.3fr 1fr 1fr",
  gap: 16,
  padding: "13px 22px",
  borderBottom: "1px solid var(--border-soft)",
  alignItems: "center",
  textDecoration: "none",
};
