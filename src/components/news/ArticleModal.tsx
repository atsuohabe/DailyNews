"use client";

import { useTranslations } from "next-intl";
import { ExternalLink, Clock, Globe } from "lucide-react";
import { type Article } from "@/lib/types";
import { LOCALE_LABELS } from "@/lib/constants";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { useState } from "react";

interface ArticleModalProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ArticleModal({ article, isOpen, onClose }: ArticleModalProps) {
  const t = useTranslations("news");
  const [viewLang, setViewLang] = useState("original");

  if (!article) return null;

  const langOptions = [
    { value: "original", label: "Original" },
    ...Object.entries(LOCALE_LABELS).map(([code, label]) => ({
      value: code,
      label,
    })),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={article.source}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Globe size={14} className="text-text-secondary" />
          <Select
            value={viewLang}
            onChange={setViewLang}
            options={langOptions}
            className="flex-1 max-w-[200px]"
          />
          <span className="text-xs text-text-secondary">{t("translateTo")}</span>
        </div>

        <h2 className="text-lg font-bold leading-snug">{article.title}</h2>

        <div className="flex items-center gap-4 text-sm text-text-secondary">
          <span className="flex items-center gap-1">
            <ExternalLink size={14} />
            {article.source}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {new Date(article.publishedAt).toLocaleString()}
          </span>
        </div>

        <div className="bg-surface-dim rounded-lg p-4">
          <h3 className="text-sm font-semibold text-text-secondary mb-2">
            {t("summary")}
          </h3>
          <p className="text-sm leading-relaxed">{article.summary}</p>
        </div>

        {article.content && (
          <div className="prose prose-sm max-w-none">
            <p className="leading-relaxed">{article.content}</p>
          </div>
        )}

        <div className="pt-4 border-t border-border">
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <ExternalLink size={14} />
            {t("readOriginal")}
          </a>
        </div>
      </div>
    </Modal>
  );
}
