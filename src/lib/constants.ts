import { type Region, type AppSettings } from "./types";

export const REGIONS: { value: Region; labelKey: string }[] = [
  { value: "japan", labelKey: "regions.japan" },
  { value: "global", labelKey: "regions.global" },
  { value: "taiwan", labelKey: "regions.taiwan" },
  { value: "us", labelKey: "regions.us" },
  { value: "eu", labelKey: "regions.eu" },
  { value: "latam", labelKey: "regions.latam" },
];

export const LOCALE_LABELS: Record<string, string> = {
  ja: "日本語",
  en: "English",
  "zh-TW": "繁體中文",
  es: "Español",
};

export const ALL_REGIONS = REGIONS.map((r) => r.value);

export const DEFAULT_SETTINGS: AppSettings = {
  locale: "ja",
  region: "japan",
  enabledRegions: ALL_REGIONS,
  updateFrequency: "daily",
  updateTime: "07:00",
  notificationsEnabled: true,
};

export const ARTICLES_PER_REGION = 10;
