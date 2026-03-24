"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw, CheckCheck, Loader2, RotateCw } from "lucide-react";
import { type Article, type Region } from "@/lib/types";
import { useNewsStore } from "@/store/newsStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useTranslatedArticles } from "@/hooks/useTranslatedArticles";
import NewsCard from "./NewsCard";
import RegionSelector from "./RegionSelector";
import ArticleModal from "./ArticleModal";
import { ARTICLES_PER_REGION } from "@/lib/constants";

export default function NewsList() {
  const t = useTranslations("news");
  const region = useSettingsStore((s) => s.region);
  const locale = useSettingsStore((s) => s.locale);
  const setRegion = useSettingsStore((s) => s.setRegion);
  const enabledRegions = useSettingsStore((s) => s.enabledRegions);
  const rawArticles = useNewsStore((s) => s.articles[region]) || [];
  const lastUpdated = useNewsStore((s) => s.lastUpdated[region]);
  const fetchArticles = useNewsStore((s) => s.fetchArticles);
  const fetchAllRegions = useNewsStore((s) => s.fetchAllRegions);
  const isBulkRefreshing = useNewsStore((s) => s.isBulkRefreshing);
  const markAsRead = useNewsStore((s) => s.markAsRead);
  const markAllAsRead = useNewsStore((s) => s.markAllAsRead);

  const { articles, isTranslating } = useTranslatedArticles(rawArticles, locale, region);

  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const isLoading = useNewsStore((s) => s.isLoading[region]) || false;

  useEffect(() => {
    if (rawArticles.length === 0) {
      fetchArticles(region);
    }
  }, [region, rawArticles.length, fetchArticles]);

  const handleRefresh = () => {
    fetchArticles(region);
  };

  const handleArticleClick = (article: Article) => {
    markAsRead(article.id);
    setSelectedArticle(article);
  };

  const unreadCount = articles.filter((a) => !a.isRead).length;

  return (
    <div>
      <RegionSelector value={region} onChange={(r: Region) => setRegion(r)} />

      <div className="px-4 py-2 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2">
            {t("topArticles", { count: ARTICLES_PER_REGION })}
            {isTranslating && <Loader2 size={14} className="animate-spin text-primary" />}
          </h2>
          {lastUpdated && (
            <p className="text-xs text-text-secondary">
              {t("lastUpdated", { time: new Date(lastUpdated).toLocaleTimeString() })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead(region)}
              className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary transition-colors"
            >
              <CheckCheck size={14} />
              {t("markRead")}
            </button>
          )}
          <button
            onClick={handleRefresh}
            className={`p-2 rounded-lg hover:bg-surface-bright transition-colors ${
              isLoading ? "animate-spin" : ""
            }`}
            title={t("lastUpdated", { time: "" }).replace(/:?\s*$/, "")}
          >
            <RefreshCw size={16} className="text-text-secondary" />
          </button>
          {enabledRegions.length > 1 && (
            <button
              onClick={() => fetchAllRegions(enabledRegions)}
              disabled={isBulkRefreshing}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-border hover:bg-surface-bright transition-colors ${
                isBulkRefreshing ? "opacity-60" : ""
              }`}
              title={t("refreshAll")}
            >
              <RotateCw size={14} className={`text-text-secondary ${isBulkRefreshing ? "animate-spin" : ""}`} />
              <span className="text-text-secondary">{t("refreshAll")}</span>
            </button>
          )}
        </div>
      </div>

      <div className="px-4 space-y-2 pb-4">
        {articles.length === 0 ? (
          <div className="text-center py-12 text-text-secondary text-sm">
            {t("noArticles")}
          </div>
        ) : (
          articles.map((article) => (
            <NewsCard
              key={article.id}
              article={article}
              onClick={() => handleArticleClick(article)}
            />
          ))
        )}
      </div>

      <ArticleModal
        article={selectedArticle}
        isOpen={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </div>
  );
}
