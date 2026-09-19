"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiRequestError } from "@/lib/api";
import { Badge } from "@/components/Badge";
import { VISUAL_STATUS } from "@/lib/status";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatDate, formatThousands, money, unformatThousands } from "@/lib/format";
import type { AdSpaceStatus, Contract, LayoutSpace } from "@/lib/types";

const HISTORY_STATUS_LABEL: Record<string, string> = {
  active: "spacePanel.statusActive",
  temporarily_closed: "spacePanel.statusClosed",
  prohibited: "spacePanel.statusProhibited",
};

export function SpaceSidePanel({
  space,
  onClose,
  invalidateKey,
}: {
  space: LayoutSpace;
  onClose: () => void;
  invalidateKey: unknown[];
}) {
  const { t, td } = useLanguage();
  const queryClient = useQueryClient();
  const { data: adTypes } = useQuery({ queryKey: ["ad-types"], queryFn: () => api.adTypes.list() });

  const STATUS_OPTIONS: { value: AdSpaceStatus; labelKey: string }[] = [
    { value: "active", labelKey: "spacePanel.statusActive" },
    { value: "temporarily_closed", labelKey: "spacePanel.statusClosed" },
    { value: "prohibited", labelKey: "spacePanel.statusProhibited" },
  ];

  const [adType, setAdType] = useState(space.ad_type.id);
  const [areaM2, setAreaM2] = useState(space.area_m2);
  const [basePrice, setBasePrice] = useState(space.base_price);
  const [status, setStatus] = useState<AdSpaceStatus>(space.status);
  const [reason, setReason] = useState(space.status_reason ?? "");
  const [error, setError] = useState<string | null>(null);

  const [bookingClient, setBookingClient] = useState<number | "">("");
  const [bookingContract, setBookingContract] = useState<number | "">("");
  const [bookingAdName, setBookingAdName] = useState("");
  const [bookingStartDate, setBookingStartDate] = useState("");
  const [bookingEndDate, setBookingEndDate] = useState("");
  const [bookingPrice, setBookingPrice] = useState(space.base_price);
  const [bookingArea, setBookingArea] = useState(space.area_m2);
  const [bookingQuantity, setBookingQuantity] = useState(1);
  const [historyOpen, setHistoryOpen] = useState(false);

  const isSellable = !space.booking && space.status === "active";

  const { data: history } = useQuery({
    queryKey: ["space-history", space.id],
    queryFn: () => api.spaces.history(space.id),
    enabled: historyOpen,
  });

  const { data: bookingClients } = useQuery({
    queryKey: ["clients"],
    queryFn: () => api.clients.list(),
    enabled: isSellable,
  });
  const { data: bookingClientContracts } = useQuery({
    queryKey: ["client-contracts", bookingClient],
    queryFn: () => api.clients.contracts(bookingClient as number),
    enabled: isSellable && bookingClient !== "",
  });
  const sellableContracts = (bookingClientContracts ?? []).filter(
    (c: Contract) => c.status === "draft" || c.status === "active",
  );

  function selectBookingContract(id: number) {
    setBookingContract(id);
    const contract = sellableContracts.find((c) => c.id === id);
    if (contract) {
      setBookingStartDate(contract.start_date);
      setBookingEndDate(contract.end_date);
      setBookingPrice(contract.amount);
      setBookingAdName(contract.client_detail.name);
    }
  }

  // Eslatma: bu komponent chaqiruvchi tomonidan `key={space.id}` bilan render qilinadi,
  // shu sababli `space` o'zgarganda komponent qayta yaratiladi va useState boshlang'ich
  // qiymatlari avtomatik yangilanadi — qo'shimcha useEffect kerak emas.

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: invalidateKey });
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.spaces.update(space.id, { ad_type: adType, area_m2: areaM2, base_price: basePrice });
      if (status !== space.status) await api.spaces.setStatus(space.id, status, reason);
    },
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : t("spacePanel.saveFailed")),
  });

  const cancelBookingMutation = useMutation({
    mutationFn: () => api.bookings.cancel(space.booking!.id, t("spacePanel.cancelBookingReason")),
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : t("spacePanel.cancelFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.spaces.remove(space.id),
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : t("spacePanel.deleteFailed")),
  });

  const createBookingMutation = useMutation({
    mutationFn: () => {
      if (!bookingContract || !bookingAdName || !bookingStartDate || !bookingEndDate) {
        throw new Error(t("createSpace.validationError"));
      }
      return api.bookings.create({
        contract: bookingContract,
        ad_space: space.id,
        ad_name: bookingAdName,
        start_date: bookingStartDate,
        end_date: bookingEndDate,
        price: bookingPrice,
        used_area: bookingArea,
        quantity: bookingQuantity,
      });
    },
    onSuccess: () => {
      invalidate();
      toast.success(t("spacePanel.sellSuccess"));
      onClose();
    },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : t("spacePanel.sellFailed")),
  });

  const style = VISUAL_STATUS[space.visual];

  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(15,42,67,.28)", zIndex: 40 }}
        onClick={onClose}
      />
      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 436,
          maxWidth: "92vw",
          background: "#fff",
          borderLeft: "1px solid var(--border)",
          boxShadow: "var(--shadow-panel)",
          zIndex: 41,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-soft)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <span style={label}>{t("spacePanel.title")}</span>
            <span style={{ font: "700 15px/1.2 var(--font-jetbrains-mono), monospace" }}>{space.code}</span>
            <Badge style={style} />
          </div>
          <button onClick={onClose} style={closeBtn}>
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 26px", display: "flex", flexDirection: "column", gap: 18 }}>
          <Field label={t("spacePanel.adType")}>
            <select value={adType} onChange={(e) => setAdType(Number(e.target.value))} style={input}>
              {adTypes?.results.map((at) => (
                <option key={at.id} value={at.id}>
                  {td(at.name)}
                </option>
              ))}
            </select>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label={t("spacePanel.area")}>
              <input value={areaM2} onChange={(e) => setAreaM2(e.target.value)} style={{ ...input, fontFamily: "var(--font-jetbrains-mono)" }} />
            </Field>
            <Field label={t("spacePanel.price")}>
              <input
                value={formatThousands(basePrice)}
                onChange={(e) => setBasePrice(unformatThousands(e.target.value))}
                inputMode="numeric"
                style={{ ...input, fontFamily: "var(--font-jetbrains-mono)" }}
              />
            </Field>
          </div>

          <div style={{ height: 1, background: "var(--border-soft)" }} />

          <Field label={t("spacePanel.status")}>
            <select value={status} onChange={(e) => setStatus(e.target.value as AdSpaceStatus)} style={input}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {t(o.labelKey)}
                </option>
              ))}
            </select>
          </Field>
          {status !== "active" && (
            <Field label={t("spacePanel.reason")}>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("spacePanel.reasonPlaceholder")}
                style={input}
              />
            </Field>
          )}

          <div style={{ height: 1, background: "var(--border-soft)" }} />

          {space.booking ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <ReadField label={t("spacePanel.firm")} value={td(space.booking.ad_name)} bold />
                <ReadField label={t("spacePanel.client")} value={td(space.booking.client.name)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <ReadField label={t("spacePanel.contractNumber")} value={space.booking.contract.number} mono />
                <ReadField label={t("spacePanel.agreedPrice")} value={money(space.booking.price)} mono />
              </div>
              <Field label={t("spacePanel.term")}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 13, border: "1px solid var(--border-soft)", borderRadius: 10, background: "#f8fafc" }}>
                  <span style={{ font: "600 13.5px/1 var(--font-jetbrains-mono), monospace" }}>
                    {formatDate(space.booking.start_date)}
                  </span>
                  <span style={{ flex: 1, height: 6, borderRadius: 4, background: "var(--border)" }} />
                  <span style={{ font: "600 13.5px/1 var(--font-jetbrains-mono), monospace" }}>
                    {formatDate(space.booking.end_date)}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
                  {t("spacePanel.daysLeft", { days: space.booking.days_left })}
                </span>
              </Field>
            </>
          ) : isSellable ? (
            <>
              <span style={label}>{t("spacePanel.sellSection")}</span>

              <Field label={t("spacePanel.client")}>
                <select
                  value={bookingClient}
                  onChange={(e) => {
                    setBookingClient(e.target.value ? Number(e.target.value) : "");
                    setBookingContract("");
                    setBookingStartDate("");
                    setBookingEndDate("");
                  }}
                  style={input}
                >
                  <option value="">{t("spacePanel.selectClient")}</option>
                  {bookingClients?.results.map((c) => (
                    <option key={c.id} value={c.id}>
                      {td(c.name)}
                    </option>
                  ))}
                </select>
              </Field>

              {bookingClient !== "" && (
                <Field label={t("spacePanel.selectContract")}>
                  <select
                    value={bookingContract}
                    onChange={(e) => selectBookingContract(Number(e.target.value))}
                    style={input}
                    disabled={sellableContracts.length === 0}
                  >
                    <option value="">{t("spacePanel.selectContract")}</option>
                    {sellableContracts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.number} — {formatDate(c.start_date)}…{formatDate(c.end_date)}
                      </option>
                    ))}
                  </select>
                  {sellableContracts.length === 0 && bookingClientContracts && (
                    <span style={{ fontSize: 11.5, color: "var(--text-faint)" }}>
                      {t("spacePanel.noContractsHint")}
                    </span>
                  )}
                </Field>
              )}

              {bookingContract !== "" && (
                <>
                  <Field label={t("spacePanel.firm")}>
                    <input
                      value={bookingAdName}
                      onChange={(e) => setBookingAdName(e.target.value)}
                      placeholder={t("spacePanel.adNamePlaceholder")}
                      style={input}
                    />
                  </Field>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <Field label={t("spacePanel.bookStartDate")}>
                      <input
                        type="date"
                        value={bookingStartDate}
                        onChange={(e) => setBookingStartDate(e.target.value)}
                        style={input}
                      />
                    </Field>
                    <Field label={t("spacePanel.bookEndDate")}>
                      <input
                        type="date"
                        value={bookingEndDate}
                        onChange={(e) => setBookingEndDate(e.target.value)}
                        style={input}
                      />
                    </Field>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <Field label={t("spacePanel.bookArea")}>
                      <input
                        value={bookingArea}
                        onChange={(e) => setBookingArea(e.target.value)}
                        style={{ ...input, fontFamily: "var(--font-jetbrains-mono)" }}
                      />
                    </Field>
                    <Field label={t("spacePanel.bookQuantity")}>
                      <input
                        type="number"
                        min={1}
                        value={bookingQuantity}
                        onChange={(e) => setBookingQuantity(Math.max(1, Number(e.target.value) || 1))}
                        style={{ ...input, fontFamily: "var(--font-jetbrains-mono)" }}
                      />
                    </Field>
                  </div>

                  <Field label={t("spacePanel.bookPrice")}>
                    <input
                      value={formatThousands(bookingPrice)}
                      onChange={(e) => setBookingPrice(unformatThousands(e.target.value))}
                      inputMode="numeric"
                      style={{ ...input, fontFamily: "var(--font-jetbrains-mono)" }}
                    />
                  </Field>

                  <button
                    onClick={() => createBookingMutation.mutate()}
                    disabled={createBookingMutation.isPending}
                    style={{ border: 0, background: "var(--free-fg, #1c7a4b)", color: "#fff", fontSize: 13.5, fontWeight: 700, padding: 12, borderRadius: 10 }}
                  >
                    {createBookingMutation.isPending ? t("common.creating") : t("spacePanel.sell")}
                  </button>
                </>
              )}
            </>
          ) : (
            <div style={{ fontSize: 12.5, color: "var(--text-faint)", lineHeight: 1.6 }}>{t("spacePanel.notSellable")}</div>
          )}

          {error && (
            <div style={{ padding: "10px 13px", borderRadius: 10, background: "#ffe3dd", border: "1px solid #f0c7be", color: "#8c2f1d", fontSize: 12.5, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div style={{ height: 1, background: "var(--border-soft)" }} />
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            style={{ border: 0, background: "transparent", color: "var(--text-muted)", fontSize: 12, fontWeight: 700, padding: 0, textAlign: "left", width: "fit-content" }}
          >
            {historyOpen ? t("spacePanel.hideHistory") : t("spacePanel.showHistory")}
          </button>
          {historyOpen && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {!history?.length && (
                <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{t("spacePanel.historyEmpty")}</span>
              )}
              {history?.map((h) => (
                <div key={h.history_id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "8px 0", borderBottom: "1px solid var(--border-soft)" }}>
                  <span style={{ color: "var(--text-2)" }}>
                    {h.history_type === "+" ? t("spacePanel.historyCreated") : h.history_type === "-" ? t("spacePanel.historyDeleted") : t("spacePanel.historyChanged")}
                    {" · "}{HISTORY_STATUS_LABEL[h.status] ? t(HISTORY_STATUS_LABEL[h.status]) : h.status}
                  </span>
                  <span style={{ font: "600 11px/1 var(--font-jetbrains-mono), monospace", color: "var(--text-faint)" }}>
                    {formatDate(h.history_date)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-soft)", display: "flex", flexDirection: "column", gap: 10, background: "#fbfcfd" }}>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              style={{ flex: 1, border: 0, background: "var(--navy)", color: "#fff", fontSize: 13.5, fontWeight: 700, padding: 12, borderRadius: 10 }}
            >
              {saveMutation.isPending ? t("common.saving") : t("spacePanel.save")}
            </button>
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              style={{ border: "1px solid #f0c7be", background: "#fff", color: "var(--occupied)", fontSize: 13.5, fontWeight: 700, padding: "12px 16px", borderRadius: 10 }}
            >
              {t("common.delete")}
            </button>
          </div>
          {space.booking && (
            <button
              onClick={() => cancelBookingMutation.mutate()}
              disabled={cancelBookingMutation.isPending}
              style={{ border: "1px solid var(--border)", background: "#fff", color: "var(--text-2)", fontSize: 13, fontWeight: 700, padding: 11, borderRadius: 10 }}
            >
              {cancelBookingMutation.isPending ? t("common.deleting") : t("spacePanel.cancelBooking")}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

function Field({ label: l, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <label style={label}>{l}</label>
      {children}
    </div>
  );
}

function ReadField({ label: l, value, mono, bold }: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <span style={label}>{l}</span>
      <div
        style={{
          padding: "11px 13px",
          border: "1px solid var(--border-soft)",
          borderRadius: 10,
          background: "#f8fafc",
          fontSize: 13.5,
          fontWeight: bold ? 700 : 600,
          fontFamily: mono ? "var(--font-jetbrains-mono)" : undefined,
        }}
      >
        {value}
      </div>
    </div>
  );
}

const label: React.CSSProperties = {
  font: "600 10.5px/1 var(--font-jetbrains-mono), monospace",
  color: "var(--text-faint-2)",
  letterSpacing: ".09em",
};

const input: React.CSSProperties = {
  padding: "11px 13px",
  border: "1px solid var(--border)",
  borderRadius: 10,
  fontSize: 13.5,
  fontWeight: 600,
  color: "var(--text)",
  background: "#fff",
  outline: "none",
};

const closeBtn: React.CSSProperties = {
  border: "1px solid var(--border)",
  background: "#fff",
  width: 32,
  height: 32,
  borderRadius: 9,
  color: "var(--text-muted)",
  fontSize: 15,
  lineHeight: 1,
};
