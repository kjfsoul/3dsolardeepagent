'use client';

import dynamic from "next/dynamic";

// Dynamically import enhanced 3D tracker (client-side only)
const Atlas3DTrackerEnhanced = dynamic(() => import('./Atlas3DTrackerEnhanced'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] bg-black rounded-xl">
      <div className="animate-pulse text-green-400 text-lg">Loading Solar System...</div>
    </div>
  ),
});

interface Atlas3DTrackerWrapperProps {
  startDate?: string;
  endDate?: string;
  stepSize?: '1h' | '6h' | '12h' | '1d';
  autoPlay?: boolean;
  playbackSpeed?: number;
}

export default function Atlas3DTrackerWrapper(props: Atlas3DTrackerWrapperProps) {
  return (
    <div className="relative w-full h-full">
      <Atlas3DTrackerEnhanced {...props} />
      {/* Temporarily disabled PerformanceMonitor to isolate React error */}
      {/* <PerformanceMonitor
        enabled={true}
        className="absolute top-4 right-4 z-10"
      /> */}
    </div>
  );
}
