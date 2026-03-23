"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MapPin, Settings2, X, Check } from "lucide-react";
import { type Region } from "@/lib/types";
import { REGIONS } from "@/lib/constants";
import { useSettingsStore } from "@/store/settingsStore";

interface RegionSelectorProps {
  value: Region;
  onChange: (region: Region) => void;
}

export default function RegionSelector({ value, onChange }: RegionSelectorProps) {
  const t = useTranslations();
  const enabledRegions = useSettingsStore((s) => s.enabledRegions);
  const toggleRegion = useSettingsStore((s) => s.toggleRegion);
  const [editing, setEditing] = useState(false);

  const visibleRegions = editing
    ? REGIONS
    : REGIONS.filter((r) => enabledRegions.includes(r.value));

  return (
    <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto">
      <MapPin size={16} className="text-text-secondary flex-shrink-0" />
      <span className="text-sm text-text-secondary flex-shrink-0">{t("regions.label")}:</span>
      <div className="flex gap-1 flex-1">
        {visibleRegions.map((region) => {
          const isEnabled = enabledRegions.includes(region.value);

          if (editing) {
            return (
              <button
                key={region.value}
                onClick={() => toggleRegion(region.value)}
                className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${
                  isEnabled
                    ? "bg-primary text-white"
                    : "bg-surface-bright text-text-secondary opacity-50"
                }`}
              >
                {isEnabled ? <Check size={12} /> : <X size={12} />}
                {t(region.labelKey)}
              </button>
            );
          }

          return (
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
          );
        })}
      </div>
      <button
        onClick={() => setEditing(!editing)}
        className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
          editing
            ? "bg-primary text-white"
            : "hover:bg-surface-bright text-text-secondary"
        }`}
        title={editing ? t("common.confirm") : t("settings.region")}
      >
        <Settings2 size={14} />
      </button>
    </div>
  );
}
