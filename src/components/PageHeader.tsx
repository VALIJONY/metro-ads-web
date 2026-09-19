"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, KeyRound, LogOut, UserRound } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Crumb {
  label: string;
  href?: string;
}

export function PageHeader({ crumbs, actions }: { crumbs: Crumb[]; actions?: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const initials = user
    ? (user.first_name?.[0] ?? user.username[0]).toUpperCase() + (user.last_name?.[0] ?? "").toUpperCase()
    : "?";
  const displayName = user ? `${user.first_name || user.username} ${user.last_name}`.trim() : "";
  const roleLabel = user ? t(`role.${user.role}`) : "";

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-6 border-b border-border bg-background/90 px-8 py-4 backdrop-blur-sm">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-border" />}
              {c.href && !isLast ? (
                <Link href={c.href} className="font-semibold text-muted-foreground hover:text-foreground">
                  {c.label}
                </Link>
              ) : (
                <span className="font-extrabold whitespace-nowrap text-foreground">{c.label}</span>
              )}
            </span>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        {actions}

        <LanguageSwitcher />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg border-l border-border py-1 pl-3.5 outline-none">
            <Avatar className="h-[34px] w-[34px]">
              <AvatarFallback className="bg-[#dbe6ef] text-xs font-extrabold text-[var(--navy)]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden flex-col items-start sm:flex">
              <span className="text-[12.5px] font-bold text-foreground">{displayName}</span>
              <span className="text-[11px] text-muted-foreground">{roleLabel}</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5 font-semibold">
                  <UserRound className="h-3.5 w-3.5" /> {displayName}
                </span>
                <span className="font-normal text-muted-foreground">{roleLabel}</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setChangePasswordOpen(true)}>
              <KeyRound />
              {t("changePassword.menuItem")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => logout()}>
              <LogOut />
              {t("header.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ChangePasswordModal open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
    </header>
  );
}
