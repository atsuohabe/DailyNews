"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Article, type Region } from "@/lib/types";
import { getMockArticles } from "@/lib/mockData";

interface NewsState {
  articles: Record<string, Article[]>;
  lastUpdated: Record<string, string>;
  isLoading: Record<string, boolean>;
  isBulkRefreshing: boolean;
  fetchArticles: (region: Region) => Promise<void>;
  fetchAllRegions: (regions: Region[]) => Promise<void>;
  markAsRead: (articleId: string) => void;
  markAllAsRead: (region: Region) => void;
  getUnreadCount: (region: Region) => number;
}

export const useNewsStore = create<NewsState>()(
  persist(
    (set, get) => ({
      articles: {},
      lastUpdated: {},
      isLoading: {},
      isBulkRefreshing: false,
      fetchArticles: async (region) => {
        set((state) => ({
          isLoading: { ...state.isLoading, [region]: true },
        }));

        try {
          const res = await fetch(`/api/news?region=${region}`);
          const data = await res.json();
          const fetched: Article[] = data.articles || [];

          // Fall back to mock data if API returns nothing
          const newArticles = fetched.length > 0 ? fetched : getMockArticles(region);

          const existing = get().articles[region] || [];
          const merged = newArticles.map((article) => {
            const prev = existing.find((a) => a.id === article.id);
            return prev ? { ...article, isRead: prev.isRead } : article;
          });

          set((state) => ({
            articles: { ...state.articles, [region]: merged },
            lastUpdated: { ...state.lastUpdated, [region]: new Date().toISOString() },
            isLoading: { ...state.isLoading, [region]: false },
          }));
        } catch {
          // On error, fall back to mock data
          const mockArticles = getMockArticles(region);
          const existing = get().articles[region] || [];
          const merged = mockArticles.map((article) => {
            const prev = existing.find((a) => a.id === article.id);
            return prev ? { ...article, isRead: prev.isRead } : article;
          });

          set((state) => ({
            articles: { ...state.articles, [region]: merged },
            lastUpdated: { ...state.lastUpdated, [region]: new Date().toISOString() },
            isLoading: { ...state.isLoading, [region]: false },
          }));
        }
      },
      fetchAllRegions: async (regions) => {
        set({ isBulkRefreshing: true });
        await Promise.all(regions.map((r) => get().fetchArticles(r)));
        set({ isBulkRefreshing: false });
      },
      markAsRead: (articleId) => {
        set((state) => {
          const newArticles = { ...state.articles };
          for (const region of Object.keys(newArticles)) {
            newArticles[region] = newArticles[region].map((a) =>
              a.id === articleId ? { ...a, isRead: true } : a
            );
          }
          return { articles: newArticles };
        });
      },
      markAllAsRead: (region) => {
        set((state) => ({
          articles: {
            ...state.articles,
            [region]: (state.articles[region] || []).map((a) => ({ ...a, isRead: true })),
          },
        }));
      },
      getUnreadCount: (region) => {
        return (get().articles[region] || []).filter((a) => !a.isRead).length;
      },
    }),
    { name: "dailynews-articles" }
  )
);
