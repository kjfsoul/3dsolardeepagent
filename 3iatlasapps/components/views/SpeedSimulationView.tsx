'use client';

/**
 * Speed Simulation View - View 3
 * Experience 3I/ATLAS's velocity from comet's perspective
 * Camera locked to 3I/ATLAS with motion blur and velocity visualization
 */

import { setFps, withFrameGuard } from '@/components/utils/frame-guard';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface SpeedSimulationViewProps {
  atlasData: any[];
  currentIndex: number;
  isPlaying: boolean;
  speed: number;
  onSpeedChange: (speed: number) => void;
  className?: string;
}

const SpeedSimulationView: React.FC<SpeedSimulationViewProps> = ({
  atlasData,
  currentIndex,
  isPlaying,
  speed,
  onSpeedChange,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    cometMesh: THREE.Mesh;
    glowMesh: THREE.Mesh;
    tailParticles: THREE.Points;
    velocityArrow: THREE.ArrowHelper;
    starField: THREE.Points;
  } | null>(null);

  const [velocity, setVelocity] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const [speedKmh, setSpeedKmh] = useState(0);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // If no data yet, show loading state
    if (atlasData.length === 0) {
      console.log('[SpeedSimulation] No atlas data yet, waiting...');
      return;
    }

    console.log('[SpeedSimulation] Initializing with', atlasData.length, 'data points');

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);

    // Camera positioned close to comet
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.01,
      1000
    );
    camera.position.set(2, 1, 2);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x222222, 0.5);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 2, 100);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Create star field
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 50 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      let z = radius * Math.cos(phi);
      // Avoid ground plane by ensuring stars are away from z=0
      if (Math.abs(z) < 5) {
        z = z > 0 ? 5 : -5;
      }

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = z;

      const intensity = 0.5 + Math.random() * 0.5;
      starColors[i * 3] = intensity;
      starColors[i * 3 + 1] = intensity;
      starColors[i * 3 + 2] = intensity + Math.random() * 0.3;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });

    const starField = new THREE.Points(starGeometry, starMaterial);
    camera.add(starField); // Attach to camera

    // 3I/ATLAS comet
    const cometGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const cometMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff88
    });
    const cometMesh = new THREE.Mesh(cometGeometry, cometMaterial);
    scene.add(cometMesh);

    // Comet glow
    const glowGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glowMesh);

    // Particle tail
    const tailGeometry = new THREE.BufferGeometry();
    const tailCount = 1000;
    const tailPositions = new Float32Array(tailCount * 3);
    const tailColors = new Float32Array(tailCount * 3);

    for (let i = 0; i < tailCount; i++) {
      const distance = Math.random() * 2;
      const spread = Math.random() * 0.2;
      
      tailPositions[i * 3] = -distance + (Math.random() - 0.5) * spread;
      tailPositions[i * 3 + 1] = (Math.random() - 0.5) * spread;
      tailPositions[i * 3 + 2] = (Math.random() - 0.5) * spread;

      const intensity = 1 - (distance / 2);
      tailColors[i * 3] = 0;
      tailColors[i * 3 + 1] = intensity;
      tailColors[i * 3 + 2] = intensity * 0.5;
    }

    tailGeometry.setAttribute('position', new THREE.BufferAttribute(tailPositions, 3));
    tailGeometry.setAttribute('color', new THREE.BufferAttribute(tailColors, 3));

    const tailMaterial = new THREE.PointsMaterial({
      size: 0.02,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const tailParticles = new THREE.Points(tailGeometry, tailMaterial);
    scene.add(tailParticles);

    // Velocity arrow
    const velocityArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, 0),
      1,
      0x00ff00,
      0.1,
      0.05
    );
    scene.add(velocityArrow);

    // OrbitControls for camera rotation around comet
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minDistance = 0.5;
    controls.maxDistance = 10;
    controls.minPolarAngle = Math.PI / 4; // Prevent looking too far up
    controls.maxPolarAngle = (3 * Math.PI) / 4; // Prevent looking too far down
    controls.target.set(0, 0, 0);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      cometMesh,
      glowMesh,
      tailParticles,
      velocityArrow,
      starField
    };

    // Animation loop
    const animateCore = () => {
      requestAnimationFrame(animate);

      if (sceneRef.current) {
        const { scene, camera, renderer, controls, cometMesh, glowMesh, tailParticles, velocityArrow, starField } = sceneRef.current;

        // Update comet position
        if (atlasData[currentIndex] && atlasData[currentIndex].position) {
          const pos = atlasData[currentIndex].position;
          
          // Validate position values to prevent NaN
          if (isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z)) {
            console.warn('[SpeedSimulation] Invalid position data at index', currentIndex, pos);
            return;
          }
          
          cometMesh.position.set(pos.x, pos.z, -pos.y);
          glowMesh.position.copy(cometMesh.position);

          // Update velocity
          if (atlasData[currentIndex].velocity) {
            const vel = atlasData[currentIndex].velocity;
            
            // Validate velocity values to prevent NaN
            if (isNaN(vel.vx) || isNaN(vel.vy) || isNaN(vel.vz)) {
              console.warn('[SpeedSimulation] Invalid velocity data at index', currentIndex, vel);
              return;
            }
            
            const velocityVector = new THREE.Vector3(vel.vx, vel.vz, -vel.vy);
            const speed = velocityVector.length();
            
            setVelocity({ x: vel.vx, y: vel.vy, z: vel.vz });
            setSpeedKmh(speed * 1.731 * 3600); // Convert AU/day to km/h

            // Update velocity arrow
            velocityArrow.setDirection(velocityVector.normalize());
            velocityArrow.setLength(speed * 2, speed * 0.1, speed * 0.05);
            velocityArrow.position.copy(cometMesh.position);

            // Update tail direction
            const tailPositions = (tailParticles.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
            for (let i = 0; i < tailPositions.length; i += 3) {
              const distance = Math.sqrt(tailPositions[i] ** 2 + tailPositions[i + 1] ** 2 + tailPositions[i + 2] ** 2);
              const direction = velocityVector.clone().normalize().multiplyScalar(-distance);
              const tailPos = cometMesh.position.clone().add(direction);
              
              // ADDED: Bounds checking to prevent off-screen particles
              if (tailPos.length() > 100) continue;
              
              tailPositions[i] = tailPos.x;
              tailPositions[i + 1] = tailPos.y;
              tailPositions[i + 2] = tailPos.z;
            }
            (tailParticles.geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true;
          }
        }

        // Update controls
        controls.update();
        renderer.render(scene, camera);
      }
    };

    let last = performance.now();
    const animate = withFrameGuard(() => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      if (dt > 0) setFps(1000 / dt);
      animateCore();
    });

    animate();

    // Cleanup
    return () => {
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      controls.dispose();
    };
  }, [atlasData, currentIndex, speed]);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    onSpeedChange(newSpeed);
  }, [onSpeedChange]);

  return (
    <div
      data-testid="speed-simulation-view"
      className={`relative w-full h-full ${className}`}
    >
      {atlasData.length === 0 ? (
        <div className="flex items-center justify-center h-full bg-black">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4" />
            <p className="text-lg">Loading Speed Simulation...</p>
            <p className="text-sm text-white/60 mt-2">
              Waiting for orbital data
            </p>
          </div>
        </div>
      ) : (
        <>
          <div ref={containerRef} className="w-full h-full" />

          {/* Speed Controls Overlay */}
          <div className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-2">Speed Simulation</h3>
            <div className="space-y-2">
              <div className="text-sm">
                <div>
                  Velocity: {velocity.x.toFixed(3)}, {velocity.y.toFixed(3)},{" "}
                  {velocity.z.toFixed(3)} AU/day
                </div>
                <div>Speed: {speedKmh.toFixed(0)} km/h</div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm">Simulation Speed:</label>
                <input
                  type="range"
                  min="0.1"
                  max="50"
                  step="0.1"
                  value={speed}
                  onChange={(e) => handleSpeedChange(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm w-12">{speed.toFixed(1)}x</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="absolute bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg max-w-sm">
            <h4 className="font-bold mb-2">Speed Simulation Controls</h4>
            <div className="text-sm space-y-1">
              <div>• Drag to rotate camera around 3I/ATLAS</div>
              <div>• Scroll to zoom in/out</div>
              <div>• Green arrow shows velocity direction</div>
              <div>• Particle tail shows motion path</div>
              <div>• Star field rotates for motion effect</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SpeedSimulationView;
