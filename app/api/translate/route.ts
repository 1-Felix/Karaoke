import { NextRequest, NextResponse } from "next/server";
import { translateLyrics, translateTitle } from "@/lib/translation";
import { fetchOfficialTranslation, mergeWithTranslations, LyricsLine } from "@/lib/lyrics";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lyrics, title, artist } = body as { 
      lyrics: LyricsLine[]; 
      title?: string;
      artist?: string;
    };

    if (!lyrics || !Array.isArray(lyrics)) {
      return NextResponse.json({ error: "lyrics array is required" }, { status: 400 });
    }

    let translatedLyrics: LyricsLine[] = lyrics;
    let translationSource: "official" | "auto" | "none" = "none";

    // 1. Try to fetch official English translation from LRCLIB
    if (title && artist) {
      const officialTranslation = await fetchOfficialTranslation(title, artist);
      if (officialTranslation && officialTranslation.length > 0) {
        translatedLyrics = mergeWithTranslations(lyrics, officialTranslation);
        translationSource = "official";
        console.log("✓ Using official LRCLIB translation");
      }
    }

    // 2. Fall back to automatic translation if no official found
    if (translationSource === "none") {
      translatedLyrics = await translateLyrics(lyrics);
      // Check if any translations were added
      const hasTranslations = translatedLyrics.some(line => line.translation);
      if (hasTranslations) {
        translationSource = "auto";
        console.log("✓ Using automatic MyMemory translation");
      }
    }
    
    // Translate title if provided
    let titleTranslation: string | undefined;
    if (title) {
      titleTranslation = await translateTitle(title) ?? undefined;
    }

    return NextResponse.json({ 
      lyrics: translatedLyrics, 
      titleTranslation,
      translationSource 
    });
  } catch (error) {
    console.error("Translation API error:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
