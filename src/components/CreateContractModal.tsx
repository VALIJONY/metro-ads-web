"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

const FIELD_LABEL = "font-mono text-[10.5px] tracking-wider text-muted-foreground";

export function CreateContractModal({
  open,
  onOpenChange,
  fixedClientId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fixedClientId?: number;
}) {
  const { t, td } = useLanguage();
  const queryClient = useQueryClient();
  const { data: clients } = useQuery({ queryKey: ["clients"], queryFn: () => api.clients.list() });

  const [client, setClient] = useState<number | undefined>(fixedClientId);
  const [number, setNumber] = useState("");
  const [date, setDate] = useState(isoToday());
  const [startDate, setStartDate] = useState(isoToday());
  const [endDate, setEndDate] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setClient(fixedClientId);
    setNumber("");
    setDate(isoToday());
    setStartDate(isoToday());
    setEndDate("");
    setAmount("");
    setError(null);
  }

  const mutation = useMutation({
    mutationFn: () => {
      if (!client || !number || !endDate || !amount) throw new Error(t("createSpace.validationError"));
      return api.contracts.create({
        client,
        number,
        date,
        start_date: startDate,
        end_date: endDate,
        amount,
        currency: "UZS",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["client-contracts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(t("contracts.createTitle"));
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
          <DialogTitle>{t("contracts.createTitle")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("contracts.fieldClient")}</Label>
              <Select
                value={client ? String(client) : ""}
                onValueChange={(v) => setClient(Number(v))}
                disabled={!!fixedClientId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("common.select")} />
                </SelectTrigger>
                <SelectContent>
                  {clients?.results.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {td(c.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("contracts.fieldNumber")}</Label>
              <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="SH-2026-001" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("contracts.fieldDate")}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("contracts.fieldStartDate")}</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("contracts.fieldEndDate")}</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className={FIELD_LABEL}>{t("contracts.fieldAmount")}</Label>
            <Input
              value={formatThousands(amount)}
              onChange={(e) => setAmount(unformatThousands(e.target.value))}
              inputMode="numeric"
              className="font-mono"
              placeholder="22 400 000"
            />
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
            disabled={mutation.isPending || !client || !number || !endDate || !amount}
            className="bg-[var(--navy)] hover:bg-[var(--navy-active)]"
          >
            {mutation.isPending ? t("common.creating") : t("common.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
