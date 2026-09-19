"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, ApiRequestError } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { User } from "@/lib/types";

export function ResetPasswordDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: User | null;
}) {
  const { t } = useLanguage();
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => api.users.resetPassword(user!.id, newPassword || undefined),
    onSuccess: (result) => setGenerated(result.new_password),
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : t("common.error.generic")),
  });

  function close(v: boolean) {
    if (!v) {
      setNewPassword("");
      setError(null);
      setGenerated(null);
    }
    onOpenChange(v);
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("users.resetPasswordTitle")}</DialogTitle>
          <DialogDescription>{t("users.resetPasswordDesc")}</DialogDescription>
        </DialogHeader>

        {generated ? (
          <Alert>
            <AlertDescription className="flex flex-col gap-1.5">
              <span className="font-mono text-sm font-bold">{t("users.newPasswordGenerated", { password: generated })}</span>
              <span className="text-xs text-muted-foreground">{t("users.newPasswordCopyHint")}</span>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="font-mono text-[10.5px] tracking-wider text-muted-foreground">{t("users.newPassword")}</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          {generated ? (
            <Button onClick={() => close(false)} className="bg-[var(--navy)] hover:bg-[var(--navy-active)]">
              {t("common.close")}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => close(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="bg-[var(--navy)] hover:bg-[var(--navy-active)]">
                {mutation.isPending ? t("common.saving") : t("users.resetPassword")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
