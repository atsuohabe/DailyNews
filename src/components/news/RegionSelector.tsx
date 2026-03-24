"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { MapPin, Plus, X } from "lucide-react";
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
  const customRegions = useSettingsStore((s) => s.customRegions);
  const toggleRegion = useSettingsStore((s) => s.toggleRegion);
  const addCustomRegion = useSettingsStore((s) => s.addCustomRegion);
  const removeCustomRegion = useSettingsStore((s) => s.removeCustomRegion);

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState("");
  const [editing, setEditing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Built-in regions not currently enabled
  const disabledBuiltIn = REGIONS.filter((r) => !enabledRegions.includes(r.value));

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
        setShowCustomInput(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (showCustomInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCustomInput]);

  // Get label for a region (built-in or custom)
  const getRegionLabel = (regionId: Region): string => {
    const builtIn = REGIONS.find((r) => r.value === regionId);
    if (builtIn) return t(builtIn.labelKey);
    const custom = customRegions.find((r) => r.id === regionId);
    return custom?.label || regionId;
  };

  const handleAddBuiltIn = (regionValue: Region) => {
    toggleRegion(regionValue);
    setShowAddMenu(false);
  };

  const handleAddCustom = () => {
    const name = customName.trim();
    if (!name) return;
    addCustomRegion(name);
    setCustomName("");
    setShowCustomInput(false);
    setShowAddMenu(false);
  };

  const handleRemoveRegion = (regionId: Region) => {
    const custom = customRegions.find((r) => r.id === regionId);
    if (custom) {
      removeCustomRegion(regionId);
    } else {
      toggleRegion(regionId);
    }
    // If removed region was selected, switch
    if (value === regionId) {
      const remaining = enabledRegions.filter((r) => r !== regionId);
      if (remaining.length > 0) onChange(remaining[0]);
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 overflow-visible flex-wrap">
      <MapPin size={16} className="text-text-secondary flex-shrink-0" />
      <span className="text-sm text-text-secondary flex-shrink-0">{t("regions.label")}:</span>
      <div className="flex gap-1 flex-1 items-center">
        {enabledRegions.map((regionId) => (
          <div key={regionId} className="relative group flex items-center">
            <button
              onClick={() => {
                if (editing) return;
                onChange(regionId);
              }}
              className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors ${
                value === regionId
                  ? "bg-primary text-white"
                  : "bg-surface-bright text-text-secondary hover:bg-surface-dim"
              } ${editing ? "pr-7" : ""}`}
            >
              {getRegionLabel(regionId)}
            </button>
            {editing && enabledRegions.length > 1 && (
              <button
                onClick={() => handleRemoveRegion(regionId)}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}

        {/* Add / Edit toggle area */}
        <div className="relative flex gap-1" ref={menuRef}>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-2 py-1 text-sm rounded-full whitespace-nowrap transition-colors bg-surface-bright text-text-secondary hover:bg-surface-dim border border-dashed border-border"
              title={t("regions.edit") ?? "エリア編集"}
            >
              {t("regions.edit") ?? "編集"}
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary-dark transition-colors"
                title={t("regions.addRegion") ?? "エリアを追加"}
              >
                <Plus size={16} />
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setShowAddMenu(false);
                  setShowCustomInput(false);
                }}
                className="px-2 py-1 text-xs rounded-full bg-surface-bright text-text-secondary hover:bg-surface-dim"
              >
                {t("common.confirm")}
              </button>
            </>
          )}

          {/* Dropdown menu */}
          {showAddMenu && (
            <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-lg shadow-lg z-50 min-w-[180px] py-1">
              {disabledBuiltIn.length > 0 && (
                <>
                  <div className="px-3 py-1 text-xs text-text-secondary font-medium">
                    {t("regions.builtIn") ?? "プリセット"}
                  </div>
                  {disabledBuiltIn.map((region) => (
                    <button
                      key={region.value}
                      onClick={() => handleAddBuiltIn(region.value)}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-surface-bright transition-colors"
                    >
                      {t(region.labelKey)}
                    </button>
                  ))}
                  <div className="border-t border-border my-1" />
                </>
              )}

              {!showCustomInput ? (
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-surface-bright transition-colors flex items-center gap-2 text-primary"
                >
                  <Plus size={14} />
                  {t("regions.addCustom") ?? "カスタムエリアを追加"}
                </button>
              ) : (
                <div className="px-3 py-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddCustom();
                      if (e.key === "Escape") {
                        setShowCustomInput(false);
                        setCustomName("");
                      }
                    }}
                    placeholder={t("regions.customPlaceholder") ?? "エリア名を入力"}
                    className="w-full px-2 py-1 text-sm bg-surface-bright border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="flex gap-1 mt-1">
                    <button
                      onClick={handleAddCustom}
                      disabled={!customName.trim()}
                      className="px-2 py-1 text-xs rounded bg-primary text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
                    >
                      {t("paidSites.save")}
                    </button>
                    <button
                      onClick={() => {
                        setShowCustomInput(false);
                        setCustomName("");
                      }}
                      className="px-2 py-1 text-xs rounded bg-surface-bright text-text-secondary hover:bg-surface-dim transition-colors"
                    >
                      {t("paidSites.cancel")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
