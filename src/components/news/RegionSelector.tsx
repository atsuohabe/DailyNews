"use client";

import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import { type Region } from "@/lib/types";
import { REGIONS } from "@/lib/constants";

interface RegionSelectorProps {
  value: Region;
  onChange: (region: Region) => void;
}

export default function RegionSelector({ value, onChange }: RegionSelectorProps) {
  const t = useTranslations();

  return (
    <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto">
      <MapPin size={16} className="text-text-secondary flex-shrink-0" />
      <span className="text-sm text-text-secondary flex-shrink-0">{t("regions.label")}:</span>
      <div className="flex gap-1">
        {REGIONS.map((region) => (
          <button
            key={region.value}
            onClick={() => onChange(region.value)}
            className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors ${
              value === region.value
                ? "bg-primary text-white"
                : "bg-surface-bright text-text-secondary hover:bg-surface-dim"
            }`}
          >
            {t(region.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}
