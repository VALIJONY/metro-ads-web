"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TrainFront, TicketPercent, MapPinned, TriangleAlert } from "lucide-react";
import { useAuth, isApiError } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      router.replace("/");
    } catch (err) {
      setError(isApiError(err) ? err.message : t("login.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brend paneli */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[var(--navy)] p-10 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--coral)" }}
        />

        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-[var(--coral)] font-extrabold text-white">
            M
          </div>
          <div>
            <div className="text-[15px] font-extrabold">{t("nav.brandName")}</div>
            <div className="font-mono text-[10px] tracking-[.08em] text-[#7f9cb5]">{t("nav.brandSub")}</div>
          </div>
        </div>

        <div className="relative flex flex-col gap-8">
          <h1 className="max-w-md text-3xl leading-tight font-extrabold text-balance">
            {t("login.heroTitle")}
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-[#a9c3d6]">{t("login.heroText")}</p>
          <div className="flex flex-col gap-4">
            <Feature icon={TrainFront} text={t("login.feature1")} />
            <Feature icon={MapPinned} text={t("login.feature2")} />
            <Feature icon={TicketPercent} text={t("login.feature3")} />
          </div>
        </div>

        <div className="relative font-mono text-[11px] text-[#5c7893]">
          {t("login.footer", { year: new Date().getFullYear() })}
        </div>
      </div>

      {/* Login formasi */}
      <div className="flex items-center justify-center bg-background p-6">
        <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-6">
          <div className="flex items-center justify-between gap-2 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-[var(--coral)] font-extrabold text-white">
                M
              </div>
              <div>
                <div className="text-[15px] font-extrabold text-foreground">{t("nav.brandName")}</div>
                <div className="font-mono text-[10px] tracking-[.08em] text-muted-foreground">
                  {t("nav.brandSub")}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col gap-1.5">
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground">{t("login.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("login.subtitle")}</p>
            </div>
            <LanguageSwitcher />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">{t("login.username")}</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                autoComplete="username"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">{t("login.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <TriangleAlert />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={submitting} className="h-11 bg-[var(--navy)] hover:bg-[var(--navy-active)]">
            {submitting ? t("login.submitting") : t("login.submit")}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-[#dfe9f2]">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
        <Icon className="h-4 w-4" />
      </span>
      {text}
    </div>
  );
}
