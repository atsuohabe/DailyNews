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
    const articles = await Promise.all(
      (data.articles || []).map(async (item: any, i: number): Promise<Article> => {
        let summary = item.description || "";

        // If summary is too short, try to enrich from the article page
        if (summary.length < 100 && item.url) {
          const pageSummary = await fetchPageDescription(item.url);
          if (pageSummary.length > summary.length) {
            summary = pageSummary;
          }
        }

        return {
          id: `gnews-${region}-${Date.now()}-${i}`,
          title: item.title || "",
          summary,
          source: item.source?.name || "GNews",
          sourceUrl: item.url || "",
          publishedAt: item.publishedAt || new Date().toISOString(),
          region,
          isRead: false,
          category: "general",
          imageUrl: item.image || undefined,
          originalLanguage: config.lang,
        };
      })
    );
    return articles;
  } catch {
    return [];
  }
}

async function fetchPageDescription(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ja,en;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });
    if (!res.ok) return "";
    const html = await res.text();

    // 1. Try og:description
    const ogMatch =
      html.match(
        /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']{20,})["']/i
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']{20,})["'][^>]*property=["']og:description["']/i
      );
    if (ogMatch?.[1]) {
      const text = decodeHtmlEntities(ogMatch[1]).trim();
      if (text.length > 30) return text.slice(0, 800);
    }

    // 2. Try meta description
    const metaMatch =
      html.match(
        /<meta[^>]*name=["']description["'][^>]*content=["']([^"']{20,})["']/i
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']{20,})["'][^>]*name=["']description["']/i
      );
    if (metaMatch?.[1]) {
      const text = decodeHtmlEntities(metaMatch[1]).trim();
      if (text.length > 30) return text.slice(0, 800);
    }

    // 3. Try article body or main content area
    const bodyMatch =
      html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
      html.match(/<div[^>]*class="[^"]*(?:article|entry|post|content|body)[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
      html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);

    const searchArea = bodyMatch ? bodyMatch[1] : html;

    // 4. Extract text from <p> tags (handles nested HTML inside <p>)
    const pTagRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    const paragraphs: string[] = [];
    let match;
    while ((match = pTagRegex.exec(searchArea)) !== null) {
      const text = match[1]
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (text.length > 20) {
        paragraphs.push(text);
      }
      if (paragraphs.length >= 5) break;
    }

    if (paragraphs.length > 0) {
      return paragraphs.join(" ").slice(0, 800);
    }

    return "";
  } catch {
    return "";
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ");
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
            // Extract the best available summary from RSS fields
            const contentSnippet = item.contentSnippet?.trim() || "";
            const contentStripped = item.content
              ? item.content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
              : "";
            const description = (item as Record<string, unknown>).description
              ? String((item as Record<string, unknown>).description)
                  .replace(/<[^>]*>/g, "")
                  .replace(/\s+/g, " ")
                  .trim()
              : "";

            // Pick the longest available text
            let summary = "";
            for (const candidate of [contentSnippet, contentStripped, description]) {
              if (candidate.length > summary.length) {
                summary = candidate;
              }
            }
            summary = summary.slice(0, 800);

            // If summary is missing or too short, try to fetch from the article page
            if (summary.length < 100 && item.link) {
              const pageSummary = await fetchPageDescription(item.link);
              if (pageSummary.length > summary.length) {
                summary = pageSummary;
              }
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
