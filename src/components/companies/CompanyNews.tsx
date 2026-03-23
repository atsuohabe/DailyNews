"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { type Article } from "@/lib/types";
import { useCompaniesStore } from "@/store/companiesStore";
import NewsCard from "@/components/news/NewsCard";
import ArticleModal from "@/components/news/ArticleModal";
import CompanyRegister from "./CompanyRegister";
import CompanyList from "./CompanyList";

export default function CompanyNews() {
  const t = useTranslations("companies");
  const articles = useCompaniesStore((s) => s.articles);
  const fetchArticles = useCompaniesStore((s) => s.fetchArticles);
  const markAsRead = useCompaniesStore((s) => s.markAsRead);
  const companies = useCompaniesStore((s) => s.companies);
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
        <CompanyRegister />
      </div>

      <CompanyList />

      {companies.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">{t("topics")}</h3>
          <div className="space-y-2">
            {articles.length === 0 ? (
              <p className="text-center py-8 text-text-secondary text-sm">
                {t("noCompanies")}
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

      {companies.length === 0 && (
        <div className="text-center py-12 text-text-secondary text-sm">
          {t("noCompanies")}
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
