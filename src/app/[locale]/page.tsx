"use client";

import { useState, useEffect } from "react";
import { type TabId } from "@/lib/types";
import Header from "@/components/layout/Header";
import TabNavigation from "@/components/layout/TabNavigation";
import NewsList from "@/components/news/NewsList";
import PaidSiteArticles from "@/components/paid-sites/PaidSiteArticles";
import CompanyNews from "@/components/companies/CompanyNews";
import { registerServiceWorker } from "@/lib/notifications";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>("general");

  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <Header />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-5xl mx-auto">
        {activeTab === "general" && <NewsList />}
        {activeTab === "paid" && <PaidSiteArticles />}
        {activeTab === "companies" && <CompanyNews />}
      </main>
    </div>
  );
}
