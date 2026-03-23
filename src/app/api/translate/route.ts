import { NextRequest, NextResponse } from "next/server";

const DEEPL_API_KEY = process.env.DEEPL_API_KEY || "";
const DEEPL_BASE_URL = DEEPL_API_KEY.endsWith(":fx")
  ? "https://api-free.deepl.com/v2/translate"
  : "https://api.deepl.com/v2/translate";

const DEEPL_LANG_MAP: Record<string, string> = {
  ja: "JA",
  en: "EN",
  "zh-TW": "ZH-HANT",
  es: "ES",
};

const MYMEMORY_LANG_MAP: Record<string, string> = {
  ja: "ja",
  en: "en",
  "zh-TW": "zh-TW",
  es: "es",
};

async function translateWithDeepL(
  texts: string[],
  targetLang: string
): Promise<string[]> {
  const target = DEEPL_LANG_MAP[targetLang] || targetLang.toUpperCase();

  const params = new URLSearchParams();
  for (const t of texts) {
    params.append("text", t);
  }
  params.append("target_lang", target);

  const res = await fetch(DEEPL_BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`DeepL API returned ${res.status}`);
  }

  const data = await res.json();
  return (data.translations || []).map(
    (t: { text: string }) => t.text
  );
}

async function translateWithMyMemory(
  text: string,
  targetLang: string
): Promise<string> {
  const target = MYMEMORY_LANG_MAP[targetLang] || targetLang;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${target}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });

  if (!res.ok) throw new Error(`MyMemory API returned ${res.status}`);

  const data = await res.json();
  return data.responseData?.translatedText || text;
}

// Single text translation endpoint (backward compatible)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { text, texts, targetLang } = body;

  if (!targetLang || (!text && !texts)) {
    return NextResponse.json(
      { error: "targetLang and text/texts are required" },
      { status: 400 }
    );
  }

  // Batch mode: translate multiple texts at once
  if (texts && Array.isArray(texts)) {
    try {
      if (DEEPL_API_KEY) {
        const nonEmpty = texts.map((t: string) => t || " ");
        const results = await translateWithDeepL(nonEmpty, targetLang);
        return NextResponse.json({
          translations: results,
          targetLang,
          engine: "deepl",
        });
      }

      // Fallback: MyMemory one by one
      const results = await Promise.all(
        texts.map((t: string) =>
          t ? translateWithMyMemory(t, targetLang).catch(() => t) : ""
        )
      );
      return NextResponse.json({
        translations: results,
        targetLang,
        engine: "mymemory",
      });
    } catch (error) {
      console.error("Batch translation error:", error);
      return NextResponse.json({
        translations: texts,
        targetLang,
        error: "Translation failed",
      });
    }
  }

  // Single text mode
  try {
    let translated: string;

    if (DEEPL_API_KEY) {
      const results = await translateWithDeepL([text], targetLang);
      translated = results[0] || text;
    } else {
      translated = await translateWithMyMemory(text, targetLang);
    }

    return NextResponse.json({
      original: text,
      translated,
      targetLang,
      engine: DEEPL_API_KEY ? "deepl" : "mymemory",
    });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { original: text, translated: text, targetLang, error: "Translation failed" },
      { status: 200 }
    );
  }
}
