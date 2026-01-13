import { NextRequest, NextResponse } from "next/server";
import { translateLyrics } from "@/lib/translation";

interface LyricsLine {
  text: string;
  startTime: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lyrics } = body as { lyrics: LyricsLine[] };

    if (!lyrics || !Array.isArray(lyrics)) {
      return NextResponse.json({ error: "lyrics array is required" }, { status: 400 });
    }

    const translatedLyrics = await translateLyrics(lyrics);

    return NextResponse.json({ lyrics: translatedLyrics });
  } catch (error) {
    console.error("Translation API error:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
