"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiRequestError } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { money } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

const FIELD_LABEL = "font-mono text-[10.5px] tracking-wider text-muted-foreground";

export function BulkBookingModal({
  open,
  onOpenChange,
  contractId,
  contractStartDate,
  contractEndDate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contractId: number;
  contractStartDate: string;
  contractEndDate: string;
}) {
  const { t, td } = useLanguage();
  const queryClient = useQueryClient();

  const { data: depots } = useQuery({ queryKey: ["depots"], queryFn: () => api.depots.list() });
  const { data: trains } = useQuery({ queryKey: ["trains-all"], queryFn: () => api.trains.list() });
  const { data: adTypes } = useQuery({ queryKey: ["ad-types"], queryFn: () => api.adTypes.list() });

  const [startDate, setStartDate] = useState(contractStartDate);
  const [endDate, setEndDate] = useState(contractEndDate);
  const [depot, setDepot] = useState<number | "">("");
  const [train, setTrain] = useState<number | "">("");
  const [adType, setAdType] = useState<number | "">("");
  const [adName, setAdName] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const { data: freeResult, isFetching, refetch } = useQuery({
    queryKey: ["free-spaces", startDate, endDate, depot, train, adType],
    queryFn: () =>
      api.spaces.free({
        start_date: startDate,
        end_date: endDate,
        depot: depot || undefined,
        train: train || undefined,
        ad_type: adType || undefined,
      }),
    enabled: false,
  });

  function search() {
    setSearched(true);
    setSelected(new Set());
    refetch();
  }

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function reset() {
    setStartDate(contractStartDate);
    setEndDate(contractEndDate);
    setDepot("");
    setTrain("");
    setAdType("");
    setAdName("");
    setSelected(new Set());
    setError(null);
    setSearched(false);
  }

  const mutation = useMutation({
    mutationFn: () => {
      if (!adName || selected.size === 0) throw new Error(t("bulkBooking.validationError"));
      const spaces = freeResult?.results.filter((s) => selected.has(s.id)) ?? [];
      return api.bookings.bulk({
        contract: contractId,
        items: spaces.map((s) => ({
          ad_space: s.id,
          ad_name: adName,
          start_date: startDate,
          end_date: endDate,
        })),
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["contract-bookings", contractId] });
      queryClient.invalidateQueries({ queryKey: ["contract", contractId] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success(t("bulkBooking.success", { count: result.created }));
      reset();
      onOpenChange(false);
    },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : t("bulkBooking.failed")),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("bulkBooking.title")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className={FIELD_LABEL}>{t("bulkBooking.fieldAdName")}</Label>
            <Input value={adName} onChange={(e) => setAdName(e.target.value)} placeholder={t("spacePanel.adNamePlaceholder")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("bulkBooking.fieldStartDate")}</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("bulkBooking.fieldEndDate")}</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <Label className={FIELD_LABEL}>{t("bulkBooking.filters")}</Label>
            <div className="grid grid-cols-3 gap-3">
              <Select value={depot ? String(depot) : ""} onValueChange={(v) => setDepot(v ? Number(v) : "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("freeSpaces.fieldDepot")} />
                </SelectTrigger>
                <SelectContent>
                  {depots?.results.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={train ? String(train) : ""} onValueChange={(v) => setTrain(v ? Number(v) : "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("freeSpaces.fieldTrain")} />
                </SelectTrigger>
                <SelectContent>
                  {trains?.results
                    .filter((tr) => !depot || tr.depot_detail.id === depot)
                    .map((tr) => (
                      <SelectItem key={tr.id} value={String(tr.id)}>
                        {tr.number}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select value={adType ? String(adType) : ""} onValueChange={(v) => setAdType(v ? Number(v) : "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("freeSpaces.fieldAdType")} />
                </SelectTrigger>
                <SelectContent>
                  {adTypes?.results.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {td(a.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={search} disabled={isFetching || !startDate || !endDate} className="mt-1 w-fit">
              {isFetching ? t("common.loading") : t("freeSpaces.search")}
            </Button>
          </div>

          {searched && (
            <div className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-lg border border-border">
              {freeResult?.results.length ? (
                <>
                  <div className="sticky top-0 border-b border-border bg-[#f8fafc] px-3 py-2 font-mono text-[11px] font-bold text-muted-foreground">
                    {t("bulkBooking.selected", { count: selected.size })}
                  </div>
                  {freeResult.results.map((s) => (
                    <label
                      key={s.id}
                      className="flex cursor-pointer items-center justify-between gap-3 border-b border-border px-3 py-2 text-[12.5px] last:border-b-0 hover:bg-[#fbfcfd]"
                    >
                      <span className="flex items-center gap-2.5">
                        <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
                        <span className="font-mono font-bold">{s.code}</span>
                        <span className="text-muted-foreground">{td(s.ad_type.name)}</span>
                      </span>
                      <span className="font-mono text-muted-foreground">{money(s.base_price)}</span>
                    </label>
                  ))}
                </>
              ) : (
                <div className="p-4 text-[13px] text-muted-foreground">{t("bulkBooking.noResults")}</div>
              )}
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !adName || selected.size === 0}
            className="bg-[var(--navy)] hover:bg-[var(--navy-active)]"
          >
            {mutation.isPending ? t("common.creating") : t("bulkBooking.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
