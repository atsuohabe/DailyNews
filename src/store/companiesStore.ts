"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Company, type Article } from "@/lib/types";
import { getMockCompanyArticles } from "@/lib/mockData";

interface CompaniesState {
  companies: Company[];
  articles: Article[];
  addCompany: (company: Omit<Company, "id" | "isActive">) => void;
  removeCompany: (id: string) => void;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  fetchArticles: () => void;
  markAsRead: (articleId: string) => void;
  markAllAsRead: () => void;
  getUnreadCount: () => number;
}

export const useCompaniesStore = create<CompaniesState>()(
  persist(
    (set, get) => ({
      companies: [],
      articles: [],
      addCompany: (company) => {
        const newCompany: Company = {
          ...company,
          id: crypto.randomUUID(),
          isActive: true,
        };
        set((state) => {
          const companies = [...state.companies, newCompany];
          const newArticles = getMockCompanyArticles(newCompany.name, newCompany.id);
          return { companies, articles: [...state.articles, ...newArticles] };
        });
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
      fetchArticles: () => {
        const { companies, articles: existing } = get();
        if (companies.length === 0) {
          set({ articles: [] });
          return;
        }
        const allArticles = companies.flatMap((company) =>
          getMockCompanyArticles(company.name, company.id)
        );
        const merged = allArticles.map((article) => {
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
