"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type PaidSite, type Article } from "@/lib/types";
import { mockPaidSiteArticles } from "@/lib/mockData";

interface PaidSitesState {
  sites: PaidSite[];
  articles: Article[];
  addSite: (site: Omit<PaidSite, "id" | "isActive">) => void;
  removeSite: (id: string) => void;
  updateSite: (id: string, updates: Partial<PaidSite>) => void;
  fetchArticles: () => void;
  markAsRead: (articleId: string) => void;
  getUnreadCount: () => number;
}

export const usePaidSitesStore = create<PaidSitesState>()(
  persist(
    (set, get) => ({
      sites: [],
      articles: [],
      addSite: (site) => {
        const newSite: PaidSite = {
          ...site,
          id: crypto.randomUUID(),
          isActive: true,
        };
        set((state) => ({ sites: [...state.sites, newSite] }));
      },
      removeSite: (id) => {
        set((state) => ({
          sites: state.sites.filter((s) => s.id !== id),
        }));
      },
      updateSite: (id, updates) => {
        set((state) => ({
          sites: state.sites.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        }));
      },
      fetchArticles: () => {
        const existing = get().articles;
        const merged = mockPaidSiteArticles.map((article) => {
          const prev = existing.find((a) => a.id === article.id);
          return prev ? { ...article, isRead: prev.isRead } : article;
        });
        set({ articles: merged });
      },
      markAsRead: (articleId) => {
        set((state) => ({
          articles: state.articles.map((a) =>
            a.id === articleId ? { ...a, isRead: true } : a
          ),
        }));
      },
      getUnreadCount: () => {
        return get().articles.filter((a) => !a.isRead).length;
      },
    }),
    { name: "dailynews-paid-sites" }
  )
);
