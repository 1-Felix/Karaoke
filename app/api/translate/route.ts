import { NextRequest, NextResponse } from "next/server";
import { translateLyrics, translateTitle } from "@/lib/translation";

interface LyricsLine {
  text: string;
  startTime: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lyrics, title } = body as { lyrics: LyricsLine[]; title?: string };

    if (!lyrics || !Array.isArray(lyrics)) {
      return NextResponse.json({ error: "lyrics array is required" }, { status: 400 });
    }

    const translatedLyrics = await translateLyrics(lyrics);
    
    // Translate title if provided
    let titleTranslation: string | undefined;
    if (title) {
      titleTranslation = await translateTitle(title) ?? undefined;
    }

    return NextResponse.json({ lyrics: translatedLyrics, titleTranslation });
  } catch (error) {
    console.error("Translation API error:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
