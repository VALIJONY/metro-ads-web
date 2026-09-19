"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Key, Pencil, Plus, UserX } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/ui/button";
import { CreateUserModal } from "@/components/CreateUserModal";
import { ResetPasswordDialog } from "@/components/ResetPasswordDialog";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { User } from "@/lib/types";

const ROLE_STYLE = {
  bg: "#e8eef4",
  border: "#d3dfe9",
  fg: "var(--navy)",
};

export default function UsersPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [resetting, setResetting] = useState<User | null>(null);
  const [deactivating, setDeactivating] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["users", q],
    queryFn: () => api.users.list({ search: q || undefined }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => api.users.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(t("users.deactivate"));
      setDeactivating(null);
    },
  });

  return (
    <>
      <PageHeader
        crumbs={[{ label: t("nav.dashboard"), href: "/" }, { label: t("users.title") }]}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="bg-[var(--navy)] hover:bg-[var(--navy-active)]"
          >
            <Plus /> {t("users.create")}
          </Button>
        }
      />
      <div style={{ padding: "28px 32px 48px", display: "flex", flexDirection: "column", gap: 18 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-.01em" }}>{t("users.title")}</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("users.searchPlaceholder")}
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
            <span>{t("users.colName")}</span>
            <span>{t("users.colUsername")}</span>
            <span>{t("users.colRole")}</span>
            <span>{t("users.colStatus")}</span>
            <span></span>
          </div>
          {isLoading && <div style={{ padding: 22, color: "var(--text-muted)", fontSize: 13.5 }}>{t("common.loading")}</div>}
          {data?.results.map((u) => (
            <div key={u.id} style={row}>
              <span style={{ fontSize: 13.5, fontWeight: 700 }}>
                {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : "—"}
              </span>
              <span style={{ font: "600 12.5px/1 var(--font-jetbrains-mono), monospace" }}>{u.username}</span>
              <Badge style={{ ...ROLE_STYLE, labelKey: `role.${u.role}` }} />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: u.is_active === false ? "var(--occupied)" : "var(--free-fg)",
                }}
              >
                {u.is_active === false ? t("common.inactive") : t("common.active")}
              </span>
              <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => {
                    setEditing(u);
                    setModalOpen(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setResetting(u)}>
                  <Key className="h-3.5 w-3.5" />
                </Button>
                {u.is_active !== false && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => setDeactivating(u)}
                  >
                    <UserX className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {data && data.results.length === 0 && (
            <div style={{ padding: 22, color: "var(--text-muted)", fontSize: 13.5 }}>{t("users.notFound")}</div>
          )}
        </div>
      </div>

      <CreateUserModal key={editing?.id ?? "new"} open={modalOpen} onOpenChange={setModalOpen} user={editing} />
      <ResetPasswordDialog open={!!resetting} onOpenChange={(v) => !v && setResetting(null)} user={resetting} />
      {deactivating && (
        <ConfirmDeleteDialog
          open={!!deactivating}
          onOpenChange={(v) => !v && setDeactivating(null)}
          description={t("users.deactivateConfirm", { name: deactivating.username })}
          onConfirm={() => deactivateMutation.mutate(deactivating.id)}
          pending={deactivateMutation.isPending}
        />
      )}
    </>
  );
}

const thead: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.2fr 1fr .9fr .8fr auto",
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
  gridTemplateColumns: "1.2fr 1fr .9fr .8fr auto",
  gap: 16,
  padding: "13px 22px",
  borderBottom: "1px solid var(--border-soft)",
  alignItems: "center",
};
