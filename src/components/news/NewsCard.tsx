"use client";

import { useTranslations } from "next-intl";
import { Clock, ExternalLink } from "lucide-react";
import { type Article } from "@/lib/types";

interface TranslatedArticle extends Article {
  translatedTitle?: string;
  translatedSummary?: string;
}

interface NewsCardProps {
  article: TranslatedArticle;
  onClick: () => void;
}

export default function NewsCard({ article, onClick }: NewsCardProps) {
  const t = useTranslations("news");

  const title = article.translatedTitle || article.title;
  const summary = article.translatedSummary || article.summary;

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "< 1h";
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <button
      onClick={onClick}
      className="card w-full text-left group"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {!article.isRead && <span className="badge-unread flex-shrink-0" />}
            <h3
              className={`text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors ${
                article.isRead ? "text-text-secondary" : "text-text"
              }`}
            >
              {title}
            </h3>
          </div>
          <p className="text-xs text-text-secondary line-clamp-6 mb-2">
            {summary}
          </p>
          <div className="flex items-center gap-3 text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              <ExternalLink size={12} />
              {article.source}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {timeAgo(article.publishedAt)}
            </span>
            {!article.isRead && (
              <span className="text-unread font-medium">{t("unread")}</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
