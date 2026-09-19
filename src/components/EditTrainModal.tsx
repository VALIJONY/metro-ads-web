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
import type { Train, TrainStatus } from "@/lib/types";

const FIELD_LABEL = "font-mono text-[10.5px] tracking-wider text-muted-foreground";

export function EditTrainModal({
  open,
  onOpenChange,
  train,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  train: Train | null;
}) {
  const { t, td } = useLanguage();
  const queryClient = useQueryClient();
  const { data: depots } = useQuery({ queryKey: ["depots"], queryFn: () => api.depots.list(), enabled: open });

  const [depot, setDepot] = useState(train?.depot ?? 0);
  const [number, setNumber] = useState(train?.number ?? "");
  const [status, setStatus] = useState<TrainStatus>(train?.status ?? "new");
  const [line, setLine] = useState(train?.line ?? "");
  const [isActive, setIsActive] = useState(train?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);

  function sync(t: Train | null) {
    setDepot(t?.depot ?? 0);
    setNumber(t?.number ?? "");
    setStatus(t?.status ?? "new");
    setLine(t?.line ?? "");
    setIsActive(t?.is_active ?? true);
    setError(null);
  }

  const mutation = useMutation({
    mutationFn: () =>
      api.trains.update(train!.id, { depot, number, status, line, is_active: isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trains-all"] });
      queryClient.invalidateQueries({ queryKey: ["train-layout", train?.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(t("trains.editTitle"));
      onOpenChange(false);
    },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : t("common.error.generic")),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) sync(train);
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("trains.editTitle")}</DialogTitle>
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
              <Input value={number} onChange={(e) => setNumber(e.target.value)} />
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
              <Input value={line} onChange={(e) => setLine(e.target.value)} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-[13px] font-semibold">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            {t("trains.fieldIsActive")}
          </label>

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
            disabled={mutation.isPending || !depot || !number}
            className="bg-[var(--navy)] hover:bg-[var(--navy-active)]"
          >
            {mutation.isPending ? t("common.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
