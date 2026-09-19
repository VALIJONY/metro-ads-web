"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/ui/button";
import { CreateContractModal } from "@/components/CreateContractModal";
import { CONTRACT_STATUS } from "@/lib/status";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatDate, money } from "@/lib/format";

export default function ContractsPage() {
  const { t, td } = useLanguage();
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["contracts", q],
    queryFn: () => api.contracts.list(q || undefined),
  });

  return (
    <>
      <PageHeader
        crumbs={[{ label: t("nav.dashboard"), href: "/" }, { label: t("contracts.title") }]}
        actions={
          <Button onClick={() => setModalOpen(true)} className="bg-[var(--navy)] hover:bg-[var(--navy-active)]">
            <Plus /> {t("contracts.create")}
          </Button>
        }
      />
      <div style={{ padding: "28px 32px 48px", display: "flex", flexDirection: "column", gap: 18 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-.01em" }}>{t("contracts.title")}</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("contracts.searchPlaceholder")}
          style={{
            maxWidth: 420,
            padding: "11px 14px",
            border: "1px solid var(--border)",
            borderRadius: 10,
            background: "#fff",
            fontSize: 13,
            outline: "none",
          }}
        />

        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 16, boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
          <div style={thead}>
            <span>{t("contracts.colNumber")}</span>
            <span>{t("contracts.colFirm")}</span>
            <span>{t("contracts.colStatus")}</span>
            <span>{t("contracts.colTerm")}</span>
            <span>{t("contracts.colAmount")}</span>
            <span>{t("contracts.colBalance")}</span>
          </div>
          {isLoading && <div style={{ padding: 22, color: "var(--text-muted)", fontSize: 13.5 }}>{t("common.loading")}</div>}
          {data?.results.map((c) => (
            <Link key={c.id} href={`/contracts/${c.id}`} style={{ ...row, color: "var(--text)" }}>
              <span style={{ font: "600 12.5px/1 var(--font-jetbrains-mono), monospace" }}>{c.number}</span>
              <span style={{ fontSize: 13.5, fontWeight: 700 }}>{td(c.client_detail.name)}</span>
              <Badge style={CONTRACT_STATUS[c.status]} />
              <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>
                {formatDate(c.start_date)} – {formatDate(c.end_date)}
              </span>
              <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>{money(c.amount)}</span>
              <span style={{ fontSize: 12.5, color: Number(c.balance) > 0 ? "var(--occupied)" : "var(--free-fg)", fontWeight: 700 }}>
                {money(c.balance)}
              </span>
            </Link>
          ))}
          {data && data.results.length === 0 && (
            <div style={{ padding: 22, color: "var(--text-muted)", fontSize: 13.5 }}>{t("contracts.notFound")}</div>
          )}
        </div>
      </div>

      <CreateContractModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}

const thead: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.2fr 1.4fr .9fr 1.2fr 1fr 1fr",
  gap: 16,
  padding: "14px 22px",
  background: "#f8fafc",
  borderBottom: "1px solid var(--border)",
  font: "700 10.5px/1 var(--font-jetbrains-mono), monospace",
  color: "var(--text-faint)",
  letterSpacing: ".09em",
};

const row: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.2fr 1.4fr .9fr 1.2fr 1fr 1fr",
  gap: 16,
  padding: "14px 22px",
  borderBottom: "1px solid var(--border-soft)",
  alignItems: "center",
  textDecoration: "none",
};
