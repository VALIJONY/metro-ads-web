"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

const FIELD_LABEL = "font-mono text-[10.5px] tracking-wider text-muted-foreground";

export function AddCarModal({
  open,
  onOpenChange,
  trainId,
  nextPosition,
  invalidateKey,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  trainId: number;
  nextPosition: number;
  invalidateKey: unknown[];
}) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [position, setPosition] = useState(String(nextPosition));
  const [serialNumber, setSerialNumber] = useState("");
  const [type, setType] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setPosition(String(nextPosition));
    setSerialNumber("");
    setType("");
    setError(null);
  }

  const mutation = useMutation({
    mutationFn: () => {
      const pos = Number(position);
      if (!pos || pos < 1) throw new Error(t("createSpace.validationError"));
      return api.trains.addCar(trainId, { position: pos, serial_number: serialNumber || undefined, type: type || undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateKey });
      queryClient.invalidateQueries({ queryKey: ["trains-all"] });
      toast.success(t("trains.addCarTitle"));
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
          <DialogTitle>{t("trains.addCarTitle")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className={FIELD_LABEL}>{t("trains.fieldPosition")}</Label>
            <Input value={position} onChange={(e) => setPosition(e.target.value)} inputMode="numeric" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("trains.fieldSerialNumber")}</Label>
              <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("trains.fieldCarType")}</Label>
              <Input value={type} onChange={(e) => setType(e.target.value)} />
            </div>
          </div>

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
            disabled={mutation.isPending || !position}
            className="bg-[var(--navy)] hover:bg-[var(--navy-active)]"
          >
            {mutation.isPending ? t("common.creating") : t("common.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
