
/**
 * Example: Embedded Integration
 * =============================
 * How to embed the flight tracker as part of a larger page
 */

import { Atlas3DTrackerEnhanced } from '@/components/Atlas3DTrackerEnhanced';
import { useState } from 'react';

export function AtlasLandingPage() {
  const [showTracker, setShowTracker] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="h-screen flex items-center justify-center bg-gradient-to-b from-black to-gray-900">
        <div className="text-center px-4">
          <h1 className="text-6xl font-bold mb-4 text-green-400">
            3I/ATLAS
          </h1>
          <p className="text-2xl mb-8 text-gray-300">
            The Third Interstellar Visitor
          </p>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Discovered July 1, 2025, this ancient cosmic wanderer from the
            Milky Way's thick disk is making its closest approach to the Sun.
          </p>
          <button
            onClick={() => setShowTracker(true)}
            className="px-8 py-4 bg-green-600 hover:bg-green-500 rounded-lg text-xl font-semibold transition-colors"
          >
            🚀 Launch Flight Tracker
          </button>
        </div>
      </section>

      {/* Flight Tracker Modal */}
      {showTracker && (
        <div className="fixed inset-0 z-50 bg-black">
          <button
            onClick={() => setShowTracker(false)}
            className="absolute top-4 right-4 z-50 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg"
          >
            Close ✕
          </button>
          <Atlas3DTrackerEnhanced />
        </div>
      )}

      {/* Information Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-8 text-green-400">
            About 3I/ATLAS
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-2xl font-semibold mb-4">Discovery</h3>
              <p className="text-gray-300">
                Discovered on July 1, 2025 by the ATLAS telescope in Chile.
                This is only the third confirmed interstellar object to visit
                our solar system.
              </p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-2xl font-semibold mb-4">Age</h3>
              <p className="text-gray-300">
                Estimated to be over 7 billion years old, potentially the
                oldest object ever directly observed - older than our solar
                system itself.
              </p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-2xl font-semibold mb-4">Perihelion</h3>
              <p className="text-gray-300">
                Reaches closest approach to the Sun on October 29, 2025 at
                1.356 AU, achieving maximum velocity of 68 km/s.
              </p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-2xl font-semibold mb-4">Trajectory</h3>
              <p className="text-gray-300">
                Follows a hyperbolic path (e=6.14), confirming its interstellar
                origin. Will exit our solar system permanently after Jupiter
                approach.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Embedded Tracker Section */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-8 text-center text-green-400">
            Track the Journey
          </h2>
          <div className="h-[600px] rounded-lg overflow-hidden border-2 border-green-600">
            <Atlas3DTrackerEnhanced
              autoPlay={false}
              initialSpeed={1}
              initialFollowMode={false}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
