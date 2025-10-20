
/**
 * Example: Customized Tracker
 * =============================
 * How to customize the flight tracker with your own settings
 */

import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Import individual components
import { FollowCamera } from '@/components/FollowCamera';
import { Comet3D } from '@/components/Comet3D';
import { Sun, Planet } from '@/components/CelestialBodies';
import { TrajectoryTrail } from '@/components/TrajectoryTrail';
import { Starfield } from '@/components/Starfield';
import { TelemetryHUD } from '@/components/TelemetryHUD';

// Custom configuration
const CUSTOM_CONFIG = {
  // Visual style
  cometColor: '#00ffaa',
  trailColor: '#ff00ff', // Purple trail instead of green
  backgroundColor: '#0a0520', // Dark purple background
  
  // Camera
  initialCameraPosition: [8, 5, 8],
  followOffset: new THREE.Vector3(3, 2, 3),
  
  // Performance
  starCount: 2000, // Fewer stars for better performance
  trajectoryStep: 2, // Sample every 2nd point for smoother lines
};

export function CustomizedAtlasTracker() {
  const [trajectoryData, setTrajectoryData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Load data
  useEffect(() => {
    fetch('/data/trajectory_static.json')
      .then(res => res.json())
      .then(setTrajectoryData);
  }, []);

  if (!trajectoryData) {
    return <div>Loading...</div>;
  }

  // Get current frame
  const currentFrame = trajectoryData.atlas[Math.floor(currentIndex)];
  const cometPosition: [number, number, number] = currentFrame
    ? [currentFrame.position.x, currentFrame.position.z, -currentFrame.position.y]
    : [0, 0, 0];

  return (
    <div className="w-full h-screen relative" style={{ background: CUSTOM_CONFIG.backgroundColor }}>
      {/* Custom styled HUD */}
      <div className="absolute top-4 right-4 bg-purple-900/80 p-4 rounded-lg text-white">
        <h3 className="text-lg font-bold mb-2">Custom Telemetry</h3>
        {currentFrame && (
          <>
            <div>Date: {currentFrame.date}</div>
            <div>Distance: {currentFrame.distance_au?.toFixed(2)} AU</div>
          </>
        )}
      </div>

      {/* Custom controls */}
      <div className="absolute bottom-4 left-4 space-x-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded text-white"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={() => setCurrentIndex(0)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded text-white"
        >
          Reset
        </button>
      </div>

      <Canvas>
        <PerspectiveCamera
          makeDefault
          position={CUSTOM_CONFIG.initialCameraPosition}
          fov={75}
        />

        <ambientLight intensity={0.5} />

        {/* Custom purple starfield */}
        <Starfield count={CUSTOM_CONFIG.starCount} />

        <Sun radius={0.2} />

        {/* Only show Earth and Mars */}
        {trajectoryData.earth.length > 0 && (
          <Planet
            name="Earth"
            trajectoryData={trajectoryData.earth}
            currentIndex={currentIndex / 4}
            radius={0.08}
            color="#00aaff"
          />
        )}

        {trajectoryData.mars.length > 0 && (
          <Planet
            name="Mars"
            trajectoryData={trajectoryData.mars}
            currentIndex={currentIndex / 4}
            radius={0.05}
            color="#ff6666"
          />
        )}

        {/* Custom colored comet */}
        <Comet3D
          position={cometPosition}
          velocity={[0, 0, 0]}
          scale={0.08} // Larger comet
          tailLength={1.2} // Longer tail
        />

        {/* Custom purple trail */}
        <TrajectoryTrail
          trajectoryData={trajectoryData.atlas}
          currentIndex={currentIndex}
          color={CUSTOM_CONFIG.trailColor}
          opacity={0.9}
        />

        <OrbitControls
          enableDamping
          target={new THREE.Vector3(...cometPosition)}
        />
      </Canvas>
    </div>
  );
}

/**
 * Usage:
 * 
 * import { CustomizedAtlasTracker } from './examples/CustomizedTracker';
 * 
 * function App() {
 *   return <CustomizedAtlasTracker />;
 * }
 */
