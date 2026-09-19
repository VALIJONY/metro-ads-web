"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Warehouse,
  TrainFront,
  FileSignature,
  BarChart3,
  Users,
  Search,
  Tag,
  UserCog,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const NAV = [
  { href: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/depots", labelKey: "nav.depots", icon: Warehouse },
  { href: "/trains", labelKey: "nav.trains", icon: TrainFront },
  { href: "/free-spaces", labelKey: "nav.freeSpaces", icon: Search },
  { href: "/clients", labelKey: "nav.clients", icon: Users },
  { href: "/contracts", labelKey: "nav.contracts", icon: FileSignature },
  { href: "/reports", labelKey: "nav.reports", icon: BarChart3 },
];

const ADMIN_NAV = [
  { href: "/ad-types", labelKey: "nav.adTypes", icon: Tag },
  { href: "/users", labelKey: "nav.users", icon: UserCog },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["dashboard-stats-sidebar"],
    queryFn: () => api.reports.dashboard(),
    staleTime: 60_000,
  });
  const items = user?.role === "admin" ? [...NAV, ...ADMIN_NAV] : NAV;

  return (
    <aside className="sticky top-0 flex h-screen w-[252px] shrink-0 flex-col gap-6 bg-[var(--sidebar)] px-4 py-[22px] pb-7 text-[var(--sidebar-foreground)]">
      <div className="flex items-center gap-2.5 px-1.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[var(--coral)] text-[15px] font-extrabold text-white">
          M
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="text-sm font-extrabold tracking-tight">{t("nav.brandName")}</div>
          <div className="font-mono text-[10px] tracking-[.08em] text-[#7f9cb5]">{t("nav.brandSub")}</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {items.map((n) => {
          const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "flex items-center gap-2.5 rounded-[11px] px-3.5 py-2.5 text-[13.5px] transition-colors",
                active
                  ? "bg-[var(--sidebar-primary)] font-extrabold text-white"
                  : "font-semibold text-[#a9c3d6] hover:bg-[var(--sidebar-accent)] hover:text-white"
              )}
            >
              <Icon className="h-[15px] w-[15px] shrink-0" strokeWidth={2.25} />
              <span>{t(n.labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2.5 rounded-[14px] bg-[var(--sidebar-accent)] p-[15px_16px]">
        <div className="font-mono text-[10px] tracking-[.1em] text-[#8fb0c9]">{t("nav.expiringSoon")}</div>
        <div className="text-[26px] font-extrabold text-[#ffc94d]">
          {data ? data.contracts.ending_soon : "—"}
        </div>
        <div className="text-xs leading-relaxed text-[#a9c3d6]">{t("nav.expiringSoonNote")}</div>
      </div>
    </aside>
  );
}
