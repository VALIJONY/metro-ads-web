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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Role, User } from "@/lib/types";

const FIELD_LABEL = "font-mono text-[10.5px] tracking-wider text-muted-foreground";
const ROLES = ["admin", "manager", "operator", "viewer"] as const;

export function CreateUserModal({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user?: User | null;
}) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const isEdit = !!user;

  const [username, setUsername] = useState(user?.username ?? "");
  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [role, setRole] = useState<Role>(user?.role ?? "operator");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setUsername(user?.username ?? "");
    setFirstName(user?.first_name ?? "");
    setLastName(user?.last_name ?? "");
    setEmail(user?.email ?? "");
    setPhone(user?.phone ?? "");
    setRole(user?.role ?? "operator");
    setPassword("");
    setError(null);
  }

  const mutation = useMutation({
    mutationFn: () =>
      isEdit
        ? api.users.update(user!.id, { first_name: firstName, last_name: lastName, email, phone, role })
        : api.users.create({ username, first_name: firstName, last_name: lastName, email, phone, role, password: password || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(isEdit ? t("users.editTitle") : t("users.createTitle"));
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
          <DialogTitle>{isEdit ? t("users.editTitle") : t("users.createTitle")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("users.fieldUsername")}</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} disabled={isEdit} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("users.fieldRole")}</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{t(`role.${role}`)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {t(`role.${r}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("users.fieldFirstName")}</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("users.fieldLastName")}</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("users.fieldEmail")}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("users.fieldPhone")}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998901234567" />
            </div>
          </div>

          {!isEdit && (
            <div className="flex flex-col gap-1.5">
              <Label className={FIELD_LABEL}>{t("users.fieldPassword")}</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <p className="text-xs leading-relaxed text-muted-foreground">{t("users.passwordHint")}</p>
            </div>
          )}

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
            disabled={mutation.isPending || !username || !role}
            className="bg-[var(--navy)] hover:bg-[var(--navy-active)]"
          >
            {mutation.isPending ? t("common.saving") : isEdit ? t("common.save") : t("common.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
