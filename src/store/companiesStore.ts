"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Company, type Article } from "@/lib/types";

interface CompaniesState {
  companies: Company[];
  articles: Article[];
  isLoading: boolean;
  addCompany: (company: Omit<Company, "id" | "isActive">) => void;
  removeCompany: (id: string) => void;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  fetchArticles: () => Promise<void>;
  markAsRead: (articleId: string) => void;
  markAllAsRead: () => void;
  getUnreadCount: () => number;
}

export const useCompaniesStore = create<CompaniesState>()(
  persist(
    (set, get) => ({
      companies: [],
      articles: [],
      isLoading: false,
      addCompany: (company) => {
        const newCompany: Company = {
          ...company,
          id: crypto.randomUUID(),
          isActive: true,
        };
        set((state) => ({ companies: [...state.companies, newCompany] }));
        setTimeout(() => get().fetchArticles(), 100);
      },
      removeCompany: (id) => {
        set((state) => ({
          companies: state.companies.filter((c) => c.id !== id),
          articles: state.articles.filter((a) => !a.id.includes(id)),
        }));
      },
      updateCompany: (id, updates) => {
        set((state) => ({
          companies: state.companies.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },
      fetchArticles: async () => {
        const { companies, articles: existing } = get();
        if (companies.length === 0) {
          set({ articles: [] });
          return;
        }

        set({ isLoading: true });

        try {
          const activeCompanies = companies.filter((c) => c.isActive);
          const res = await fetch("/api/companies", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              companies: activeCompanies.map((c) => ({
                id: c.id,
                name: c.name,
                url: c.url,
              })),
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
    { name: "dailynews-companies" }
  )
);
