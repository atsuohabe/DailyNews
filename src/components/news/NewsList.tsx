"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw, CheckCheck } from "lucide-react";
import { type Article, type Region } from "@/lib/types";
import { useNewsStore } from "@/store/newsStore";
import { useSettingsStore } from "@/store/settingsStore";
import NewsCard from "./NewsCard";
import RegionSelector from "./RegionSelector";
import ArticleModal from "./ArticleModal";
import { ARTICLES_PER_REGION } from "@/lib/constants";

export default function NewsList() {
  const t = useTranslations("news");
  const region = useSettingsStore((s) => s.region);
  const setRegion = useSettingsStore((s) => s.setRegion);
  const articles = useNewsStore((s) => s.articles[region]);
  const lastUpdated = useNewsStore((s) => s.lastUpdated[region]);
  const fetchArticles = useNewsStore((s) => s.fetchArticles);
  const markAsRead = useNewsStore((s) => s.markAsRead);
  const markAllAsRead = useNewsStore((s) => s.markAllAsRead);

  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (articles.length === 0) {
      fetchArticles(region);
    }
  }, [region, articles.length, fetchArticles]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchArticles(region);
    setTimeout(() => setIsRefreshing(false), 500);
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
          <h2 className="text-sm font-semibold">
            {t("topArticles", { count: ARTICLES_PER_REGION })}
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
              isRefreshing ? "animate-spin" : ""
            }`}
          >
            <RefreshCw size={16} className="text-text-secondary" />
          </button>
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
