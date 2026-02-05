'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import HANowPlayingDisplay from '@/components/HANowPlayingDisplay';

function HALyricsContent() {
  const searchParams = useSearchParams();
  const defaultPlayer = searchParams.get('player') || undefined;
  
  return <HANowPlayingDisplay defaultPlayer={defaultPlayer} />;
}

export default function HALyricsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <HALyricsContent />
    </Suspense>
  );
}
