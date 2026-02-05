'use client';

import { signIn, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [haConfigured, setHaConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/lyrics');
    }
  }, [status, router]);

  // Check if HA is configured
  useEffect(() => {
    fetch('/api/ha-players')
      .then(res => res.json())
      .then(data => setHaConfigured(data.configured === true))
      .catch(() => setHaConfigured(false));
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900">
      <div className="text-center text-white max-w-lg px-4">
        <h1 className="text-7xl font-bold mb-4">🎤</h1>
        <h2 className="text-5xl font-bold mb-8">Karaoke</h2>
        <p className="text-xl text-gray-300 mb-12">
          Display synced lyrics while your music plays
        </p>
        
        <div className="space-y-4">
          {/* Spotify option */}
          <button
            onClick={() => signIn('spotify', { callbackUrl: '/lyrics' })}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full text-xl transition-all transform hover:scale-105 flex items-center justify-center gap-3"
          >
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Login with Spotify
          </button>

          {/* Home Assistant option */}
          {haConfigured && (
            <Link
              href="/ha"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-full text-xl transition-all transform hover:scale-105 flex items-center justify-center gap-3"
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2z"/>
              </svg>
              Use Home Assistant
            </Link>
          )}

          {haConfigured === false && (
            <p className="text-gray-500 text-sm mt-4">
              Home Assistant mode available when configured
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
