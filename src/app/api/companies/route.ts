import { NextRequest, NextResponse } from "next/server";
import {
  discoverRssUrl,
  fetchRssArticles,
  scrapePageForArticles,
  fetchPageDescription,
  stripHtml,
  decodeHtmlEntities,
} from "@/lib/scraper";
import type { Article } from "@/lib/types";
import Parser from "rss-parser";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "DailyNews/1.0",
    Accept: "application/rss+xml, application/xml, text/xml",
  },
});

async function searchGoogleNews(
  query: string,
  maxItems = 5
): Promise<{ title: string; summary: string; url: string; publishedAt: string; source: string }[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const feedUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=ja&gl=JP&ceid=JP:ja`;
    const feed = await parser.parseURL(feedUrl);
    const items = (feed.items || []).slice(0, maxItems);

    const articles = await Promise.all(
      items.map(async (item) => {
        const contentSnippet = item.contentSnippet?.trim() || "";
        const contentStripped = item.content ? stripHtml(item.content) : "";

        let summary = contentSnippet.length > contentStripped.length ? contentSnippet : contentStripped;
        summary = decodeHtmlEntities(summary).slice(0, 800);

        // Google News RSS summaries are often just source attribution; enrich from page
        if (summary.length < 100 && item.link) {
          const pageSummary = await fetchPageDescription(item.link);
          if (pageSummary.length > summary.length) {
            summary = pageSummary;
          }
        }

        const source = item.creator || item.author || extractSourceFromTitle(item.title || "");

        return {
          title: (item.title || "").replace(/ - [^-]+$/, "").trim(),
          summary,
          url: item.link || "",
          publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
          source,
        };
      })
    );

    return articles.filter((a) => a.title.length > 0);
  } catch {
    return [];
  }
}

function extractSourceFromTitle(title: string): string {
  const match = title.match(/ - ([^-]+)$/);
  return match ? match[1].trim() : "";
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { companies } = body;

  if (!companies || !Array.isArray(companies) || companies.length === 0) {
    return NextResponse.json({ articles: [], timestamp: new Date().toISOString() });
  }

  const allArticles: Article[] = [];

  await Promise.all(
    companies.map(async (company: { id: string; name: string; url: string }) => {
      try {
        // 1. Search Google News for the company name
        const newsArticles = await searchGoogleNews(company.name, 5);

        // 2. Also try the company's own site for press releases
        let siteArticles: { title: string; summary: string; url: string; publishedAt: string }[] = [];
        try {
          const rssUrl = await discoverRssUrl(company.url);
          if (rssUrl) {
            siteArticles = await fetchRssArticles(rssUrl, 3);
          } else {
            // Try common press/news paths
            const newsUrls = [
              new URL("/news", company.url).toString(),
              new URL("/press", company.url).toString(),
              new URL("/blog", company.url).toString(),
            ];
            for (const url of newsUrls) {
              const scraped = await scrapePageForArticles(url, 3);
              if (scraped.length > 0) {
                siteArticles = scraped;
                break;
              }
            }
          }
        } catch {
          // Company site scraping is best-effort
        }

        // 3. If both Google News and site scraping failed, get page description
        if (newsArticles.length === 0 && siteArticles.length === 0) {
          const desc = await fetchPageDescription(company.url);
          if (desc) {
            allArticles.push({
              id: `company-${company.id}-desc-${Date.now()}`,
              title: `${company.name} - 企業情報`,
              summary: desc,
              source: company.name,
              sourceUrl: company.url,
              publishedAt: new Date().toISOString(),
              region: "global",
              isRead: false,
              category: "companies",
            });
          }
        }

        // Map Google News results
        const mappedNews: Article[] = newsArticles.map((a, i) => ({
          id: `company-${company.id}-news-${i}-${Date.now()}`,
          title: a.title,
          summary: a.summary,
          source: a.source || company.name,
          sourceUrl: a.url,
          publishedAt: a.publishedAt,
          region: "global",
          isRead: false,
          category: "companies",
        }));

        // Map company site results
        const mappedSite: Article[] = siteArticles.map((a, i) => ({
          id: `company-${company.id}-site-${i}-${Date.now()}`,
          title: a.title,
          summary: a.summary,
          source: company.name,
          sourceUrl: a.url,
          publishedAt: a.publishedAt,
          region: "global",
          isRead: false,
          category: "companies",
        }));

        allArticles.push(...mappedNews, ...mappedSite);
      } catch {
        // Skip failed companies
      }
    })
  );

  // Deduplicate by title prefix
  const seen = new Set<string>();
  const unique = allArticles.filter((article) => {
    const key = article.title.slice(0, 30).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  unique.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return NextResponse.json({
    articles: unique,
    timestamp: new Date().toISOString(),
  });
}
