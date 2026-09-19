import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { QueryProvider } from "@/lib/QueryProvider";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Metro Reklama",
  description: "Toshkent Metropoliten reklama joylarini boshqarish tizimi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={cn(jetbrainsMono.variable)} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <QueryProvider>
          <LanguageProvider>
            <AuthProvider>{children}</AuthProvider>
            <Toaster position="top-right" />
          </LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
