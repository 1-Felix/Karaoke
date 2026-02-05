'use client';

import { useSearchParams } from 'next/navigation';
import HANowPlayingDisplay from '@/components/HANowPlayingDisplay';

export default function HALyricsPage() {
  const searchParams = useSearchParams();
  const defaultPlayer = searchParams.get('player') || undefined;
  
  return <HANowPlayingDisplay defaultPlayer={defaultPlayer} />;
}
