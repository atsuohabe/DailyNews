import { NextRequest, NextResponse } from "next/server";

const LANG_MAP: Record<string, string> = {
  ja: "ja",
  en: "en",
  "zh-TW": "zh-TW",
  es: "es",
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { text, targetLang } = body;

  if (!text || !targetLang) {
    return NextResponse.json(
      { error: "text and targetLang are required" },
      { status: 400 }
    );
  }

  const target = LANG_MAP[targetLang] || targetLang;

  try {
    // Use MyMemory free translation API (no API key required)
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${target}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });

    if (!res.ok) {
      throw new Error(`MyMemory API returned ${res.status}`);
    }

    const data = await res.json();
    const translated = data.responseData?.translatedText || text;

    return NextResponse.json({
      original: text,
      translated,
      targetLang,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { original: text, translated: text, targetLang, error: "Translation failed" },
      { status: 200 }
    );
  }
}
