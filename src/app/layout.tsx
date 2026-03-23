import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "DailyNews",
  description: "Quick daily news aggregator with multi-language support",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#1e40af",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
