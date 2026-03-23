"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Settings, Bell, Globe } from "lucide-react";
import { useSettingsStore } from "@/store/settingsStore";
import { useNewsStore } from "@/store/newsStore";
import { usePaidSitesStore } from "@/store/paidSitesStore";
import { useCompaniesStore } from "@/store/companiesStore";
import { LOCALE_LABELS } from "@/lib/constants";
import Badge from "@/components/ui/Badge";
import type { Locale } from "@/lib/types";

export default function Header() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useSettingsStore((s) => s.locale);
  const region = useSettingsStore((s) => s.region);
  const setLocale = useSettingsStore((s) => s.setLocale);

  const newsUnread = useNewsStore((s) => s.getUnreadCount(region));
  const paidUnread = usePaidSitesStore((s) => s.getUnreadCount());
  const companyUnread = useCompaniesStore((s) => s.getUnreadCount());
  const totalUnread = newsUnread + paidUnread + companyUnread;

  const switchLocale = (newLocale: string) => {
    setLocale(newLocale as Locale);
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  const goToSettings = () => {
    router.push(`/${locale}/settings`);
  };

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-border">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-primary">{t("app.title")}</h1>
          <span className="hidden sm:inline text-xs text-text-secondary">
            {t("app.subtitle")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="flex items-center gap-1">
              <Globe size={16} className="text-text-secondary" />
              <select
                value={locale}
                onChange={(e) => switchLocale(e.target.value)}
                className="text-sm bg-transparent border-none focus:outline-none cursor-pointer text-text-secondary pr-1"
              >
                {Object.entries(LOCALE_LABELS).map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button className="relative p-2 rounded-lg hover:bg-surface-bright transition-colors">
            <Bell size={20} className="text-text-secondary" />
            {totalUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5">
                <Badge count={totalUnread} />
              </span>
            )}
          </button>
          <button
            onClick={goToSettings}
            className="p-2 rounded-lg hover:bg-surface-bright transition-colors"
          >
            <Settings size={20} className="text-text-secondary" />
          </button>
        </div>
      </div>
    </header>
  );
}
