import { NextRequest, NextResponse } from "next/server";
import {
  discoverRssUrl,
  fetchRssArticles,
  scrapePageForArticles,
  fetchPageDescription,
} from "@/lib/scraper";
import type { Article } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { sites } = body;

  if (!sites || !Array.isArray(sites) || sites.length === 0) {
    return NextResponse.json({ articles: [], timestamp: new Date().toISOString() });
  }

  const allArticles: Article[] = [];

  await Promise.all(
    sites.map(async (site: { id: string; name: string; url: string }) => {
      try {
        let articles: { title: string; summary: string; url: string; publishedAt: string }[] = [];

        // 1. Try RSS auto-discovery
        const rssUrl = await discoverRssUrl(site.url);
        if (rssUrl) {
          articles = await fetchRssArticles(rssUrl, 5);
        }

        // 2. If RSS didn't work or returned too few, try page scraping
        if (articles.length < 2) {
          const scraped = await scrapePageForArticles(site.url, 5);
          if (scraped.length > articles.length) {
            articles = scraped;
          }
        }

        // 3. If still nothing, at least get the main page description
        if (articles.length === 0) {
          const desc = await fetchPageDescription(site.url);
          if (desc) {
            articles = [
              {
                title: `${site.name} - 最新情報`,
                summary: desc,
                url: site.url,
                publishedAt: new Date().toISOString(),
              },
            ];
          }
        }

        const mapped: Article[] = articles.map((a, i) => ({
          id: `paid-${site.id}-${i}-${Date.now()}`,
          title: a.title,
          summary: a.summary,
          source: site.name,
          sourceUrl: a.url,
          publishedAt: a.publishedAt,
          region: "global",
          isRead: false,
          category: "paid",
        }));

        allArticles.push(...mapped);
      } catch {
        // Skip failed sites
      }
    })
  );

  allArticles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return NextResponse.json({
    articles: allArticles,
    timestamp: new Date().toISOString(),
  });
}
