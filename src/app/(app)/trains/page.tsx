"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiRequestError } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { ProgressBar } from "@/components/ProgressBar";
import { Button } from "@/components/ui/button";
import { CreateTrainModal } from "@/components/CreateTrainModal";
import { EditTrainModal } from "@/components/EditTrainModal";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { TRAIN_STATUS } from "@/lib/status";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Train, TrainStatus } from "@/lib/types";

export default function TrainsPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [depoF, setDepoF] = useState("Hammasi");
  const [statusF, setStatusF] = useState<"Hammasi" | TrainStatus>("Hammasi");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Train | null>(null);
  const [deleting, setDeleting] = useState<Train | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: depots } = useQuery({ queryKey: ["depots"], queryFn: () => api.depots.list() });
  const { data: trains, isLoading } = useQuery({ queryKey: ["trains-all"], queryFn: () => api.trains.list() });
  const { data: occupancy } = useQuery({
    queryKey: ["occupancy", "train"],
    queryFn: () => api.reports.occupancy("train"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.trains.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trains-all"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(t("common.delete"));
      setDeleting(null);
    },
    onError: (err) =>
      setDeleteError(
        err instanceof ApiRequestError && err.status === 409
          ? t("trains.deleteBlocked")
          : err instanceof ApiRequestError
            ? err.message
            : t("common.error.generic")
      ),
  });

  const rows = useMemo(() => {
    if (!trains) return [];
    return trains.results
      .filter((tr) => depoF === "Hammasi" || tr.depot_detail.code === depoF)
      .filter((tr) => statusF === "Hammasi" || tr.status === statusF)
      .filter((tr) => tr.number.toLowerCase().includes(q.trim().toLowerCase()))
      .map((tr) => {
        const occ = occupancy?.find((o) => o.id === tr.id);
        return { train: tr, sellable: occ?.sellable ?? 0, occupied: occ?.occupied ?? 0, rate: occ?.rate ?? 0 };
      });
  }, [trains, occupancy, depoF, statusF, q]);

  return (
    <>
      <PageHeader
        crumbs={[{ label: t("nav.dashboard"), href: "/" }, { label: t("trains.title") }]}
        actions={
          <Button onClick={() => setModalOpen(true)} className="bg-[var(--navy)] hover:bg-[var(--navy-active)]">
            <Plus /> {t("trains.create")}
          </Button>
        }
      />
      <div style={{ padding: "28px 32px 48px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-.01em" }}>{t("trains.title")}</h1>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-muted)" }}>
            {t("trains.subtitle", { count: rows.length })}
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("trains.searchPlaceholder")}
            style={{
              flex: "1 1 280px",
              minWidth: 200,
              padding: "11px 14px",
              border: "1px solid var(--border)",
              borderRadius: 10,
              background: "#fff",
              fontSize: 13,
              color: "var(--text)",
              outline: "none",
            }}
          />
          <select value={depoF} onChange={(e) => setDepoF(e.target.value)} style={selectStyle}>
            <option value="Hammasi">{t("trains.allDepots")}</option>
            {depots?.results.map((d) => (
              <option key={d.id} value={d.code}>
                {d.code}
              </option>
            ))}
          </select>
          <select
            value={statusF}
            onChange={(e) => setStatusF(e.target.value as "Hammasi" | TrainStatus)}
            style={selectStyle}
          >
            <option value="Hammasi">{t("trains.allStatuses")}</option>
            <option value="new">{t("trains.statusNew")}</option>
            <option value="old">{t("trains.statusOld")}</option>
          </select>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: 16,
            boxShadow: "var(--shadow-card)",
            overflow: "hidden",
          }}
        >
          <div style={tableHeadStyle}>
            <span>{t("trains.colId")}</span>
            <span>{t("trains.colDepot")}</span>
            <span>{t("trains.colStatus")}</span>
            <span>{t("trains.colCars")}</span>
            <span>{t("trains.colOccupied")}</span>
            <span>{t("trains.colRate")}</span>
            <span></span>
          </div>
          {isLoading && <div style={{ padding: 22, color: "var(--text-muted)", fontSize: 13.5 }}>{t("common.loading")}</div>}
          {rows.map(({ train, sellable, occupied, rate }) => (
            <div key={train.id} style={tableRowStyle}>
              <span style={{ font: "700 13.5px/1 var(--font-jetbrains-mono), monospace" }}>{train.number}</span>
              <span style={{ fontSize: 13, color: "var(--text-2)" }}>{train.depot_detail.code}</span>
              <Badge style={TRAIN_STATUS[train.status]} />
              <span style={{ fontSize: 13, color: "var(--text-2)" }}>{t("trains.carsCount", { count: train.car_count })}</span>
              <span style={{ font: "500 13px/1 var(--font-jetbrains-mono), monospace", color: "var(--text-2)" }}>
                {occupied} / {sellable}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ flex: 1 }}>
                  <ProgressBar pct={rate} height={7} color={rate > 85 ? "var(--occupied)" : "var(--navy-active)"} />
                </span>
                <span
                  style={{
                    font: "600 12px/1 var(--font-jetbrains-mono), monospace",
                    color: "var(--navy)",
                    minWidth: 34,
                    textAlign: "right",
                  }}
                >
                  {Math.round(rate)}%
                </span>
              </span>
              <div style={{ display: "flex", gap: 6, justifySelf: "start" }}>
                <Link
                  href={`/trains/${train.id}`}
                  style={{
                    border: "1px solid var(--border)",
                    background: "#fff",
                    color: "var(--navy)",
                    fontSize: 12.5,
                    fontWeight: 700,
                    padding: "8px 14px",
                    borderRadius: 9,
                  }}
                >
                  {t("trains.scheme")}
                </Link>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setEditing(train)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => {
                    setDeleting(train);
                    setDeleteError(null);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CreateTrainModal open={modalOpen} onOpenChange={setModalOpen} />
      <EditTrainModal key={editing?.id ?? "none"} open={!!editing} onOpenChange={(v) => !v && setEditing(null)} train={editing} />
      {deleting && (
        <ConfirmDeleteDialog
          open={!!deleting}
          onOpenChange={(v) => !v && setDeleting(null)}
          description={t("trains.deleteConfirm", { number: deleting.number })}
          onConfirm={() => deleteMutation.mutate(deleting.id)}
          pending={deleteMutation.isPending}
          error={deleteError}
        />
      )}
    </>
  );
}

const selectStyle: React.CSSProperties = {
  padding: "11px 14px",
  border: "1px solid var(--border)",
  borderRadius: 10,
  background: "#fff",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text)",
};

const tableHeadStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr .8fr .8fr .7fr 1fr 1.3fr auto",
  gap: 16,
  padding: "14px 22px",
  background: "#f8fafc",
  borderBottom: "1px solid var(--border)",
  font: "700 10.5px/1 var(--font-jetbrains-mono), monospace",
  color: "var(--text-faint)",
  letterSpacing: ".09em",
};

const tableRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr .8fr .8fr .7fr 1fr 1.3fr auto",
  gap: 16,
  padding: "15px 22px",
  borderBottom: "1px solid var(--border-soft)",
  alignItems: "center",
};
