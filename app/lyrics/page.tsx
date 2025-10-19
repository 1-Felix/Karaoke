'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import NowPlayingDisplay from '@/components/NowPlayingDisplay';

export default function LyricsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <NowPlayingDisplay />;
}
