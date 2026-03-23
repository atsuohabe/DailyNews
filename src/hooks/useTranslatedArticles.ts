"use client";

import { useState, useEffect, useRef } from "react";
import { type Article, type Locale, type Region } from "@/lib/types";

// Regions where articles are expected to already be in the target language
const NATIVE_REGION: Record<Locale, Region[]> = {
  ja: ["japan"],
  en: ["us", "global"],
  "zh-TW": ["taiwan"],
  es: ["latam"],
};

interface TranslatedArticle extends Article {
  translatedTitle?: string;
  translatedSummary?: string;
}

// Cache: key = `${articleId}:${locale}` → { title, summary }
const translationCache = new Map<string, { title: string; summary: string }>();

async function translateBatch(
  texts: string[],
  targetLang: string
): Promise<string[]> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts, targetLang }),
  });
  const data = await res.json();
  return data.translations || texts;
}

export function useTranslatedArticles(
  articles: Article[],
  locale: Locale,
  region?: Region
): { articles: TranslatedArticle[]; isTranslating: boolean } {
  const [translated, setTranslated] = useState<Map<string, { title: string; summary: string }>>(new Map());
  const [isTranslating, setIsTranslating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (articles.length === 0) {
      setTranslated(new Map());
      return;
    }

    // Skip translation if the region natively matches the locale
    const nativeRegions = NATIVE_REGION[locale] || [];
    if (region && nativeRegions.includes(region)) {
      setTranslated(new Map());
      return;
    }

    // Find articles that need translation (not in cache)
    const needed: Article[] = [];
    const cached = new Map<string, { title: string; summary: string }>();

    for (const article of articles) {
      const cacheKey = `${article.id}:${locale}`;
      const hit = translationCache.get(cacheKey);
      if (hit) {
        cached.set(article.id, hit);
      } else {
        needed.push(article);
      }
    }

    if (needed.length === 0) {
      setTranslated(cached);
      return;
    }

    // Cancel previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsTranslating(true);
    setTranslated(cached);

    (async () => {
      try {
        // Batch all titles and summaries into a single API call
        const allTexts = needed.flatMap((a) => [a.title, a.summary || ""]);
        const results = await translateBatch(allTexts, locale);

        if (controller.signal.aborted) return;

        setTranslated((prev) => {
          const next = new Map(prev);
          for (let i = 0; i < needed.length; i++) {
            const article = needed[i];
            const title = results[i * 2] || article.title;
            const summary = results[i * 2 + 1] || article.summary;
            const cacheKey = `${article.id}:${locale}`;
            translationCache.set(cacheKey, { title, summary });
            next.set(article.id, { title, summary });
          }
          return next;
        });
      } catch {
        // On error, keep originals
      } finally {
        if (!controller.signal.aborted) {
          setIsTranslating(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [articles, locale, region]);

  const result: TranslatedArticle[] = articles.map((article) => {
    const t = translated.get(article.id);
    return t
      ? { ...article, translatedTitle: t.title, translatedSummary: t.summary }
      : article;
  });

  return { articles: result, isTranslating };
}
