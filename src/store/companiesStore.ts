"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Company, type Article } from "@/lib/types";
import { mockCompanyArticles } from "@/lib/mockData";

interface CompaniesState {
  companies: Company[];
  articles: Article[];
  addCompany: (company: Omit<Company, "id" | "isActive">) => void;
  removeCompany: (id: string) => void;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  fetchArticles: () => void;
  markAsRead: (articleId: string) => void;
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
        set((state) => ({ companies: [...state.companies, newCompany] }));
      },
      removeCompany: (id) => {
        set((state) => ({
          companies: state.companies.filter((c) => c.id !== id),
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
        const existing = get().articles;
        const merged = mockCompanyArticles.map((article) => {
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
    { name: "dailynews-companies" }
  )
);
