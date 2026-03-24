import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";
import { getFeedsForRegion } from "@/lib/rssFeeds";
import type { Article, Region } from "@/lib/types";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "DailyNews/1.0",
    Accept: "application/rss+xml, application/xml, text/xml",
  },
});

const GNEWS_API_KEY = process.env.GNEWS_API_KEY || "";

const GNEWS_REGIONS: Record<string, { country: string; lang: string }> = {
  japan: { country: "jp", lang: "ja" },
  global: { country: "us", lang: "en" },
  taiwan: { country: "tw", lang: "zh" },
  us: { country: "us", lang: "en" },
  eu: { country: "gb", lang: "en" },
  latam: { country: "mx", lang: "es" },
};

async function fetchFromGNews(region: Region): Promise<Article[]> {
  if (!GNEWS_API_KEY) return [];

  const config = GNEWS_REGIONS[region] || GNEWS_REGIONS["global"];
  const url = `https://gnews.io/api/v4/top-headlines?category=general&lang=${config.lang}&country=${config.country}&max=10&apikey=${GNEWS_API_KEY}`;

  try {
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) return [];
    const data = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.articles || []).map(
      (item: any, i: number): Article => ({
        id: `gnews-${region}-${Date.now()}-${i}`,
        title: item.title || "",
        summary: item.description || "",
        source: item.source?.name || "GNews",
        sourceUrl: item.url || "",
        publishedAt: item.publishedAt || new Date().toISOString(),
        region,
        isRead: false,
        category: "general",
        imageUrl: item.image || undefined,
        originalLanguage: config.lang,
      })
    );
  } catch {
    return [];
  }
}

async function fetchPageDescription(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "DailyNews/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return "";
    const html = await res.text();

    // Try og:description first, then meta description
    const ogMatch = html.match(
      /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i
    ) || html.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i
    );
    if (ogMatch?.[1]) return ogMatch[1].slice(0, 500);

    const metaMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
    ) || html.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i
    );
    if (metaMatch?.[1]) return metaMatch[1].slice(0, 500);

    return "";
  } catch {
    return "";
  }
}

async function fetchFromRSS(region: Region): Promise<Article[]> {
  const feeds = getFeedsForRegion(region);
  const articles: Article[] = [];

  const results = await Promise.allSettled(
    feeds.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.url);
        const items = (feed.items || []).slice(0, 5);

        const articlesFromFeed = await Promise.all(
          items.map(async (item, i): Promise<Article> => {
            let summary =
              item.contentSnippet?.slice(0, 500) ||
              item.content?.replace(/<[^>]*>/g, "").trim().slice(0, 500) ||
              "";

            // If no summary, try to fetch from the article page
            if (!summary && item.link) {
              summary = await fetchPageDescription(item.link);
            }

            return {
              id: `rss-${region}-${source.name}-${i}-${Date.now()}`,
              title: item.title || "",
              summary,
              source: source.name,
              sourceUrl: item.link || "",
              publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
              region,
              isRead: false,
              category: "general",
              originalLanguage: source.language,
            };
          })
        );

        return articlesFromFeed;
      } catch {
        return [];
      }
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      articles.push(...result.value);
    }
  }

  return articles;
}

export async function GET(request: NextRequest) {
  const region = (request.nextUrl.searchParams.get("region") || "japan") as Region;

  try {
    const [rssArticles, gnewsArticles] = await Promise.all([
      fetchFromRSS(region),
      fetchFromGNews(region),
    ]);

    const allArticles = [...gnewsArticles, ...rssArticles];

    // Sort by date, newest first
    allArticles.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // Deduplicate by similar titles
    const seen = new Set<string>();
    const unique = allArticles.filter((article) => {
      const key = article.title.slice(0, 30).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({
      region,
      articles: unique.slice(0, 10),
      timestamp: new Date().toISOString(),
      sources: {
        rss: rssArticles.length,
        gnews: gnewsArticles.length,
      },
    });
  } catch {
    return NextResponse.json(
      { region, articles: [], error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
