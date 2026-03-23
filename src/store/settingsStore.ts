"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type AppSettings, type Locale, type Region, type UpdateFrequency } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/constants";

interface SettingsState extends AppSettings {
  setLocale: (locale: Locale) => void;
  setRegion: (region: Region) => void;
  setEnabledRegions: (regions: Region[]) => void;
  toggleRegion: (region: Region) => void;
  setUpdateFrequency: (freq: UpdateFrequency) => void;
  setUpdateTime: (time: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      setLocale: (locale) => set({ locale }),
      setRegion: (region) => set({ region }),
      setEnabledRegions: (regions) => set({ enabledRegions: regions }),
      toggleRegion: (region) => set((state) => {
        const current = state.enabledRegions;
        const next = current.includes(region)
          ? current.filter((r) => r !== region)
          : [...current, region];
        // Ensure at least one region remains enabled
        if (next.length === 0) return {};
        // If the active region was disabled, switch to the first enabled one
        const update: Partial<SettingsState> = { enabledRegions: next };
        if (!next.includes(state.region)) {
          update.region = next[0];
        }
        return update;
      }),
      setUpdateFrequency: (freq) => set({ updateFrequency: freq }),
      setUpdateTime: (time) => set({ updateTime: time }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
    }),
    { name: "dailynews-settings" }
  )
);
