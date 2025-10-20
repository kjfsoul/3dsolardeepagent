
/**
 * Example: Next.js Integration
 * =============================
 * How to integrate the flight tracker into a Next.js page
 */

'use client'; // For Next.js 13+ App Router

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamic import to avoid SSR issues with Three.js
const Atlas3DTracker = dynamic(
  () => import('@/components/Atlas3DTrackerEnhanced').then(
    (mod) => mod.Atlas3DTrackerEnhanced
  ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">🚀</div>
          <div className="text-xl">Loading Flight Tracker...</div>
        </div>
      </div>
    ),
  }
);

export default function FlightTrackerPage() {
  return (
    <main className="w-full h-screen">
      <Suspense fallback={<LoadingFallback />}>
        <Atlas3DTracker
          autoPlay={true}
          initialSpeed={2}
          initialFollowMode={true}
        />
      </Suspense>
    </main>
  );
}

function LoadingFallback() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-black">
      <div className="text-white text-xl">Loading...</div>
    </div>
  );
}

// Metadata for SEO (if using App Router)
export const metadata = {
  title: '3I/ATLAS Flight Tracker - Immersive 3D Experience',
  description: 'Track the journey of comet 3I/ATLAS through our solar system in real-time 3D.',
  keywords: ['3I/ATLAS', 'comet', 'interstellar', 'space', '3D visualization'],
  openGraph: {
    title: '3I/ATLAS Flight Tracker',
    description: 'Experience the journey of an interstellar visitor',
    images: ['/og-image.png'],
  },
};
