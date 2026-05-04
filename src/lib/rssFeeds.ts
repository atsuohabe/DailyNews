import type { Region } from "./types";

export interface RSSSource {
  name: string;
  url: string;
  language: string;
}

export const RSS_FEEDS: Record<string, RSSSource[]> = {
  japan: [
    { name: "NHKニュース", url: "https://www.nhk.or.jp/rss/news/cat0.xml", language: "ja" },
    { name: "Yahoo!ニュース", url: "https://news.yahoo.co.jp/rss/topics/top-picks.xml", language: "ja" },
    { name: "朝日新聞デジタル", url: "https://www.asahi.com/rss/asahi/newsheadlines.rdf", language: "ja" },
    { name: "毎日新聞", url: "https://mainichi.jp/rss/etc/mainichi-flash.rss", language: "ja" },
    { name: "Google News JP", url: "https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja", language: "ja" },
  ],
  global: [
    { name: "Reuters", url: "https://feeds.reuters.com/reuters/topNews", language: "en" },
    { name: "BBC News", url: "https://feeds.bbci.co.uk/news/rss.xml", language: "en" },
    { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", language: "en" },
  ],
  taiwan: [
    { name: "中央通訊社", url: "https://feeds.feedburner.com/rsscna/politics", language: "zh-TW" },
    { name: "自由時報", url: "https://news.ltn.com.tw/rss/all.xml", language: "zh-TW" },
  ],
  us: [
    { name: "NPR News", url: "https://feeds.npr.org/1001/rss.xml", language: "en" },
    { name: "AP News", url: "https://rsshub.app/apnews/topics/apf-topnews", language: "en" },
    { name: "CNN", url: "https://rss.cnn.com/rss/edition.rss", language: "en" },
  ],
  eu: [
    { name: "Euronews", url: "https://www.euronews.com/rss", language: "en" },
    { name: "DW News", url: "https://rss.dw.com/rdf/rss-en-all", language: "en" },
    { name: "France 24", url: "https://www.france24.com/en/rss", language: "en" },
  ],
  latam: [
    { name: "Reuters Latin America", url: "https://feeds.reuters.com/reuters/topNews", language: "en" },
    { name: "BBC Mundo", url: "https://feeds.bbci.co.uk/mundo/rss.xml", language: "es" },
  ],
};

export function getFeedsForRegion(region: Region): RSSSource[] {
  return RSS_FEEDS[region] || RSS_FEEDS["global"];
}
