"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiRequestError } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatThousands, isoToday, unformatThousands } from "@/lib/format";
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
import type { PaymentType } from "@/lib/types";

const FIELD_LABEL = "font-mono text-[10.5px] tracking-wider text-muted-foreground";

export function CreatePaymentModal({
  open,
  onOpenChange,
  contractId,
  contractLabel,
  defaultAmount,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contractId: number;
  contractLabel?: string;
  defaultAmount?: string;
}) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const initialAmount = () => (defaultAmount ? defaultAmount.split(".")[0] : "");

  const [amount, setAmount] = useState(initialAmount);
  const [date, setDate] = useState(isoToday());
  const [type, setType] = useState<PaymentType>("transfer");
  const [docNumber, setDocNumber] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setAmount(initialAmount());
    setDate(isoToday());
    setType("transfer");
    setDocNumber("");
    setNote("");
    setError(null);
  }

  const mutation = useMutation({
    mutationFn: () => {
      if (!amount || !date) throw new Error(t("createSpace.validationError"));
      return api.payments.create({
        contract: contractId,
        amount,
        payment_date: date,
        payment_type: type,
        document_number: docNumber || undefined,
        note: note || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", contractId] });
      queryClient.invalidateQueries({ queryKey: ["contract", contractId] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["reports-debt"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(t("payments.createTitle"));
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
          <DialogTitle>
            {contractLabel ? t("payments.createTitleFor", { number: contractLabel }) : t("payments.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("payments.fieldAmount")}</Label>
              <Input
                value={formatThousands(amount)}
                onChange={(e) => setAmount(unformatThousands(e.target.value))}
                inputMode="numeric"
                className="font-mono"
                placeholder="5 000 000"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("payments.fieldDate")}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("payments.fieldType")}</Label>
              <Select value={type} onValueChange={(v) => setType(v as PaymentType)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{t(`paymentType.${type}`)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer">{t("paymentType.transfer")}</SelectItem>
                  <SelectItem value="cash">{t("paymentType.cash")}</SelectItem>
                  <SelectItem value="other">{t("paymentType.other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("payments.fieldDocNumber")}</Label>
              <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className={FIELD_LABEL}>{t("payments.fieldNote")}</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
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
            disabled={mutation.isPending || !amount || !date}
            className="bg-[var(--navy)] hover:bg-[var(--navy-active)]"
          >
            {mutation.isPending ? t("common.creating") : t("common.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
