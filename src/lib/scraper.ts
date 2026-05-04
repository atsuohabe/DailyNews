import Parser from "rss-parser";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "DailyNews/1.0",
    Accept: "application/rss+xml, application/xml, text/xml",
  },
});

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "ja,en;q=0.9",
};

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchPageDescription(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });
    if (!res.ok) return "";
    const html = await res.text();
    return extractDescriptionFromHtml(html);
  } catch {
    return "";
  }
}

export function extractDescriptionFromHtml(html: string): string {
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
    html.match(
      /<div[^>]*class="[^"]*(?:article|entry|post|content|body)[^"]*"[^>]*>([\s\S]*?)<\/div>/i
    ) ||
    html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);

  const searchArea = bodyMatch ? bodyMatch[1] : html;

  // 4. Extract text from <p> tags
  const pTagRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  const paragraphs: string[] = [];
  let match;
  while ((match = pTagRegex.exec(searchArea)) !== null) {
    const text = stripHtml(match[1]);
    if (text.length > 20) {
      paragraphs.push(text);
    }
    if (paragraphs.length >= 5) break;
  }

  if (paragraphs.length > 0) {
    return paragraphs.join(" ").slice(0, 800);
  }

  return "";
}

export interface ScrapedArticle {
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
}

export async function discoverRssUrl(pageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(pageUrl, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Look for RSS/Atom link tags
    const rssLink =
      html.match(
        /<link[^>]*type=["']application\/rss\+xml["'][^>]*href=["']([^"']+)["']/i
      ) ||
      html.match(
        /<link[^>]*href=["']([^"']+)["'][^>]*type=["']application\/rss\+xml["']/i
      ) ||
      html.match(
        /<link[^>]*type=["']application\/atom\+xml["'][^>]*href=["']([^"']+)["']/i
      ) ||
      html.match(
        /<link[^>]*href=["']([^"']+)["'][^>]*type=["']application\/atom\+xml["']/i
      );

    if (rssLink?.[1]) {
      const href = rssLink[1];
      if (href.startsWith("http")) return href;
      const base = new URL(pageUrl);
      return new URL(href, base).toString();
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchRssArticles(
  feedUrl: string,
  maxItems = 10
): Promise<ScrapedArticle[]> {
  try {
    const feed = await parser.parseURL(feedUrl);
    const items = (feed.items || []).slice(0, maxItems);

    const articles = await Promise.all(
      items.map(async (item): Promise<ScrapedArticle> => {
        const contentSnippet = item.contentSnippet?.trim() || "";
        const contentStripped = item.content ? stripHtml(item.content) : "";
        const description = (item as Record<string, unknown>).description
          ? stripHtml(String((item as Record<string, unknown>).description))
          : "";

        let summary = "";
        for (const candidate of [contentSnippet, contentStripped, description]) {
          if (candidate.length > summary.length) summary = candidate;
        }
        summary = summary.slice(0, 800);

        if (summary.length < 100 && item.link) {
          const pageSummary = await fetchPageDescription(item.link);
          if (pageSummary.length > summary.length) summary = pageSummary;
        }

        return {
          title: item.title || "",
          summary,
          url: item.link || "",
          publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
        };
      })
    );

    return articles.filter((a) => a.title.length > 0);
  } catch {
    return [];
  }
}

export async function scrapePageForArticles(
  pageUrl: string,
  maxItems = 10
): Promise<ScrapedArticle[]> {
  try {
    const res = await fetch(pageUrl, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });
    if (!res.ok) return [];
    const html = await res.text();
    const base = new URL(pageUrl);

    const articles: ScrapedArticle[] = [];

    // Try to find article links with headings
    const patterns = [
      // <a href="..."><h2>Title</h2></a> or similar
      /<a[^>]*href=["']([^"']+)["'][^>]*>[\s\S]*?<(?:h[1-4]|strong)[^>]*>([\s\S]*?)<\/(?:h[1-4]|strong)>/gi,
      // <h2><a href="...">Title</a></h2>
      /<(?:h[1-4])[^>]*>[\s\S]*?<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    ];

    const seen = new Set<string>();
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html)) !== null && articles.length < maxItems) {
        const href = match[1];
        const title = stripHtml(match[2]).trim();
        if (!title || title.length < 5) continue;

        let fullUrl: string;
        try {
          fullUrl = href.startsWith("http") ? href : new URL(href, base).toString();
        } catch {
          continue;
        }

        const key = title.slice(0, 30).toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        articles.push({
          title: decodeHtmlEntities(title),
          summary: "",
          url: fullUrl,
          publishedAt: new Date().toISOString(),
        });
      }
    }

    // Enrich articles with page descriptions (parallel, limited concurrency)
    const enriched = await Promise.all(
      articles.slice(0, maxItems).map(async (article) => {
        if (!article.summary && article.url) {
          const desc = await fetchPageDescription(article.url);
          return { ...article, summary: desc };
        }
        return article;
      })
    );

    return enriched.filter((a) => a.title.length > 0);
  } catch {
    return [];
  }
}
