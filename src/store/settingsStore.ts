"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type AppSettings, type CustomRegion, type Locale, type Region, type UpdateFrequency } from "@/lib/types";
import { ALL_REGIONS, DEFAULT_SETTINGS } from "@/lib/constants";

interface SettingsState extends AppSettings {
  setLocale: (locale: Locale) => void;
  setRegion: (region: Region) => void;
  setEnabledRegions: (regions: Region[]) => void;
  toggleRegion: (region: Region) => void;
  addCustomRegion: (label: string) => void;
  removeCustomRegion: (id: string) => void;
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
        if (next.length === 0) return {};
        const update: Partial<SettingsState> = { enabledRegions: next };
        if (!next.includes(state.region)) {
          update.region = next[0];
        }
        return update;
      }),
      addCustomRegion: (label) => set((state) => {
        const id = `custom-${Date.now()}`;
        const newRegion: CustomRegion = { id, label };
        return {
          customRegions: [...state.customRegions, newRegion],
          enabledRegions: [...state.enabledRegions, id],
        };
      }),
      removeCustomRegion: (id) => set((state) => {
        const nextEnabled = state.enabledRegions.filter((r) => r !== id);
        const update: Partial<SettingsState> = {
          customRegions: state.customRegions.filter((r) => r.id !== id),
          enabledRegions: nextEnabled.length > 0 ? nextEnabled : state.enabledRegions,
        };
        if (state.region === id && nextEnabled.length > 0) {
          update.region = nextEnabled[0];
        }
        return update;
      }),
      setUpdateFrequency: (freq) => set({ updateFrequency: freq }),
      setUpdateTime: (time) => set({ updateTime: time }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
    }),
    {
      name: "dailynews-settings",
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<SettingsState>),
        enabledRegions: (persisted as Partial<SettingsState>)?.enabledRegions ?? ALL_REGIONS,
        customRegions: (persisted as Partial<SettingsState>)?.customRegions ?? [],
      }),
    }
  )
);
