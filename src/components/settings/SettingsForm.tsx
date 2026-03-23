"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, CheckCircle } from "lucide-react";
import { useSettingsStore } from "@/store/settingsStore";
import { LOCALE_LABELS, REGIONS } from "@/lib/constants";
import { requestNotificationPermission } from "@/lib/notifications";
import Select from "@/components/ui/Select";
import Toggle from "@/components/ui/Toggle";
import type { Locale, Region, UpdateFrequency } from "@/lib/types";

export default function SettingsForm() {
  const t = useTranslations("settings");
  const tRegions = useTranslations("regions");
  const router = useRouter();
  const store = useSettingsStore();
  const [saved, setSaved] = useState(false);

  const [locale, setLocale] = useState<Locale>(store.locale);
  const [region, setRegion] = useState<Region>(store.region);
  const [freq, setFreq] = useState<UpdateFrequency>(store.updateFrequency);
  const [time, setTime] = useState(store.updateTime);
  const [notif, setNotif] = useState(store.notificationsEnabled);

  const handleSave = async () => {
    store.setLocale(locale);
    store.setRegion(region);
    store.setUpdateFrequency(freq);
    store.setUpdateTime(time);
    store.setNotificationsEnabled(notif);

    if (notif) {
      await requestNotificationPermission();
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const langOptions = Object.entries(LOCALE_LABELS).map(([code, label]) => ({
    value: code,
    label,
  }));

  const regionOptions = REGIONS.map((r) => ({
    value: r.value,
    label: tRegions(r.labelKey.split(".")[1]),
  }));

  const freqOptions = [
    { value: "hourly", label: t("frequency.hourly") },
    { value: "daily", label: t("frequency.daily") },
    { value: "twice", label: t("frequency.twice") },
    { value: "manual", label: t("frequency.manual") },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-surface-bright transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">{t("title")}</h1>
      </div>

      <div className="space-y-5">
        <Select
          label={t("language")}
          value={locale}
          onChange={(v) => setLocale(v as Locale)}
          options={langOptions}
        />

        <Select
          label={t("region")}
          value={region}
          onChange={(v) => setRegion(v as Region)}
          options={regionOptions}
        />

        <Select
          label={t("updateFrequency")}
          value={freq}
          onChange={(v) => setFreq(v as UpdateFrequency)}
          options={freqOptions}
        />

        {freq !== "manual" && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t("updateTime")}
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary-light"
            />
          </div>
        )}

        <div className="pt-2">
          <h3 className="text-sm font-medium text-text-secondary mb-2">
            {t("notifications")}
          </h3>
          <Toggle
            enabled={notif}
            onChange={setNotif}
            label={t("enableNotifications")}
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {saved ? (
          <>
            <CheckCircle size={18} />
            {t("saved")}
          </>
        ) : (
          <>
            <Save size={18} />
            {t("title")}
          </>
        )}
      </button>
    </div>
  );
}
