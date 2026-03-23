"use client";

import { useTranslations } from "next-intl";
import { Trash2, Building2 } from "lucide-react";
import { useCompaniesStore } from "@/store/companiesStore";

export default function CompanyList() {
  const t = useTranslations("companies");
  const companies = useCompaniesStore((s) => s.companies);
  const removeCompany = useCompaniesStore((s) => s.removeCompany);

  if (companies.length === 0) return null;

  return (
    <div className="space-y-2">
      {companies.map((company) => (
        <div key={company.id} className="card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Building2 size={16} />
            </div>
            <div>
              <p className="text-sm font-medium">{company.name}</p>
              <p className="text-xs text-text-secondary">{company.url}</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (confirm(t("confirmDelete"))) {
                removeCompany(company.id);
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
