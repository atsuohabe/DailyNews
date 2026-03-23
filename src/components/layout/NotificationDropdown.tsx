"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Bell, Newspaper, CreditCard, Building2 } from "lucide-react";
import { useNewsStore } from "@/store/newsStore";
import { usePaidSitesStore } from "@/store/paidSitesStore";
import { useCompaniesStore } from "@/store/companiesStore";
import { useSettingsStore } from "@/store/settingsStore";
import Badge from "@/components/ui/Badge";
import type { Article } from "@/lib/types";

interface NotificationItem {
  article: Article;
  tab: "general" | "paid" | "companies";
}

interface NotificationDropdownProps {
  onNavigateTab?: (tab: "general" | "paid" | "companies") => void;
}

export default function NotificationDropdown({ onNavigateTab }: NotificationDropdownProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const region = useSettingsStore((s) => s.region);
  const newsArticles = useNewsStore((s) => s.articles[region]) || [];
  const paidArticles = usePaidSitesStore((s) => s.articles);
  const companyArticles = useCompaniesStore((s) => s.articles);

  const newsUnread = newsArticles.filter((a) => !a.isRead);
  const paidUnread = paidArticles.filter((a) => !a.isRead);
  const companyUnread = companyArticles.filter((a) => !a.isRead);
  const totalUnread = newsUnread.length + paidUnread.length + companyUnread.length;

  const markNewsRead = useNewsStore((s) => s.markAsRead);
  const markPaidRead = usePaidSitesStore((s) => s.markAsRead);
  const markCompanyRead = useCompaniesStore((s) => s.markAsRead);

  // Build notification items (latest 10 unread)
  const items: NotificationItem[] = [
    ...newsUnread.map((a) => ({ article: a, tab: "general" as const })),
    ...paidUnread.map((a) => ({ article: a, tab: "paid" as const })),
    ...companyUnread.map((a) => ({ article: a, tab: "companies" as const })),
  ]
    .sort((a, b) => new Date(b.article.publishedAt).getTime() - new Date(a.article.publishedAt).getTime())
    .slice(0, 10);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleItemClick = (item: NotificationItem) => {
    // Mark as read
    if (item.tab === "general") markNewsRead(item.article.id);
    else if (item.tab === "paid") markPaidRead(item.article.id);
    else markCompanyRead(item.article.id);

    // Navigate to tab
    onNavigateTab?.(item.tab);
    setIsOpen(false);
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "general": return <Newspaper size={12} className="text-primary" />;
      case "paid": return <CreditCard size={12} className="text-green-500" />;
      case "companies": return <Building2 size={12} className="text-orange-500" />;
    }
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case "general": return t("tabs.general");
      case "paid": return t("tabs.paid");
      case "companies": return t("tabs.companies");
      default: return "";
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "< 1h";
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-surface-bright transition-colors"
      >
        <Bell size={20} className="text-text-secondary" />
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5">
            <Badge count={totalUnread} />
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-surface-dim">
            <h3 className="text-sm font-semibold">
              {totalUnread > 0
                ? t("notifications.newArticles", { count: totalUnread })
                : t("news.noArticles")}
            </h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-8 text-center text-sm text-text-secondary">
                {t("news.noArticles")}
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={`${item.tab}-${item.article.id}`}
                  onClick={() => handleItemClick(item)}
                  className="w-full px-4 py-3 text-left hover:bg-surface-bright transition-colors border-b border-border last:border-b-0"
                >
                  <div className="flex items-start gap-2">
                    <span className="badge-unread flex-shrink-0 mt-1.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.article.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
                        {getTabIcon(item.tab)}
                        <span>{getTabLabel(item.tab)}</span>
                        <span>{timeAgo(item.article.publishedAt)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
