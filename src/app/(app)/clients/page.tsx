"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiRequestError } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { CreateClientModal } from "@/components/CreateClientModal";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Client } from "@/lib/types";

export default function ClientsPage() {
  const { t, td } = useLanguage();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState<Client | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["clients", q],
    queryFn: () => api.clients.list(q || undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.clients.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success(t("common.delete"));
      setDeleting(null);
    },
    onError: (err) =>
      setDeleteError(
        err instanceof ApiRequestError && err.status === 409
          ? t("clients.deleteBlocked")
          : err instanceof ApiRequestError
            ? err.message
            : t("common.error.generic")
      ),
  });

  return (
    <>
      <PageHeader
        crumbs={[{ label: t("nav.dashboard"), href: "/" }, { label: t("clients.title") }]}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="bg-[var(--navy)] hover:bg-[var(--navy-active)]"
          >
            <Plus /> {t("clients.create")}
          </Button>
        }
      />
      <div style={{ padding: "28px 32px 48px", display: "flex", flexDirection: "column", gap: 18 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-.01em" }}>{t("clients.title")}</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("clients.searchPlaceholder")}
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
            <span>{t("clients.colName")}</span>
            <span>{t("clients.colTin")}</span>
            <span>{t("clients.colPhone")}</span>
            <span>{t("clients.colStatus")}</span>
            <span></span>
          </div>
          {isLoading && <div style={{ padding: 22, color: "var(--text-muted)", fontSize: 13.5 }}>{t("common.loading")}</div>}
          {data?.results.map((c) => (
            <div key={c.id} style={row}>
              <Link href={`/clients/${c.id}`} style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>
                {td(c.name)}
              </Link>
              <span style={{ font: "500 12.5px/1 var(--font-jetbrains-mono), monospace", color: "var(--text-2)" }}>
                {c.tin ?? "—"}
              </span>
              <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>{c.phone || "—"}</span>
              <span
                style={{
                  justifySelf: "start",
                  padding: "3px 9px",
                  borderRadius: 7,
                  fontSize: 11,
                  fontWeight: 700,
                  background: c.is_active ? "#e6f3ec" : "#eef2f6",
                  color: c.is_active ? "#1c6b3f" : "#4a5a6b",
                  border: `1px solid ${c.is_active ? "#c8e4d5" : "#dde4ea"}`,
                }}
              >
                {c.is_active ? t("common.active") : t("common.inactive")}
              </span>
              <div style={{ display: "flex", gap: 4, justifySelf: "end" }}>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => {
                    setEditing(c);
                    setModalOpen(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => {
                    setDeleting(c);
                    setDeleteError(null);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {data && data.results.length === 0 && (
            <div style={{ padding: 22, color: "var(--text-muted)", fontSize: 13.5 }}>{t("common.notFound")}</div>
          )}
        </div>
      </div>

      <CreateClientModal key={editing?.id ?? "new"} open={modalOpen} onOpenChange={setModalOpen} client={editing} />
      {deleting && (
        <ConfirmDeleteDialog
          open={!!deleting}
          onOpenChange={(v) => !v && setDeleting(null)}
          description={t("clients.deleteConfirm", { name: deleting.name })}
          onConfirm={() => deleteMutation.mutate(deleting.id)}
          pending={deleteMutation.isPending}
          error={deleteError}
        />
      )}
    </>
  );
}

const thead: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.6fr 1fr 1fr .8fr auto",
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
  gridTemplateColumns: "1.6fr 1fr 1fr .8fr auto",
  gap: 16,
  padding: "13px 22px",
  borderBottom: "1px solid var(--border-soft)",
  alignItems: "center",
};
