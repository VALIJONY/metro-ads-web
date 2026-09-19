"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Paperclip, Plus } from "lucide-react";
import { api, ApiRequestError, downloadContractFile } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreatePaymentModal } from "@/components/CreatePaymentModal";
import { BulkBookingModal } from "@/components/BulkBookingModal";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { CONTRACT_STATUS, BOOKING_STATUS } from "@/lib/status";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatDate, money } from "@/lib/format";
import type { Booking, Payment } from "@/lib/types";

export default function ContractDetailPage() {
  const { t, td } = useLanguage();
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const contractId = Number(params.id);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<"bookings" | "payments" | "history">("bookings");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const canManage = user?.role === "admin" || user?.role === "manager";
  const canOperate = canManage || user?.role === "operator";

  const { data: contract, isLoading, isError } = useQuery({
    queryKey: ["contract", contractId],
    queryFn: () => api.contracts.get(contractId),
    enabled: Number.isFinite(contractId),
  });
  const { data: bookings } = useQuery({
    queryKey: ["contract-bookings", contractId],
    queryFn: () => api.contracts.bookings(contractId),
    enabled: Number.isFinite(contractId) && tab === "bookings",
  });
  const { data: payments } = useQuery({
    queryKey: ["payments", contractId],
    queryFn: () => api.payments.list(contractId),
    enabled: Number.isFinite(contractId) && tab === "payments",
  });
  const { data: history } = useQuery({
    queryKey: ["contract-history", contractId],
    queryFn: () => api.contracts.history(contractId),
    enabled: Number.isFinite(contractId) && tab === "history",
  });

  function invalidateContract() {
    queryClient.invalidateQueries({ queryKey: ["contract", contractId] });
    queryClient.invalidateQueries({ queryKey: ["contracts"] });
    queryClient.invalidateQueries({ queryKey: ["client-contracts"] });
  }

  const activateMutation = useMutation({
    mutationFn: () => api.contracts.activate(contractId),
    onSuccess: () => {
      invalidateContract();
      toast.success(t("contracts.activate"));
    },
    onError: (err) => setActionError(err instanceof ApiRequestError ? err.message : t("contracts.actionFailed")),
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.contracts.cancel(contractId, cancelReason),
    onSuccess: () => {
      invalidateContract();
      queryClient.invalidateQueries({ queryKey: ["contract-bookings", contractId] });
      toast.success(t("contracts.cancel"));
      setCancelling(false);
      setCancelReason("");
    },
    onError: (err) => setActionError(err instanceof ApiRequestError ? err.message : t("contracts.actionFailed")),
  });

  const cancelBookingMutation = useMutation({
    mutationFn: (bookingId: number) => api.bookings.cancel(bookingId, t("spacePanel.cancelBookingReason")),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract-bookings", contractId] });
      invalidateContract();
    },
    onError: (err) => setActionError(err instanceof ApiRequestError ? err.message : t("contracts.actionFailed")),
  });

  const markInstalledMutation = useMutation({
    mutationFn: (bookingId: number) => api.bookings.markInstalled(bookingId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contract-bookings", contractId] }),
    onError: (err) => setActionError(err instanceof ApiRequestError ? err.message : t("contracts.actionFailed")),
  });

  const markRemovedMutation = useMutation({
    mutationFn: (bookingId: number) => api.bookings.markRemoved(bookingId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contract-bookings", contractId] }),
    onError: (err) => setActionError(err instanceof ApiRequestError ? err.message : t("contracts.actionFailed")),
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (id: number) => api.payments.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", contractId] });
      invalidateContract();
      setDeletingPayment(null);
    },
    onError: (err) => setActionError(err instanceof ApiRequestError ? err.message : t("contracts.actionFailed")),
  });

  async function onUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setActionError(null);
    try {
      await api.contracts.uploadFile(contractId, file);
      invalidateContract();
      toast.success(t("contracts.fileUpload"));
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? err.message : t("contracts.fileUploadFailed"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (isLoading) return <div style={{ padding: 48, color: "var(--text-muted)", fontSize: 14 }}>{t("common.loading")}</div>;
  if (isError || !contract)
    return <div style={{ padding: 48, color: "var(--occupied)", fontSize: 14 }}>{t("contracts.notFoundDetail")}</div>;

  return (
    <>
      <PageHeader
        crumbs={[{ label: t("contracts.back"), href: "/contracts" }, { label: contract.number }]}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            {canManage && contract.status === "draft" && (
              <Button onClick={() => activateMutation.mutate()} disabled={activateMutation.isPending} className="bg-[var(--navy)] hover:bg-[var(--navy-active)]">
                {activateMutation.isPending ? t("common.saving") : t("contracts.activate")}
              </Button>
            )}
            {canManage && (contract.status === "draft" || contract.status === "active") && (
              <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setCancelling(true)}>
                {t("contracts.cancel")}
              </Button>
            )}
          </div>
        }
      />

      <div style={{ padding: "26px 32px 48px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, font: "800 26px/1 var(--font-jetbrains-mono), monospace", letterSpacing: "-.01em" }}>
            {contract.number}
          </h1>
          <Badge style={CONTRACT_STATUS[contract.status]} />
          <Link href={`/clients/${contract.client_detail.id}`} style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)" }}>
            {td(contract.client_detail.name)}
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
          <StatCard label={t("contracts.amount")} value={money(contract.amount)} />
          <StatCard label={t("contracts.paid")} value={money(contract.paid)} valueColor="var(--free-fg)" />
          <StatCard
            label={t("contracts.balance")}
            value={money(contract.balance)}
            valueColor={Number(contract.balance) > 0 ? "var(--occupied)" : "var(--free-fg)"}
          />
          <StatCard label={t("contracts.term")} value={`${formatDate(contract.start_date)} – ${formatDate(contract.end_date)}`} />
        </div>

        <section style={card}>
          <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border-soft)" }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{t("contracts.info")}</h2>
          </div>
          <div style={{ padding: "18px 22px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 18 }}>
            <InfoField label={t("contracts.signedDate")} value={formatDate(contract.date)} />
            {contract.note && <InfoField label={t("contracts.note")} value={td(contract.note)} />}
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <span style={infoLabel}>{t("contracts.file")}</span>
              {contract.file ? (
                <button
                  onClick={() => downloadContractFile(contractId, contract.file_name)}
                  style={{ display: "flex", alignItems: "center", gap: 7, border: "1px solid var(--border)", background: "#f8fafc", color: "var(--navy)", fontSize: 12.5, fontWeight: 700, padding: "9px 13px", borderRadius: 9, width: "fit-content" }}
                >
                  <Download style={{ width: 14, height: 14 }} /> {td(contract.file_name) || t("contracts.fileDownload")}
                </button>
              ) : (
                <span style={{ fontSize: 12.5, color: "var(--text-faint)" }}>{t("contracts.fileNone")}</span>
              )}
              {canManage && (
                <>
                  <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={onUploadFile} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{ display: "flex", alignItems: "center", gap: 7, border: "1px dashed var(--border)", background: "#fff", color: "var(--text-2)", fontSize: 12, fontWeight: 700, padding: "8px 12px", borderRadius: 9, width: "fit-content" }}
                  >
                    <Paperclip style={{ width: 13, height: 13 }} /> {uploading ? t("contracts.fileUploading") : t("contracts.fileUpload")}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {actionError && (
          <Alert variant="destructive">
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}

        <section style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", borderBottom: "1px solid var(--border-soft)", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", gap: 4 }}>
              <TabButton active={tab === "bookings"} onClick={() => setTab("bookings")}>{t("contracts.tabBookings")}</TabButton>
              <TabButton active={tab === "payments"} onClick={() => setTab("payments")}>{t("contracts.tabPayments")}</TabButton>
              <TabButton active={tab === "history"} onClick={() => setTab("history")}>{t("contracts.tabHistory")}</TabButton>
            </div>
            {tab === "bookings" && canManage && (contract.status === "draft" || contract.status === "active") && (
              <Button size="sm" onClick={() => setBulkModalOpen(true)} className="bg-[var(--navy)] hover:bg-[var(--navy-active)]">
                <Plus /> {t("contracts.bulkSell")}
              </Button>
            )}
            {tab === "payments" && canManage && (
              <Button size="sm" onClick={() => setPaymentModalOpen(true)} className="bg-[var(--navy)] hover:bg-[var(--navy-active)]">
                <Plus /> {t("payments.create")}
              </Button>
            )}
          </div>

          {tab === "bookings" && (
            <BookingsTab
              bookings={bookings}
              canOperate={canOperate}
              canManage={canManage}
              onCancel={(id) => cancelBookingMutation.mutate(id)}
              onMarkInstalled={(id) => markInstalledMutation.mutate(id)}
              onMarkRemoved={(id) => markRemovedMutation.mutate(id)}
            />
          )}
          {tab === "payments" && (
            <PaymentsTab payments={payments?.results} canManage={canManage} onDelete={(p) => setDeletingPayment(p)} />
          )}
          {tab === "history" && <HistoryTab rows={history} />}
        </section>
      </div>

      <CreatePaymentModal open={paymentModalOpen} onOpenChange={setPaymentModalOpen} contractId={contractId} />
      <BulkBookingModal
        open={bulkModalOpen}
        onOpenChange={setBulkModalOpen}
        contractId={contractId}
        contractStartDate={contract.start_date}
        contractEndDate={contract.end_date}
      />

      {cancelling && (
        <CancelContractDialog
          open={cancelling}
          onOpenChange={(v) => {
            setCancelling(v);
            if (!v) setCancelReason("");
          }}
          reason={cancelReason}
          onReasonChange={setCancelReason}
          onConfirm={() => cancelMutation.mutate()}
          pending={cancelMutation.isPending}
        />
      )}

      {deletingPayment && (
        <ConfirmDeleteDialog
          open={!!deletingPayment}
          onOpenChange={(v) => !v && setDeletingPayment(null)}
          description={t("payments.deleteConfirm")}
          onConfirm={() => deletePaymentMutation.mutate(deletingPayment.id)}
          pending={deletePaymentMutation.isPending}
        />
      )}
    </>
  );
}

function CancelContractDialog({
  open,
  onOpenChange,
  reason,
  onReasonChange,
  onConfirm,
  pending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reason: string;
  onReasonChange: (v: string) => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: open ? "flex" : "none", alignItems: "center", justifyContent: "center", background: "rgba(15,42,67,.35)" }} onClick={() => onOpenChange(false)}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 22, width: 420, maxWidth: "92vw", display: "flex", flexDirection: "column", gap: 14 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{t("contracts.cancel")}</h3>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>{t("contracts.cancelConfirm")}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <label style={infoLabel}>{t("contracts.cancelReason")}</label>
          <input
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder={t("contracts.cancelReasonPlaceholder")}
            style={{ padding: "11px 13px", border: "1px solid var(--border)", borderRadius: 10, fontSize: 13.5, outline: "none" }}
          />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={pending}>
            {pending ? t("common.saving") : t("contracts.cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function BookingsTab({
  bookings,
  canOperate,
  canManage,
  onCancel,
  onMarkInstalled,
  onMarkRemoved,
}: {
  bookings?: Booking[];
  canOperate: boolean;
  canManage: boolean;
  onCancel: (id: number) => void;
  onMarkInstalled: (id: number) => void;
  onMarkRemoved: (id: number) => void;
}) {
  const { t, td } = useLanguage();
  if (!bookings?.length) {
    return <div style={{ padding: 22, color: "var(--text-muted)", fontSize: 13.5 }}>{t("contracts.noBookings")}</div>;
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 760 }}>
        <div style={bookingThead}>
          <span>{t("contracts.bookingSpace")}</span>
          <span>{t("contracts.bookingFirm")}</span>
          <span>{t("contracts.bookingTerm")}</span>
          <span>{t("contracts.bookingPrice")}</span>
          <span>{t("contracts.bookingStatus")}</span>
          <span></span>
        </div>
        {bookings.map((b) => (
          <div key={b.id} style={bookingRow}>
            <span style={{ font: "700 12.5px/1 var(--font-jetbrains-mono), monospace" }}>{b.ad_space_detail.code}</span>
            <span style={{ fontSize: 13 }}>{td(b.ad_name)}</span>
            <span style={{ fontSize: 12, color: "var(--text-2)" }}>{formatDate(b.start_date)} – {formatDate(b.end_date)}</span>
            <span style={{ font: "600 12.5px/1 var(--font-jetbrains-mono), monospace" }}>{money(b.price)}</span>
            <Badge style={BOOKING_STATUS[b.status]} small />
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
              {canOperate && !b.installed_date && b.status !== "cancelled" && (
                <SmallButton onClick={() => onMarkInstalled(b.id)}>{t("contracts.bookingMarkInstalled")}</SmallButton>
              )}
              {canOperate && b.installed_date && !b.removed_date && b.status !== "cancelled" && (
                <SmallButton onClick={() => onMarkRemoved(b.id)}>{t("contracts.bookingMarkRemoved")}</SmallButton>
              )}
              {canManage && b.status !== "cancelled" && (
                <SmallButton
                  destructive
                  onClick={() => {
                    if (window.confirm(t("contracts.bookingCancelConfirm"))) onCancel(b.id);
                  }}
                >
                  {t("contracts.bookingCancel")}
                </SmallButton>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentsTab({
  payments,
  canManage,
  onDelete,
}: {
  payments?: Payment[];
  canManage: boolean;
  onDelete: (p: Payment) => void;
}) {
  const { t, td } = useLanguage();
  if (!payments?.length) {
    return <div style={{ padding: 22, color: "var(--text-muted)", fontSize: 13.5 }}>{t("payments.noPayments")}</div>;
  }
  return (
    <div>
      <div style={paymentThead}>
        <span>{t("payments.colDate")}</span>
        <span>{t("payments.colAmount")}</span>
        <span>{t("payments.colType")}</span>
        <span>{t("payments.colDoc")}</span>
        <span></span>
      </div>
      {payments.map((p) => (
        <div key={p.id} style={paymentRow}>
          <span style={{ fontSize: 13 }}>{formatDate(p.payment_date)}</span>
          <span style={{ font: "700 13px/1 var(--font-jetbrains-mono), monospace", color: "var(--free-fg)" }}>{money(p.amount)}</span>
          <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>{t(`paymentType.${p.payment_type}`)}</span>
          <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>{td(p.document_number) || "—"}</span>
          {canManage ? <SmallButton destructive onClick={() => onDelete(p)}>{t("common.delete")}</SmallButton> : <span />}
        </div>
      ))}
    </div>
  );
}

function HistoryTab({ rows }: { rows?: { history_id: number; history_date: string; history_type: string; status: string; amount: string }[] }) {
  const { t } = useLanguage();
  if (!rows?.length) {
    return <div style={{ padding: 22, color: "var(--text-muted)", fontSize: 13.5 }}>{t("contracts.historyEmpty")}</div>;
  }
  return (
    <div style={{ padding: "10px 22px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map((h) => (
        <div key={h.history_id} style={{ display: "flex", gap: 14, alignItems: "center", fontSize: 12.5, padding: "9px 0", borderBottom: "1px solid var(--border-soft)" }}>
          <span style={{ font: "600 11px/1 var(--font-jetbrains-mono), monospace", color: "var(--text-faint)", minWidth: 130 }}>
            {formatDate(h.history_date)}
          </span>
          <Badge style={CONTRACT_STATUS[h.status as keyof typeof CONTRACT_STATUS] ?? { bg: "#eef2f6", border: "#dde4ea", fg: "#4a5a6b", labelKey: "" }} small />
          <span style={{ font: "600 12px/1 var(--font-jetbrains-mono), monospace", color: "var(--text-2)" }}>{money(h.amount)}</span>
        </div>
      ))}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={infoLabel}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: 0,
        background: active ? "var(--navy)" : "transparent",
        color: active ? "#fff" : "var(--text-muted)",
        fontSize: 12.5,
        fontWeight: 700,
        padding: "8px 14px",
        borderRadius: 8,
      }}
    >
      {children}
    </button>
  );
}

function SmallButton({ onClick, children, destructive }: { onClick: () => void; children: React.ReactNode; destructive?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: `1px solid ${destructive ? "#f0c7be" : "var(--border)"}`,
        background: "#fff",
        color: destructive ? "var(--occupied)" : "var(--navy)",
        fontSize: 11.5,
        fontWeight: 700,
        padding: "6px 10px",
        borderRadius: 8,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid var(--border)",
  borderRadius: 16,
  boxShadow: "var(--shadow-card)",
  overflow: "hidden",
};

const infoLabel: React.CSSProperties = {
  font: "600 10.5px/1 var(--font-jetbrains-mono), monospace",
  color: "var(--text-faint-2)",
  letterSpacing: ".09em",
};

const bookingThead: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1.3fr 1.3fr 1fr .9fr 1.4fr",
  gap: 14,
  padding: "12px 22px",
  background: "#f8fafc",
  borderBottom: "1px solid var(--border)",
  font: "700 10.5px/1 var(--font-jetbrains-mono), monospace",
  color: "var(--text-faint)",
  letterSpacing: ".08em",
};

const bookingRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1.3fr 1.3fr 1fr .9fr 1.4fr",
  gap: 14,
  padding: "12px 22px",
  borderBottom: "1px solid var(--border-soft)",
  alignItems: "center",
};

const paymentThead: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr 1fr .6fr",
  gap: 14,
  padding: "12px 22px",
  background: "#f8fafc",
  borderBottom: "1px solid var(--border)",
  font: "700 10.5px/1 var(--font-jetbrains-mono), monospace",
  color: "var(--text-faint)",
  letterSpacing: ".08em",
};

const paymentRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr 1fr .6fr",
  gap: 14,
  padding: "12px 22px",
  borderBottom: "1px solid var(--border-soft)",
  alignItems: "center",
};
