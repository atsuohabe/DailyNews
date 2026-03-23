"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { type Article } from "@/lib/types";
import { usePaidSitesStore } from "@/store/paidSitesStore";
import NewsCard from "@/components/news/NewsCard";
import ArticleModal from "@/components/news/ArticleModal";
import PaidSiteRegister from "./PaidSiteRegister";
import PaidSiteList from "./PaidSiteList";

export default function PaidSiteArticles() {
  const t = useTranslations("paidSites");
  const articles = usePaidSitesStore((s) => s.articles);
  const fetchArticles = usePaidSitesStore((s) => s.fetchArticles);
  const markAsRead = usePaidSitesStore((s) => s.markAsRead);
  const sites = usePaidSitesStore((s) => s.sites);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleArticleClick = (article: Article) => {
    markAsRead(article.id);
    setSelectedArticle(article);
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t("title")}</h2>
        <PaidSiteRegister />
      </div>

      <PaidSiteList />

      {sites.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">{t("articles")}</h3>
          <div className="space-y-2">
            {articles.length === 0 ? (
              <p className="text-center py-8 text-text-secondary text-sm">
                {t("noSites")}
              </p>
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
        </div>
      )}

      {sites.length === 0 && (
        <div className="text-center py-12 text-text-secondary text-sm">
          {t("noSites")}
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
