'use client';

import { signIn, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/lyrics');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900">
      <div className="text-center text-white">
        <h1 className="text-7xl font-bold mb-4">🎤</h1>
        <h2 className="text-5xl font-bold mb-8">Karaoke</h2>
        <p className="text-xl text-gray-300 mb-12">
          Display synced lyrics while your music plays
        </p>
        <button
          onClick={() => signIn('spotify', { callbackUrl: '/lyrics' })}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full text-xl transition-all transform hover:scale-105"
        >
          Login with Spotify
        </button>
      </div>
    </div>
  );
}
