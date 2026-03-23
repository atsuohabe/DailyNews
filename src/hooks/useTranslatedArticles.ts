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

async function translateText(text: string, targetLang: string): Promise<string> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, targetLang }),
  });
  const data = await res.json();
  return data.translated || text;
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
    setTranslated(cached); // Show cached results immediately

    // Translate in batches of 3 to avoid overwhelming the API
    const batchSize = 3;
    let completed = 0;

    (async () => {
      for (let i = 0; i < needed.length; i += batchSize) {
        if (controller.signal.aborted) return;

        const batch = needed.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map(async (article) => {
            try {
              const [title, summary] = await Promise.all([
                translateText(article.title, locale),
                translateText(article.summary, locale),
              ]);
              return { id: article.id, title, summary };
            } catch {
              return { id: article.id, title: article.title, summary: article.summary };
            }
          })
        );

        if (controller.signal.aborted) return;

        // Update cache and state
        setTranslated((prev) => {
          const next = new Map(prev);
          for (const r of results) {
            const cacheKey = `${r.id}:${locale}`;
            translationCache.set(cacheKey, { title: r.title, summary: r.summary });
            next.set(r.id, { title: r.title, summary: r.summary });
          }
          return next;
        });

        completed += batch.length;
        if (completed >= needed.length) {
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
