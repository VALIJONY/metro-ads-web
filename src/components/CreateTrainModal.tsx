"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiRequestError } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/LanguageContext";
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
import type { TrainStatus } from "@/lib/types";

const FIELD_LABEL = "font-mono text-[10.5px] tracking-wider text-muted-foreground";

export function CreateTrainModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t, td } = useLanguage();
  const queryClient = useQueryClient();
  const { data: depots } = useQuery({ queryKey: ["depots"], queryFn: () => api.depots.list() });
  const { data: adTypes } = useQuery({ queryKey: ["ad-types"], queryFn: () => api.adTypes.list() });

  const [depot, setDepot] = useState<number | undefined>(undefined);
  const [number, setNumber] = useState("");
  const [status, setStatus] = useState<TrainStatus>("new");
  const [line, setLine] = useState("");
  const [adType, setAdType] = useState<number | undefined>(undefined);
  const [carCount, setCarCount] = useState("4");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setDepot(undefined);
    setNumber("");
    setStatus("new");
    setLine("");
    setAdType(undefined);
    setCarCount("4");
    setError(null);
  }

  const mutation = useMutation({
    mutationFn: () => {
      if (!depot || !number || !adType) throw new Error(t("createSpace.validationError"));
      return api.trains.create({
        depot,
        number,
        status,
        line,
        default_ad_type: adType,
        car_count: Number(carCount) || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trains-all"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(t("trains.createTitle"));
      reset();
      onOpenChange(false);
    },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : t("common.error.generic")),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("trains.createTitle")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("trains.fieldDepot")}</Label>
              <Select value={depot ? String(depot) : ""} onValueChange={(v) => setDepot(Number(v))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("common.select")} />
                </SelectTrigger>
                <SelectContent>
                  {depots?.results.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.code} — {td(d.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("trains.fieldNumber")}</Label>
              <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="04-1123" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("trains.fieldStatus")}</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TrainStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{status === "new" ? t("trains.statusNew") : t("trains.statusOld")}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">{t("trains.statusNew")}</SelectItem>
                  <SelectItem value="old">{t("trains.statusOld")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("trains.fieldLine")}</Label>
              <Input value={line} onChange={(e) => setLine(e.target.value)} placeholder="Chilonzor" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("trains.fieldAdType")}</Label>
              <Select value={adType ? String(adType) : ""} onValueChange={(v) => setAdType(Number(v))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("common.select")} />
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
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("trains.fieldCarCount")}</Label>
              <Input value={carCount} onChange={(e) => setCarCount(e.target.value)} inputMode="numeric" />
            </div>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">{t("trains.layoutHint")}</p>

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
            disabled={mutation.isPending || !depot || !number || !adType}
            className="bg-[var(--navy)] hover:bg-[var(--navy-active)]"
          >
            {mutation.isPending ? t("common.creating") : t("common.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
