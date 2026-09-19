"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { TrainVisual } from "@/components/TrainVisual";
import { SpaceSidePanel } from "@/components/SpaceSidePanel";
import { CreateSpaceModal } from "@/components/CreateSpaceModal";
import { EditTrainModal } from "@/components/EditTrainModal";
import { AddCarModal } from "@/components/AddCarModal";
import { Button } from "@/components/ui/button";
import { TRAIN_STATUS, VISUAL_STATUS } from "@/lib/status";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatDate, money } from "@/lib/format";
import type { LayoutSpace } from "@/lib/types";

export default function TrainDetailPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const trainId = Number(params.id);
  const [view, setView] = useState<"visual" | "table">("visual");
  const [selected, setSelected] = useState<LayoutSpace | null>(null);
  const [creating, setCreating] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addingCar, setAddingCar] = useState(false);
  const canManage = user?.role === "admin" || user?.role === "manager";

  const queryKey = ["train-layout", trainId];
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => api.trains.layout(trainId),
    enabled: Number.isFinite(trainId),
  });
  const { data: trainFull } = useQuery({
    queryKey: ["train", trainId],
    queryFn: () => api.trains.get(trainId),
    enabled: Number.isFinite(trainId),
  });

  const allSpaces = useMemo(
    () => data?.cars.flatMap((c) => c.spaces.map((s) => ({ ...s, carPosition: c.position }))) ?? [],
    [data]
  );

  if (isLoading) return <div style={{ padding: 48, color: "var(--text-muted)", fontSize: 14 }}>{t("common.loading")}</div>;
  if (isError || !data)
    return <div style={{ padding: 48, color: "var(--occupied)", fontSize: 14 }}>{t("trainDetail.loadFailed")}</div>;

  const { train, stats, cars } = data;
  const status = TRAIN_STATUS[train.status];

  return (
    <>
      <PageHeader
        crumbs={[
          { label: train.depot.code, href: "/depots" },
          { label: train.number },
        ]}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            {canManage && (
              <>
                <Button variant="outline" onClick={() => setEditOpen(true)}>
                  {t("trains.edit")}
                </Button>
                <Button variant="outline" onClick={() => setAddingCar(true)}>
                  {t("trains.addCar")}
                </Button>
              </>
            )}
            <button
              onClick={() => setCreating(true)}
              style={{
                border: 0,
                background: "var(--navy)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                padding: "11px 18px",
                borderRadius: 10,
                whiteSpace: "nowrap",
                boxShadow: "0 8px 18px -10px rgba(15,42,67,.8)",
              }}
            >
              {t("trainDetail.createSpace")}
            </button>
          </div>
        }
      />

      <div style={{ padding: "26px 32px 48px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <div style={{ font: "600 10.5px/1 var(--font-jetbrains-mono), monospace", color: "var(--text-faint)", letterSpacing: ".1em" }}>
              {t("nav.trains").toUpperCase()}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, font: "800 30px/1 var(--font-jetbrains-mono), monospace", letterSpacing: "-.02em" }}>
                {train.number}
              </h1>
              <span style={{ padding: "6px 12px", borderRadius: 8, background: "#e8eef4", color: "var(--navy)", fontSize: 12.5, fontWeight: 700 }}>
                {train.depot.code}
              </span>
              <Badge style={status} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 28, marginLeft: "auto", flexWrap: "wrap" }}>
            <Metric label={t("trainDetail.totalSpaces")} value={stats.total_spaces} />
            <Metric label={t("trainDetail.occupied")} value={stats.occupied} color="var(--occupied)" />
            <Metric label={t("trainDetail.ending")} value={stats.ending} color="var(--warn)" />
            <Metric label={t("trainDetail.free")} value={stats.free} color="var(--free-fg)" />
          </div>
        </div>

        <section
          style={{
            border: "1px solid var(--border)",
            borderRadius: 20,
            background: "#fff",
            boxShadow: "0 18px 34px -26px rgba(15,42,67,.55)",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "16px 22px", borderBottom: "1px solid var(--border-soft)", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{t("trainDetail.schemeTitle")}</h2>
              <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
                {train.status === "new" ? t("trainDetail.schemeNoteNew") : t("trainDetail.schemeNoteOld")}
              </span>
            </div>
            <div style={{ display: "flex", gap: 4, padding: 4, background: "var(--border-soft)", borderRadius: 11 }}>
              <TabButton active={view === "visual"} onClick={() => setView("visual")}>
                {t("trainDetail.tabVisual")}
              </TabButton>
              <TabButton active={view === "table"} onClick={() => setView("table")}>
                {t("trainDetail.tabTable")}
              </TabButton>
            </div>
          </div>

          {view === "visual" ? (
            <TrainVisual cars={cars} trainStatus={train.status} selectedId={selected?.id ?? null} onSelect={setSelected} />
          ) : (
            <TableView spaces={allSpaces} onSelect={setSelected} />
          )}

          <div style={{ display: "flex", gap: 26, flexWrap: "wrap", padding: "16px 24px", borderTop: "1px solid var(--border-soft)", background: "#fbfcfd" }}>
            <Legend status="free" />
            <Legend status="occupied" />
            <Legend status="ending" />
            <Legend status="closed" />
            <Legend status="prohibited" />
            <div style={{ marginLeft: "auto", font: "500 11.5px/1 var(--font-jetbrains-mono), monospace", color: "var(--text-faint-2)", alignSelf: "center" }}>
              {t("trainDetail.summary", { cars: cars.length, spaces: cars[0]?.spaces.length ?? 0 })}
            </div>
          </div>
        </section>
      </div>

      {selected && (
        <SpaceSidePanel key={selected.id} space={selected} onClose={() => setSelected(null)} invalidateKey={queryKey} />
      )}
      {creating && (
        <CreateSpaceModal trainNumber={train.number} cars={cars} onClose={() => setCreating(false)} invalidateKey={queryKey} />
      )}
      <EditTrainModal key={trainFull?.id ?? "loading"} open={editOpen} onOpenChange={setEditOpen} train={trainFull ?? null} />
      <AddCarModal
        open={addingCar}
        onOpenChange={setAddingCar}
        trainId={trainId}
        nextPosition={cars.length + 1}
        invalidateKey={queryKey}
      />
    </>
  );
}

function Metric({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ font: "600 10px/1 var(--font-jetbrains-mono), monospace", color: "#8494a5", letterSpacing: ".09em" }}>
        {label}
      </span>
      <span style={{ fontSize: 20, fontWeight: 800, color: color ?? "var(--text)" }}>{value}</span>
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
        font: "700 12.5px/1 var(--font-manrope)",
        padding: "8px 15px",
        borderRadius: 8,
      }}
    >
      {children}
    </button>
  );
}

function Legend({ status }: { status: keyof typeof VISUAL_STATUS }) {
  const { t } = useLanguage();
  const s = VISUAL_STATUS[status];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: "var(--text-2)" }}>
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          background: s.hatched ? `repeating-linear-gradient(45deg, ${s.bg}, ${s.bg} 3px, #e6e6ea 3px, #e6e6ea 6px)` : s.bg,
          border: `1.5px solid ${s.border}`,
        }}
      />
      {t(s.labelKey)}
    </div>
  );
}

function TableView({
  spaces,
  onSelect,
}: {
  spaces: (LayoutSpace & { carPosition: number })[];
  onSelect: (s: LayoutSpace) => void;
}) {
  const { t, td } = useLanguage();
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 960 }}>
        <div style={theadStyle}>
          <span>{t("trainDetail.tableNo")}</span>
          <span>{t("trainDetail.tableCar")}</span>
          <span>{t("trainDetail.tableLocation")}</span>
          <span>{t("trainDetail.tableStatus")}</span>
          <span>{t("trainDetail.tableFirm")}</span>
          <span>{t("trainDetail.tableArea")}</span>
          <span>{t("trainDetail.tableContract")}</span>
          <span>{t("trainDetail.tableTerm")}</span>
          <span></span>
        </div>
        {spaces.map((s, i) => (
          <div key={s.id} style={{ ...rowStyle, background: i % 2 === 0 ? "#fff" : "#fcfdfe" }}>
            <span style={{ font: "800 13px/1 var(--font-jetbrains-mono), monospace", color: "var(--navy)" }}>{s.code.split("/").pop()}</span>
            <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>{t("trainDetail.carPrefix", { position: s.carPosition })}</span>
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                {s.side === "left" ? t("trainDetail.sideLeft") : t("trainDetail.sideRight")} · {s.position}
              </span>
              <span style={{ fontSize: 11.5, color: "#8494a5" }}>{td(s.ad_type.name)}</span>
            </span>
            <Badge style={VISUAL_STATUS[s.visual]} small />
            <span style={{ fontSize: 13, color: "var(--text-2)" }}>{s.booking ? td(s.booking.ad_name) : "—"}</span>
            <span style={{ font: "500 12.5px/1 var(--font-jetbrains-mono), monospace", color: "var(--text-2)" }}>{s.area_m2} m²</span>
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ font: "600 12px/1 var(--font-jetbrains-mono), monospace" }}>{s.booking?.contract.number ?? "—"}</span>
              <span style={{ fontSize: 11.5, color: "#8494a5" }}>{s.booking ? money(s.booking.price) : "—"}</span>
            </span>
            <span style={{ fontSize: 12, color: "var(--text-2)" }}>
              {s.booking ? `${formatDate(s.booking.start_date)} – ${formatDate(s.booking.end_date)}` : "—"}
            </span>
            <button
              onClick={() => onSelect(s)}
              style={{ border: "1px solid var(--border)", background: "#fff", color: "var(--navy)", fontSize: 12.5, fontWeight: 700, padding: "7px 13px", borderRadius: 9 }}
            >
              {t("trainDetail.open")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const theadStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "56px 74px 1.5fr 1.1fr 1.3fr .8fr 1.1fr 1fr auto",
  gap: 14,
  padding: "13px 22px",
  background: "#f8fafc",
  borderBottom: "1px solid var(--border)",
  font: "700 10.5px/1 var(--font-jetbrains-mono), monospace",
  color: "var(--text-faint)",
  letterSpacing: ".08em",
};

const rowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "56px 74px 1.5fr 1.1fr 1.3fr .8fr 1.1fr 1fr auto",
  gap: 14,
  padding: "12px 22px",
  borderBottom: "1px solid var(--border-soft)",
  alignItems: "center",
};
