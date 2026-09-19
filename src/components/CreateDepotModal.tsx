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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Depot } from "@/lib/types";

export function CreateDepotModal({
  open,
  onOpenChange,
  depot,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  depot?: Depot | null;
}) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const isEdit = !!depot;
  const [code, setCode] = useState(depot?.code ?? "");
  const [name, setName] = useState(depot?.name ?? "");
  const [address, setAddress] = useState(depot?.address ?? "");
  const [note, setNote] = useState(depot?.note ?? "");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      isEdit
        ? api.depots.update(depot!.id, { code, name, address, note })
        : api.depots.create({ code, name, address, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["depots"] });
      toast.success(isEdit ? t("depots.editTitle") : t("depots.createTitle"));
      onOpenChange(false);
    },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : t("common.error.generic")),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setCode(depot?.code ?? "");
          setName(depot?.name ?? "");
          setAddress(depot?.address ?? "");
          setNote(depot?.note ?? "");
          setError(null);
        }
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("depots.editTitle") : t("depots.createTitle")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="font-mono text-[10.5px] tracking-wider text-muted-foreground">
                {t("depots.code")}
              </Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Tch-3" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="font-mono text-[10.5px] tracking-wider text-muted-foreground">
                {t("depots.name")}
              </Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="3-elektrodepo" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="font-mono text-[10.5px] tracking-wider text-muted-foreground">
              {t("depots.address")}
            </Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="font-mono text-[10.5px] tracking-wider text-muted-foreground">
              {t("depots.note")}
            </Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
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
            disabled={mutation.isPending || !code || !name}
            className="bg-[var(--navy)] hover:bg-[var(--navy-active)]"
          >
            {mutation.isPending ? t("common.saving") : isEdit ? t("common.save") : t("common.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
