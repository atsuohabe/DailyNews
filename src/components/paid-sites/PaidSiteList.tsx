"use client";

import { useTranslations } from "next-intl";
import { Trash2, ExternalLink } from "lucide-react";
import { usePaidSitesStore } from "@/store/paidSitesStore";

export default function PaidSiteList() {
  const t = useTranslations("paidSites");
  const sites = usePaidSitesStore((s) => s.sites);
  const removeSite = usePaidSitesStore((s) => s.removeSite);

  if (sites.length === 0) return null;

  return (
    <div className="space-y-2">
      {sites.map((site) => (
        <div key={site.id} className="card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {site.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium">{site.name}</p>
              <p className="text-xs text-text-secondary flex items-center gap-1">
                <ExternalLink size={10} />
                {site.url}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (confirm(t("confirmDelete"))) {
                removeSite(site.id);
              }
            }}
            className="p-2 text-text-secondary hover:text-unread transition-colors rounded-lg hover:bg-surface-bright"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
