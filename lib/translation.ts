/**
 * Translation utility using MyMemory API
 * Free tier: 1000 requests/day
 * Supports: Japanese (kanji, hiragana, katakana, romaji), Chinese, Korean, etc.
 */

const MYMEMORY_API_URL = "https://api.mymemory.translated.net/get";

// Cache translations to avoid repeated API calls
const translationCache = new Map<string, string>();

/**
 * Detects if text contains CJK (Chinese, Japanese, Korean) characters
 */
function containsCJK(text: string): boolean {
  // Matches: Hiragana, Katakana, CJK Unified Ideographs, Hangul
  const cjkPattern = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/;
  return cjkPattern.test(text);
}

/**
 * Detects if text is primarily in English or German
 * Uses a simple heuristic: if text only contains Latin characters, numbers,
 * and common punctuation, try to detect language
 */
function isEnglishOrGerman(text: string): boolean {
  // Check if text contains CJK - if so, it's not English/German
  if (containsCJK(text)) {
    return false;
  }

  // Common German words to detect German text
  const germanIndicators =
    /\b(und|der|die|das|ist|ich|ein|eine|nicht|sie|es|wir|auf|für|mit|auch|aber|oder|wenn|noch|wie|ihre?|dein|mein|sein|haben|werden|kann|sind)\b/i;

  // Common English words to detect English text
  const englishIndicators =
    /\b(the|is|are|was|were|have|has|had|will|would|could|should|can|may|might|must|and|but|or|if|when|where|what|who|how|why|this|that|these|those|with|for|not|you|your|my|his|her|its|our|their|all|each|every|both|few|more|most|other|some|such|than|too|very|just|even|also|back|now|here|there|where|then|once|before|after|again|further|always|often|usually|sometimes|never|already|still|yet|soon|finally|again|only|really|probably|perhaps|maybe|well|just|really|actually|basically|certainly|definitely|maybe|possibly|probably)\b/i;

  // If text has German indicators, it's German
  if (germanIndicators.test(text)) {
    return true;
  }

  // If text has English indicators, it's English
  if (englishIndicators.test(text)) {
    return true;
  }

  // For romanized Japanese (romaji), look for patterns that are NOT typically English
  // Common romaji patterns that suggest Japanese
  const romajiPatterns =
    /\b(wa|wo|ga|no|ni|de|to|ka|mo|yo|ne|na|ra|ta|da|sa|za|ha|ba|pa|ma|ya|la|desu|masu|nai|tai|iru|eru|aru|suru|kuru|tte|kkiri|kke|dayo|nano|nda|jan|chan|kun|san|sama|sensei|senpai|dono|tachi|gata|boku|watashi|atashi|ore|omae|kimi|anata|koko|soko|asoko|doko|nani|naze|doushite|itsu|dou|donna|kono|sono|ano|dono|kore|sore|are|dore|minna|hitori|futari|hito|mono|koto|toki|mae|ato|naka|soto|ue|shita|migi|hidari|totemo|sugoi|kawaii|ureshii|kanashii|kowai|tanoshii|oishii|samui|atsui|hayai|osoi|chiisai|ookii|ii|warui|nee|saa|maa|aa|ee|oo|un|hai|iie|etto|ano|chotto|yappari|tabun|kitto|zettai|hontou|majide)\b/i;

  if (romajiPatterns.test(text)) {
    return false; // It's likely romaji, needs translation
  }

  return false; // Default: translate unknown text
}

/**
 * Detects the source language for translation
 * Returns 'ja' for Japanese, 'auto' for auto-detect
 */
function detectSourceLang(text: string): string {
  if (containsCJK(text)) {
    // Check for Korean-specific characters
    if (/[\uAC00-\uD7AF]/.test(text)) {
      return "ko";
    }
    // Default to Japanese for CJK (most common for lyrics)
    return "ja";
  }
  // Let MyMemory auto-detect for romaji and other cases
  return "auto";
}

/**
 * Translate a single line of text using MyMemory API
 */
export async function translateText(
  text: string,
  sourceLang: string = "auto"
): Promise<string | null> {
  if (!text.trim()) {
    return null;
  }

  // Check cache first
  const cacheKey = `${sourceLang}:${text}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    const langPair = sourceLang === "auto" ? "autodetect|en" : `${sourceLang}|en`;
    const params = new URLSearchParams({
      q: text,
      langpair: langPair,
    });

    const response = await fetch(`${MYMEMORY_API_URL}?${params.toString()}`);

    if (!response.ok) {
      console.error("Translation API error:", response.status);
      return null;
    }

    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translation = data.responseData.translatedText;

      // Don't return if translation is same as original (means it was already English)
      if (translation.toLowerCase() === text.toLowerCase()) {
        return null;
      }

      // Cache the result
      translationCache.set(cacheKey, translation);
      return translation;
    }

    return null;
  } catch (error) {
    console.error("Translation error:", error);
    return null;
  }
}

/**
 * Check if a lyric line needs translation
 */
export function needsTranslation(text: string): boolean {
  if (!text.trim()) {
    return false;
  }
  return !isEnglishOrGerman(text);
}

/**
 * Translate lyrics that need translation
 */
export async function translateLyrics(
  lyrics: Array<{ text: string; startTime: number }>
): Promise<Array<{ text: string; startTime: number; translation?: string }>> {
  const results = await Promise.all(
    lyrics.map(async (line) => {
      if (needsTranslation(line.text)) {
        const sourceLang = detectSourceLang(line.text);
        const translation = await translateText(line.text, sourceLang);
        return { ...line, translation: translation ?? undefined };
      }
      return line;
    })
  );

  return results;
}

/**
 * Translate a song title if it needs translation (not English/German)
 */
export async function translateTitle(title: string): Promise<string | null> {
  if (!title.trim() || !needsTranslation(title)) {
    return null;
  }
  
  const sourceLang = detectSourceLang(title);
  return translateText(title, sourceLang);
}
