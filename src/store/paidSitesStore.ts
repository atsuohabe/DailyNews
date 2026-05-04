"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type PaidSite, type Article } from "@/lib/types";

interface PaidSitesState {
  sites: PaidSite[];
  articles: Article[];
  isLoading: boolean;
  addSite: (site: Omit<PaidSite, "id" | "isActive">) => void;
  removeSite: (id: string) => void;
  updateSite: (id: string, updates: Partial<PaidSite>) => void;
  fetchArticles: () => Promise<void>;
  markAsRead: (articleId: string) => void;
  markAllAsRead: () => void;
  getUnreadCount: () => number;
}

export const usePaidSitesStore = create<PaidSitesState>()(
  persist(
    (set, get) => ({
      sites: [],
      articles: [],
      isLoading: false,
      addSite: (site) => {
        const newSite: PaidSite = {
          ...site,
          id: crypto.randomUUID(),
          isActive: true,
        };
        set((state) => ({ sites: [...state.sites, newSite] }));
        setTimeout(() => get().fetchArticles(), 100);
      },
      removeSite: (id) => {
        set((state) => ({
          sites: state.sites.filter((s) => s.id !== id),
          articles: state.articles.filter((a) => !a.id.includes(id)),
        }));
      },
      updateSite: (id, updates) => {
        set((state) => ({
          sites: state.sites.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        }));
      },
      fetchArticles: async () => {
        const { sites, articles: existing } = get();
        if (sites.length === 0) {
          set({ articles: [] });
          return;
        }

        set({ isLoading: true });

        try {
          const activeSites = sites.filter((s) => s.isActive);
          const res = await fetch("/api/paid-sites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sites: activeSites.map((s) => ({ id: s.id, name: s.name, url: s.url })),
            }),
          });
          const data = await res.json();
          const fetched: Article[] = data.articles || [];

          if (fetched.length > 0) {
            const merged = fetched.map((article) => {
              const prev = existing.find((a) => a.id === article.id);
              return prev ? { ...article, isRead: prev.isRead } : article;
            });
            set({ articles: merged, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch {
          set({ isLoading: false });
        }
      },
      markAsRead: (articleId) => {
        set((state) => ({
          articles: state.articles.map((a) =>
            a.id === articleId ? { ...a, isRead: true } : a
          ),
        }));
      },
      markAllAsRead: () => {
        set((state) => ({
          articles: state.articles.map((a) => ({ ...a, isRead: true })),
        }));
      },
      getUnreadCount: () => {
        return get().articles.filter((a) => !a.isRead).length;
      },
    }),
    { name: "dailynews-paid-sites" }
  )
);
