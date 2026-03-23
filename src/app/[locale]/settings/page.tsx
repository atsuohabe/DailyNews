"use client";

import Header from "@/components/layout/Header";
import SettingsForm from "@/components/settings/SettingsForm";

export default function SettingsPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <SettingsForm />
    </div>
  );
}
