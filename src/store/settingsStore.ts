"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type AppSettings, type Locale, type Region, type UpdateFrequency } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/constants";

interface SettingsState extends AppSettings {
  setLocale: (locale: Locale) => void;
  setRegion: (region: Region) => void;
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
      setUpdateFrequency: (freq) => set({ updateFrequency: freq }),
      setUpdateTime: (time) => set({ updateTime: time }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
    }),
    { name: "dailynews-settings" }
  )
);
