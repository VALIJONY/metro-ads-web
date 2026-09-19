"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiRequestError } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { CreateAdTypeModal } from "@/components/CreateAdTypeModal";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { money } from "@/lib/format";
import type { AdType } from "@/lib/types";

export default function AdTypesPage() {
  const { t, td } = useLanguage();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdType | null>(null);
  const [deleting, setDeleting] = useState<AdType | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["ad-types"], queryFn: () => api.adTypes.list() });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.adTypes.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-types"] });
      toast.success(t("common.delete"));
      setDeleting(null);
    },
    onError: (err) =>
      setDeleteError(
        err instanceof ApiRequestError && err.status === 409
          ? t("adTypes.deleteBlocked")
          : err instanceof ApiRequestError
            ? err.message
            : t("common.error.generic")
      ),
  });

  return (
    <>
      <PageHeader
        crumbs={[{ label: t("nav.dashboard"), href: "/" }, { label: t("adTypes.title") }]}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="bg-[var(--navy)] hover:bg-[var(--navy-active)]"
          >
            <Plus /> {t("adTypes.create")}
          </Button>
        }
      />
      <div style={{ padding: "28px 32px 48px", display: "flex", flexDirection: "column", gap: 18 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-.01em" }}>{t("adTypes.title")}</h1>

        {isLoading && <p style={{ color: "var(--text-muted)", fontSize: 13.5 }}>{t("common.loading")}</p>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
          {data?.results.map((a) => (
            <section
              key={a.id}
              style={{
                background: "#fff",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: 20,
                boxShadow: "var(--shadow-card)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{td(a.name)}</h2>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => {
                      setEditing(a);
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
                      setDeleting(a);
                      setDeleteError(null);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--text-muted)" }}>
                <span>{a.unit}</span>
                <span>{a.size_type === "area" ? t("adTypes.sizeTypeArea") : t("adTypes.sizeTypeComplex")}</span>
              </div>
              <span style={{ font: "700 13px/1 var(--font-jetbrains-mono), monospace", color: "var(--navy)" }}>
                {money(a.default_base_price)}
              </span>
              {a.note && <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-2)" }}>{td(a.note)}</p>}
            </section>
          ))}
          {data && data.results.length === 0 && (
            <p style={{ fontSize: 13.5, color: "var(--text-muted)" }}>{t("adTypes.notFound")}</p>
          )}
        </div>
      </div>

      <CreateAdTypeModal key={editing?.id ?? "new"} open={modalOpen} onOpenChange={setModalOpen} adType={editing} />
      {deleting && (
        <ConfirmDeleteDialog
          open={!!deleting}
          onOpenChange={(v) => !v && setDeleting(null)}
          description={t("adTypes.deleteConfirm", { name: deleting.name })}
          onConfirm={() => deleteMutation.mutate(deleting.id)}
          pending={deleteMutation.isPending}
          error={deleteError}
        />
      )}
    </>
  );
}
