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
import type { Client } from "@/lib/types";

const FIELD_LABEL = "font-mono text-[10.5px] tracking-wider text-muted-foreground";

export function CreateClientModal({
  open,
  onOpenChange,
  client,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  client?: Client | null;
}) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const isEdit = !!client;

  const [name, setName] = useState(client?.name ?? "");
  const [tin, setTin] = useState(client?.tin ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [address, setAddress] = useState(client?.address ?? "");
  const [contactPerson, setContactPerson] = useState(client?.contact_person ?? "");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName(client?.name ?? "");
    setTin(client?.tin ?? "");
    setPhone(client?.phone ?? "");
    setEmail(client?.email ?? "");
    setAddress(client?.address ?? "");
    setContactPerson(client?.contact_person ?? "");
    setError(null);
  }

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        name,
        tin: tin || undefined,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
        contact_person: contactPerson || undefined,
      };
      return isEdit ? api.clients.update(client!.id, body) : api.clients.create(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", client?.id] });
      toast.success(isEdit ? t("clients.editTitle") : t("clients.createTitle"));
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
          <DialogTitle>{isEdit ? t("clients.editTitle") : t("clients.createTitle")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className={FIELD_LABEL}>{t("clients.fieldName")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Uzum Market" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("clients.fieldTin")}</Label>
              <Input value={tin ?? ""} onChange={(e) => setTin(e.target.value)} placeholder="301234567" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("clients.fieldPhone")}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998901234567" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("clients.fieldEmail")}</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("clients.fieldContactPerson")}</Label>
              <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className={FIELD_LABEL}>{t("clients.fieldAddress")}</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
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
