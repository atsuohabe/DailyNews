"use client";

import { useTranslations } from "next-intl";
import { ExternalLink, Clock, Globe, Loader2 } from "lucide-react";
import { type Article } from "@/lib/types";
import { LOCALE_LABELS } from "@/lib/constants";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { useState, useCallback } from "react";

interface ArticleModalProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
}

interface TranslatedContent {
  title: string;
  summary: string;
  content?: string;
}

async function translateText(text: string, targetLang: string): Promise<string> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, targetLang }),
  });
  const data = await res.json();
  return data.translated || text;
}

export default function ArticleModal({ article, isOpen, onClose }: ArticleModalProps) {
  const t = useTranslations("news");
  const [viewLang, setViewLang] = useState("original");
  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState<TranslatedContent | null>(null);
  const [translatedLang, setTranslatedLang] = useState<string | null>(null);

  const handleLangChange = useCallback(
    async (lang: string) => {
      setViewLang(lang);

      if (lang === "original" || !article) {
        setTranslated(null);
        setTranslatedLang(null);
        return;
      }

      setTranslating(true);
      try {
        const [title, summary, content] = await Promise.all([
          translateText(article.title, lang),
          translateText(article.summary, lang),
          article.content ? translateText(article.content, lang) : Promise.resolve(undefined),
        ]);
        setTranslated({ title, summary, content });
        setTranslatedLang(lang);
      } catch {
        setTranslated(null);
        setTranslatedLang(null);
      } finally {
        setTranslating(false);
      }
    },
    [article]
  );

  const handleClose = () => {
    setViewLang("original");
    setTranslated(null);
    setTranslatedLang(null);
    onClose();
  };

  if (!article) return null;

  const displayTitle = translated && translatedLang === viewLang ? translated.title : article.title;
  const displaySummary = translated && translatedLang === viewLang ? translated.summary : article.summary;
  const displayContent = translated && translatedLang === viewLang ? translated.content : article.content;

  const langOptions = [
    { value: "original", label: "Original" },
    ...Object.entries(LOCALE_LABELS).map(([code, label]) => ({
      value: code,
      label,
    })),
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={article.source}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Globe size={14} className="text-text-secondary" />
          <Select
            value={viewLang}
            onChange={handleLangChange}
            options={langOptions}
            className="flex-1 max-w-[200px]"
          />
          <span className="text-xs text-text-secondary">{t("translateTo")}</span>
          {translating && <Loader2 size={14} className="animate-spin text-primary" />}
        </div>

        <h2 className="text-lg font-bold leading-snug">{displayTitle}</h2>

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
          <p className="text-sm leading-relaxed">{displaySummary}</p>
        </div>

        {displayContent && (
          <div className="prose prose-sm max-w-none">
            <p className="leading-relaxed">{displayContent}</p>
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
