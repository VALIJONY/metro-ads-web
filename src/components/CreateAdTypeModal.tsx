"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiRequestError } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatThousands, unformatThousands } from "@/lib/format";
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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { AdType } from "@/lib/types";

const FIELD_LABEL = "font-mono text-[10.5px] tracking-wider text-muted-foreground";

export function CreateAdTypeModal({
  open,
  onOpenChange,
  adType,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  adType?: AdType | null;
}) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const isEdit = !!adType;

  const [name, setName] = useState(adType?.name ?? "");
  const [unit, setUnit] = useState(adType?.unit ?? "piece");
  const [sizeType, setSizeType] = useState<"area" | "complex">(adType?.size_type ?? "area");
  const [defaultBasePrice, setDefaultBasePrice] = useState(adType?.default_base_price ?? "0");
  const [note, setNote] = useState(adType?.note ?? "");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName(adType?.name ?? "");
    setUnit(adType?.unit ?? "piece");
    setSizeType(adType?.size_type ?? "area");
    setDefaultBasePrice(adType?.default_base_price ?? "0");
    setNote(adType?.note ?? "");
    setError(null);
  }

  const mutation = useMutation({
    mutationFn: () =>
      isEdit
        ? api.adTypes.update(adType!.id, { name, unit, size_type: sizeType, default_base_price: defaultBasePrice, note })
        : api.adTypes.create({ name, unit, size_type: sizeType, default_base_price: defaultBasePrice, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-types"] });
      toast.success(isEdit ? t("adTypes.editTitle") : t("adTypes.createTitle"));
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
          <DialogTitle>{isEdit ? t("adTypes.editTitle") : t("adTypes.createTitle")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className={FIELD_LABEL}>{t("adTypes.fieldName")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Stiker" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("adTypes.fieldUnit")}</Label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="dona" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("adTypes.fieldSizeType")}</Label>
              <Select value={sizeType} onValueChange={(v) => setSizeType(v as "area" | "complex")}>
                <SelectTrigger className="w-full">
                  <SelectValue>{sizeType === "area" ? t("adTypes.sizeTypeArea") : t("adTypes.sizeTypeComplex")}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="area">{t("adTypes.sizeTypeArea")}</SelectItem>
                  <SelectItem value="complex">{t("adTypes.sizeTypeComplex")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className={FIELD_LABEL}>{t("adTypes.fieldDefaultPrice")}</Label>
            <Input
              value={formatThousands(defaultBasePrice)}
              onChange={(e) => setDefaultBasePrice(unformatThousands(e.target.value))}
              inputMode="numeric"
              className="font-mono"
              placeholder="1 500 000"
            />
            <p className="text-xs leading-relaxed text-muted-foreground">{t("adTypes.defaultPriceHint")}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className={FIELD_LABEL}>{t("adTypes.fieldNote")}</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
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
            disabled={mutation.isPending || !name}
            className="bg-[var(--navy)] hover:bg-[var(--navy-active)]"
          >
            {mutation.isPending ? t("common.saving") : isEdit ? t("common.save") : t("common.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
