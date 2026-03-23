"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Building2, CheckCheck, RefreshCw } from "lucide-react";
import { type Article } from "@/lib/types";
import { useCompaniesStore } from "@/store/companiesStore";
import NewsCard from "@/components/news/NewsCard";
import ArticleModal from "@/components/news/ArticleModal";
import CompanyRegister from "./CompanyRegister";
import CompanyList from "./CompanyList";

export default function CompanyNews() {
  const t = useTranslations("companies");
  const tNews = useTranslations("news");
  const articles = useCompaniesStore((s) => s.articles);
  const fetchArticles = useCompaniesStore((s) => s.fetchArticles);
  const markAsRead = useCompaniesStore((s) => s.markAsRead);
  const markAllAsRead = useCompaniesStore((s) => s.markAllAsRead);
  const companies = useCompaniesStore((s) => s.companies);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleArticleClick = (article: Article) => {
    markAsRead(article.id);
    setSelectedArticle(article);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchArticles();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const unreadCount = articles.filter((a) => !a.isRead).length;

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t("title")}</h2>
        <CompanyRegister />
      </div>

      <CompanyList />

      {companies.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-bright mb-4">
            <Building2 size={28} className="text-text-secondary" />
          </div>
          <p className="text-sm text-text-secondary mb-1">{t("noCompanies")}</p>
          <p className="text-xs text-text-secondary">
            {t("emptyDescription")}
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">{t("topics")}</h3>
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
          <div className="space-y-2">
            {articles.map((article) => (
              <NewsCard
                key={article.id}
                article={article}
                onClick={() => handleArticleClick(article)}
              />
            ))}
          </div>
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
