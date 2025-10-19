declare module 'genius-lyrics-api' {
  export interface SongOptions {
    apiKey: string;
    title: string;
    artist: string;
    optimizeQuery?: boolean;
  }

  export interface SongData {
    id: number;
    title: string;
    url: string;
    albumArt: string;
  }

  export function getLyrics(options: SongOptions): Promise<string | null>;
  export function getSong(options: SongOptions): Promise<SongData | null>;
}
