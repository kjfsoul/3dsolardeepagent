"use client";

import Atlas3DTrackerEnhanced from "@/components/Atlas3DTrackerEnhanced";

// Direct import - no more nested dynamic imports causing CSR bailout
export default function ClientOnly3DTracker() {
  return (
    <div className="relative w-full h-full">
      <Atlas3DTrackerEnhanced />
    </div>
  );
}
