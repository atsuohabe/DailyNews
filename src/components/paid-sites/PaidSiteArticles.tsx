"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CreditCard, CheckCheck, RefreshCw } from "lucide-react";
import { type Article } from "@/lib/types";
import { usePaidSitesStore } from "@/store/paidSitesStore";
import NewsCard from "@/components/news/NewsCard";
import ArticleModal from "@/components/news/ArticleModal";
import PaidSiteRegister from "./PaidSiteRegister";
import PaidSiteList from "./PaidSiteList";

export default function PaidSiteArticles() {
  const t = useTranslations("paidSites");
  const tNews = useTranslations("news");
  const articles = usePaidSitesStore((s) => s.articles);
  const fetchArticles = usePaidSitesStore((s) => s.fetchArticles);
  const markAsRead = usePaidSitesStore((s) => s.markAsRead);
  const markAllAsRead = usePaidSitesStore((s) => s.markAllAsRead);
  const sites = usePaidSitesStore((s) => s.sites);
  const isLoading = usePaidSitesStore((s) => s.isLoading);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleArticleClick = (article: Article) => {
    markAsRead(article.id);
    setSelectedArticle(article);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchArticles();
    setIsRefreshing(false);
  };

  const unreadCount = articles.filter((a) => !a.isRead).length;

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t("title")}</h2>
        <PaidSiteRegister />
      </div>

      <PaidSiteList />

      {sites.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-bright mb-4">
            <CreditCard size={28} className="text-text-secondary" />
          </div>
          <p className="text-sm text-text-secondary mb-1">{t("noSites")}</p>
          <p className="text-xs text-text-secondary">
            {t("emptyDescription")}
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">{t("articles")}</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary transition-colors"
                >
                  <CheckCheck size={14} />
                  {tNews("markRead")}
                </button>
              )}
              <button
                onClick={handleRefresh}
                className={`p-2 rounded-lg hover:bg-surface-bright transition-colors ${isRefreshing ? "animate-spin" : ""}`}
              >
                <RefreshCw size={16} className="text-text-secondary" />
              </button>
            </div>
          </div>
          {isLoading || isRefreshing ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-4 bg-surface-bright rounded w-3/4 mb-2" />
                  <div className="h-3 bg-surface-bright rounded w-full mb-1" />
                  <div className="h-3 bg-surface-bright rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-4">
              {t("noArticles")}
            </p>
          ) : (
            <div className="space-y-2">
              {articles.map((article) => (
                <NewsCard
                  key={article.id}
                  article={article}
                  onClick={() => handleArticleClick(article)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <ArticleModal
        article={selectedArticle}
        isOpen={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </div>
  );
}
