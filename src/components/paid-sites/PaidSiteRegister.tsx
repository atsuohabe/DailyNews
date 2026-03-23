"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { usePaidSitesStore } from "@/store/paidSitesStore";

export default function PaidSiteRegister() {
  const t = useTranslations("paidSites");
  const addSite = usePaidSitesStore((s) => s.addSite);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", username: "", password: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.url) return;
    addSite(form);
    setForm({ name: "", url: "", username: "", password: "" });
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary flex items-center gap-2 text-sm"
      >
        <Plus size={16} />
        {t("addSite")}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t("addSite")}</h3>
        <button type="button" onClick={() => setIsOpen(false)} className="p-1 hover:bg-surface-bright rounded">
          <X size={16} />
        </button>
      </div>
      <div>
        <label className="block text-xs text-text-secondary mb-1">{t("siteName")}</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
          required
        />
      </div>
      <div>
        <label className="block text-xs text-text-secondary mb-1">{t("siteUrl")}</label>
        <input
          type="url"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
          required
        />
      </div>
      <div>
        <label className="block text-xs text-text-secondary mb-1">{t("username")}</label>
        <input
          type="text"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
          autoComplete="off"
        />
      </div>
      <div>
        <label className="block text-xs text-text-secondary mb-1">{t("password")}</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
          autoComplete="new-password"
        />
      </div>
      <p className="text-xs text-text-secondary">{t("loginMaintained")}</p>
      <div className="flex gap-2">
        <button type="submit" className="btn-primary text-sm">{t("save")}</button>
        <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary text-sm">{t("cancel")}</button>
      </div>
    </form>
  );
}
