export type Region = "japan" | "global" | "taiwan" | "us" | "eu" | "latam";
export type TabId = "general" | "paid" | "companies";
export type UpdateFrequency = "hourly" | "daily" | "twice" | "manual";
export type Locale = "ja" | "en" | "zh-TW" | "es";

export interface Article {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  region: Region;
  isRead: boolean;
  category: TabId;
  imageUrl?: string;
  content?: string;
  originalLanguage?: string;
}

export interface PaidSite {
  id: string;
  name: string;
  url: string;
  username: string;
  password: string;
  isActive: boolean;
  lastFetched?: string;
}

export interface Company {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  lastFetched?: string;
}

export interface AppSettings {
  locale: Locale;
  region: Region;
  updateFrequency: UpdateFrequency;
  updateTime: string;
  notificationsEnabled: boolean;
}
