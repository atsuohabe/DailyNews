"use client";

import { useTranslations } from "next-intl";
import { Newspaper, CreditCard, Building2 } from "lucide-react";
import { type TabId } from "@/lib/types";
import { useNewsStore } from "@/store/newsStore";
import { usePaidSitesStore } from "@/store/paidSitesStore";
import { useCompaniesStore } from "@/store/companiesStore";
import { useSettingsStore } from "@/store/settingsStore";
import Badge from "@/components/ui/Badge";

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; icon: typeof Newspaper; labelKey: string }[] = [
  { id: "general", icon: Newspaper, labelKey: "tabs.general" },
  { id: "paid", icon: CreditCard, labelKey: "tabs.paid" },
  { id: "companies", icon: Building2, labelKey: "tabs.companies" },
];

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const t = useTranslations();
  const region = useSettingsStore((s) => s.region);
  const newsUnread = useNewsStore((s) => s.getUnreadCount(region));
  const paidUnread = usePaidSitesStore((s) => s.getUnreadCount());
  const companyUnread = useCompaniesStore((s) => s.getUnreadCount());

  const unreadCounts: Record<TabId, number> = {
    general: newsUnread,
    paid: paidUnread,
    companies: companyUnread,
  };

  return (
    <>
      {/* Desktop tabs */}
      <nav className="hidden md:flex border-b border-border bg-surface">
        <div className="max-w-5xl mx-auto w-full flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-text-secondary hover:text-primary hover:border-primary/30"
                }`}
              >
                <Icon size={18} />
                {t(tab.labelKey)}
                {unreadCounts[tab.id] > 0 && (
                  <Badge count={unreadCounts[tab.id]} />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border safe-area-bottom">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors ${
                  isActive ? "text-primary" : "text-text-secondary"
                }`}
              >
                <div className="relative">
                  <Icon size={22} />
                  {unreadCounts[tab.id] > 0 && (
                    <span className="absolute -top-1 -right-2">
                      <Badge count={unreadCounts[tab.id]} />
                    </span>
                  )}
                </div>
                <span>{t(tab.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
