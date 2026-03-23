"use client";

import { useEffect, useRef } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { useNewsStore } from "@/store/newsStore";
import { usePaidSitesStore } from "@/store/paidSitesStore";
import { useCompaniesStore } from "@/store/companiesStore";

const FREQUENCY_MS: Record<string, number> = {
  hourly: 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  twice: 12 * 60 * 60 * 1000,
  manual: 0,
};

// For demo purposes, use shorter intervals
const DEMO_FREQUENCY_MS: Record<string, number> = {
  hourly: 60 * 1000,        // 1 minute
  daily: 5 * 60 * 1000,     // 5 minutes
  twice: 3 * 60 * 1000,     // 3 minutes
  manual: 0,
};

export function useAutoRefresh() {
  const frequency = useSettingsStore((s) => s.updateFrequency);
  const region = useSettingsStore((s) => s.region);
  const fetchNews = useNewsStore((s) => s.fetchArticles);
  const fetchPaid = usePaidSitesStore((s) => s.fetchArticles);
  const fetchCompany = useCompaniesStore((s) => s.fetchArticles);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const ms = DEMO_FREQUENCY_MS[frequency];
    if (!ms) return;

    intervalRef.current = setInterval(() => {
      fetchNews(region);
      fetchPaid();
      fetchCompany();
    }, ms);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [frequency, region, fetchNews, fetchPaid, fetchCompany]);
}
