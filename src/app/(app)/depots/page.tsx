"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiRequestError } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { Button } from "@/components/ui/button";
import { CreateDepotModal } from "@/components/CreateDepotModal";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Depot } from "@/lib/types";

export default function DepotsPage() {
  const { t, td } = useLanguage();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Depot | null>(null);
  const [deleting, setDeleting] = useState<Depot | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: depots, isLoading } = useQuery({
    queryKey: ["depots"],
    queryFn: () => api.depots.list(),
  });
  const { data: dashboard } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.reports.dashboard(),
  });
  const { data: trains } = useQuery({
    queryKey: ["trains-all"],
    queryFn: () => api.trains.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.depots.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["depots"] });
      toast.success(t("common.delete"));
      setDeleting(null);
    },
    onError: (err) =>
      setDeleteError(
        err instanceof ApiRequestError && err.status === 409
          ? t("depots.deleteBlocked")
          : err instanceof ApiRequestError
            ? err.message
            : t("common.error.generic")
      ),
  });

  return (
    <>
      <PageHeader
        crumbs={[{ label: t("nav.dashboard"), href: "/" }, { label: t("depots.title") }]}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="bg-[var(--navy)] hover:bg-[var(--navy-active)]"
          >
            <Plus /> {t("depots.create")}
          </Button>
        }
      />
      <div style={{ padding: "28px 32px 48px", display: "flex", flexDirection: "column", gap: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-.01em" }}>{t("depots.title")}</h1>

        {isLoading && <p style={{ color: "var(--text-muted)", fontSize: 13.5 }}>{t("common.loading")}</p>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
          {depots?.results.map((depot) => {
            const stat = dashboard?.by_depot.find((d) => d.id === depot.id);
            const sellable = stat?.sellable ?? 0;
            const occupied = stat?.occupied ?? 0;
            const pct = sellable ? Math.round((occupied / sellable) * 100) : 0;
            const depotTrains = trains?.results.filter((tr) => tr.depot_detail.id === depot.id) ?? [];

            return (
              <section
                key={depot.id}
                style={{
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                  padding: 22,
                  boxShadow: "var(--shadow-card)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{td(depot.name)}</h2>
                    <span style={{ font: "600 11px/1 var(--font-jetbrains-mono), monospace", color: "var(--text-faint)" }}>
                      {depot.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span style={{ font: "600 12px/1 var(--font-jetbrains-mono), monospace", color: "var(--text-muted)", marginRight: 6 }}>
                      {t("depots.rate", { pct })}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditing(depot);
                        setModalOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => {
                        setDeleting(depot);
                        setDeleteError(null);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <ProgressBar pct={pct} color="var(--coral)" height={8} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                  <Stat label={t("depots.trains")} value={depotTrains.length} />
                  <Stat label={t("depots.spaces")} value={sellable} />
                  <Stat label={t("depots.free")} value={sellable - occupied} color="var(--free-fg)" />
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    paddingTop: 6,
                    borderTop: "1px solid var(--border-soft)",
                  }}
                >
                  {depotTrains.map((tr) => (
                    <Link
                      key={tr.id}
                      href={`/trains/${tr.id}`}
                      style={{
                        border: "1px solid var(--border)",
                        background: "#f8fafc",
                        color: "var(--navy)",
                        font: "700 12px/1 var(--font-jetbrains-mono), monospace",
                        padding: "8px 11px",
                        borderRadius: 8,
                      }}
                    >
                      {tr.number}
                    </Link>
                  ))}
                  {!depotTrains.length && (
                    <span style={{ fontSize: 12.5, color: "var(--text-faint)" }}>{t("depots.noTrains")}</span>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <CreateDepotModal key={editing?.id ?? "new"} open={modalOpen} onOpenChange={setModalOpen} depot={editing} />
      {deleting && (
        <ConfirmDeleteDialog
          open={!!deleting}
          onOpenChange={(v) => !v && setDeleting(null)}
          description={t("depots.deleteConfirm", { name: deleting.name })}
          onConfirm={() => deleteMutation.mutate(deleting.id)}
          pending={deleteMutation.isPending}
          error={deleteError}
        />
      )}
    </>
  );
}

function Stat({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ font: "600 10px/1 var(--font-jetbrains-mono), monospace", color: "#8494a5" }}>{label}</span>
      <span style={{ fontSize: 17, fontWeight: 800, color: color ?? "var(--text)" }}>{value}</span>
    </div>
  );
}
