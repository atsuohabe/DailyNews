import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get("region") || "japan";

  // In production, this would call external news APIs (NewsAPI, etc.)
  // For now, return a structured response indicating the endpoint is ready
  return NextResponse.json({
    region,
    message: "Connect your preferred news API (NewsAPI, GNews, etc.) to fetch real articles",
    articles: [],
    timestamp: new Date().toISOString(),
  });
}
