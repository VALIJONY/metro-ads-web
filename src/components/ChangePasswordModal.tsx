"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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

export function ChangePasswordModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t } = useLanguage();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setOldPassword("");
    setNewPassword("");
    setError(null);
  }

  const mutation = useMutation({
    mutationFn: () => api.changePassword(oldPassword, newPassword),
    onSuccess: () => {
      toast.success(t("changePassword.success"));
      reset();
      onOpenChange(false);
    },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : t("changePassword.failed")),
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
          <DialogTitle>{t("changePassword.title")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="font-mono text-[10.5px] tracking-wider text-muted-foreground">{t("changePassword.fieldOld")}</Label>
            <Input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="font-mono text-[10.5px] tracking-wider text-muted-foreground">{t("changePassword.fieldNew")}</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
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
            disabled={mutation.isPending || !oldPassword || !newPassword}
            className="bg-[var(--navy)] hover:bg-[var(--navy-active)]"
          >
            {mutation.isPending ? t("common.saving") : t("changePassword.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
