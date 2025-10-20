"use client";

/**
 * Enhanced 3I/ATLAS Flight Tracker Demo Page
 * 
 * Showcases the new immersive flight tracker with all enhanced features
 */

import dynamic from "next/dynamic";

// Dynamically import the container to avoid SSR issues
const AtlasFlightTrackerContainer = dynamic(
  () => import("@/components/views/AtlasFlightTrackerContainer"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-400 mx-auto mb-6"></div>
          <p className="text-white text-xl font-semibold">
            Initializing Flight Tracker...
          </p>
        </div>
      </div>
    ),
  }
);

export default function TrackerPage() {
  return (
    <div className="w-full h-screen bg-black">
      <AtlasFlightTrackerContainer />
    </div>
  );
}
