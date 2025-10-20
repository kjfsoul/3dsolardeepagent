'use client';

/**
 * 3I/ATLAS Real-Time 3D Orbital Tracker
 * Visualizes the comet's trajectory through the solar system using Three.js
 * Data sourced from NASA JPL Horizons System (no API key required)
 */

import { type VectorData } from '@/lib/horizons-api';
import { getCached3IAtlasVectors } from '@/lib/horizons-cache';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Atlas3DTrackerProps {
  startDate?: string;
  endDate?: string;
  stepSize?: '1h' | '6h' | '12h' | '1d';
  autoPlay?: boolean;
  playbackSpeed?: number;
  showOrbitalPath?: boolean;
  className?: string;
}

interface Scene3D {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  atlas: THREE.Mesh;
  atlasPath: THREE.Line;
  sun: THREE.Mesh;
  frameId: number | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function Atlas3DTracker({
  startDate,
  endDate,
  stepSize = '6h',
  autoPlay = true,
  playbackSpeed = 1,
  showOrbitalPath = true,
  className = '',
}: Atlas3DTrackerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scene3DRef = useRef<Scene3D | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vectorData, setVectorData] = useState<VectorData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState(playbackSpeed);
  
  // Use refs for animation loop to avoid closure issues
  const isPlayingRef = useRef(isPlaying);
  const speedRef = useRef(speed);
  
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // ========================================================================
  // FETCH DATA FROM HORIZONS
  // ========================================================================

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      // Default date range: October 2025 (perihelion month)
      const start = startDate || '2025-10-01';
      const end = endDate || '2025-10-31';

      try {
        console.log(`[Atlas3D] Fetching vector data from ${start} to ${end}`);
        const vectors = await getCached3IAtlasVectors(start, end, stepSize);

        if (vectors.length === 0) {
          throw new Error('No vector data returned from Horizons API');
        }

        setVectorData(vectors);
        setLoading(false);
        console.log(`[Atlas3D] Loaded ${vectors.length} data points`);
      } catch (err) {
        console.error('[Atlas3D] Failed to fetch data:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load 3I/ATLAS trajectory data'
        );
        setLoading(false);
      }
    }

    fetchData();
  }, [startDate, endDate, stepSize]);

  // ========================================================================
  // INITIALIZE THREE.JS SCENE
  // ========================================================================

  useEffect(() => {
    if (!containerRef.current || loading || error || vectorData.length === 0) {
      return;
    }

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.01,
      1000
    );
    camera.position.set(3, 3, 3);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 2);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Create Sun
    const sunGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);

    // Add Sun glow
    const glowGeometry = new THREE.SphereGeometry(0.15, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.3,
    });
    const sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(sunGlow);

    // Create 3I/ATLAS - make it more visible
    const atlasGeometry = new THREE.SphereGeometry(0.05, 24, 24);
    const atlasMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
    });
    const atlas = new THREE.Mesh(atlasGeometry, atlasMaterial);
    scene.add(atlas);
    
    // Add glow effect to atlas
    const atlasGlowGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const atlasGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3,
    });
    const atlasGlow = new THREE.Mesh(atlasGlowGeometry, atlasGlowMaterial);
    scene.add(atlasGlow);

    // Create orbital path with more visibility
    const pathPoints = vectorData.map(
      (v) => new THREE.Vector3(v.position.x, v.position.z, -v.position.y)
    );
    const pathGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
    const pathMaterial = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      opacity: 0.8,
      transparent: true,
      linewidth: 2,
    });
    const atlasPath = new THREE.Line(pathGeometry, pathMaterial);

    if (showOrbitalPath) {
      scene.add(atlasPath);
    }

    // Add Earth orbit (1.0 AU - published NASA constant)
    const earthOrbitGeometry = new THREE.RingGeometry(0.98, 1.02, 128);
    const earthOrbitMaterial = new THREE.MeshBasicMaterial({
      color: 0x4444ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2,
    });
    const earthOrbit = new THREE.Mesh(earthOrbitGeometry, earthOrbitMaterial);
    earthOrbit.rotation.x = Math.PI / 2;
    scene.add(earthOrbit);

    // Add Earth position (simplified - at 1 AU on Oct 15, 2025)
    const earthGeometry = new THREE.SphereGeometry(0.04, 20, 20);
    const earthMaterial = new THREE.MeshBasicMaterial({ color: 0x2266ff });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.set(1.0, 0, 0); // Simplified position
    scene.add(earth);

    // Add Mars orbit (1.52 AU - published NASA constant)
    const marsOrbitGeometry = new THREE.RingGeometry(1.50, 1.54, 128);
    const marsOrbitMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2,
    });
    const marsOrbit = new THREE.Mesh(marsOrbitGeometry, marsOrbitMaterial);
    marsOrbit.rotation.x = Math.PI / 2;
    scene.add(marsOrbit);

    // Add Mars position
    const marsGeometry = new THREE.SphereGeometry(0.035, 16, 16);
    const marsMaterial = new THREE.MeshBasicMaterial({ color: 0xff6644 });
    const mars = new THREE.Mesh(marsGeometry, marsMaterial);
    mars.position.set(-1.3, 0, 0.7); // Simplified position
    scene.add(mars);

    // Add asteroid belt reference (2.2-3.2 AU - published range)
    const asteroidBeltGeometry = new THREE.RingGeometry(2.2, 3.2, 128, 1);
    const asteroidBeltMaterial = new THREE.MeshBasicMaterial({
      color: 0x888866,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.1,
    });
    const asteroidBelt = new THREE.Mesh(asteroidBeltGeometry, asteroidBeltMaterial);
    asteroidBelt.rotation.x = Math.PI / 2;
    scene.add(asteroidBelt);

    // Add star field background
    const starGeometry = new THREE.BufferGeometry();
    const starVertices = [];
    for (let i = 0; i < 1000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 30 + Math.random() * 20;
      
      starVertices.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Store scene references
    scene3DRef.current = {
      scene,
      camera,
      renderer,
      atlas,
      atlasPath,
      sun,
      frameId: null,
    };

    // Mouse controls with proper state
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    const rotationSpeed = 0.01;
    const zoomSpeed = 0.1;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      // Horizontal rotation (around Y axis)
      const angleX = deltaX * rotationSpeed;
      const rotationMatrixY = new THREE.Matrix4().makeRotationY(angleX);
      camera.position.applyMatrix4(rotationMatrixY);

      // Vertical rotation (around camera's right vector)
      const angleY = -deltaY * rotationSpeed;
      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);
      const right = new THREE.Vector3().crossVectors(camera.up, cameraDirection).normalize();
      const rotationMatrixX = new THREE.Matrix4().makeRotationAxis(right, angleY);
      camera.position.applyMatrix4(rotationMatrixX);

      camera.lookAt(0, 0, 0);
      camera.up.set(0, 1, 0);

      previousMousePosition = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    };

    const onMouseUp = (e: MouseEvent) => {
      isDragging = false;
      e.preventDefault();
    };

    const onMouseLeave = () => {
      isDragging = false;
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mouseleave', onMouseLeave);

    // Mouse wheel zoom
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const zoomDelta = e.deltaY > 0 ? zoomSpeed : -zoomSpeed;
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      
      const newPosition = camera.position.clone().add(direction.multiplyScalar(zoomDelta));
      
      // Prevent getting too close or too far
      const distance = newPosition.length();
      if (distance > 0.5 && distance < 50) {
        camera.position.copy(newPosition);
      }
    };

    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (scene3DRef.current?.frameId) {
        cancelAnimationFrame(scene3DRef.current.frameId);
      }

      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mouseleave', onMouseLeave);
      renderer.domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);

      renderer.dispose();
      sunGeometry.dispose();
      sunMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      atlasGeometry.dispose();
      atlasMaterial.dispose();
      atlasGlowGeometry.dispose();
      atlasGlowMaterial.dispose();
      pathGeometry.dispose();
      pathMaterial.dispose();

      if (containerRef.current && renderer.domElement.parentElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [loading, error, vectorData, showOrbitalPath]);

  // ========================================================================
  // ANIMATION LOOP
  // ========================================================================

  // Use a ref for current index to avoid recreation
  const currentIndexRef = useRef(currentIndex);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    if (!scene3DRef.current || vectorData.length === 0) return;

    const { scene, camera, renderer, atlas } = scene3DRef.current;

    let animationFrameId: number | null = null;
    let lastTime = Date.now();
    let localIndex = currentIndexRef.current;

    function animate() {
      animationFrameId = requestAnimationFrame(animate);

      // Update index based on playback
      if (isPlayingRef.current) {
        const now = Date.now();
        const deltaTime = (now - lastTime) / 1000; // seconds
        lastTime = now;

        // Calculate frames to advance based on speed
        const framesPerSecond = speedRef.current * 2; // 2 frames per second at 1x
        const framesToAdvance = deltaTime * framesPerSecond;
        
        localIndex += framesToAdvance;
        
        if (localIndex >= vectorData.length) {
          localIndex = 0;
        }
        
        const intIndex = Math.floor(localIndex);
        if (intIndex !== currentIndexRef.current) {
          setCurrentIndex(intIndex);
          currentIndexRef.current = intIndex;
        }
      }

      // Always update position based on current local index
      const idx = Math.floor(localIndex);
      const currentVector = vectorData[idx];
      if (currentVector) {
        const pos = new THREE.Vector3(
          currentVector.position.x,
          currentVector.position.z,
          -currentVector.position.y
        );
        atlas.position.copy(pos);
        
        // Update glow
        for (const child of scene.children) {
          if (child instanceof THREE.Mesh && child !== atlas) {
            const material = child.material as THREE.MeshBasicMaterial;
            if (material.color && material.color.getHex() === 0x00ffff && material.transparent && material.opacity === 0.3) {
              child.position.copy(pos);
              break;
            }
          }
        }
      }

      renderer.render(scene, camera);
    }

    animate();

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [vectorData]);

  // ========================================================================
  // RENDER
  // ========================================================================

  const currentVector = vectorData[currentIndex];
  const progress = vectorData.length > 0 ? (currentIndex / vectorData.length) * 100 : 0;

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mb-4" />
          <p className="text-white text-lg">Loading 3I/ATLAS trajectory data...</p>
          <p className="text-white/60 text-sm mt-2">Fetching from NASA Horizons</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10">
          <div className="text-red-500 text-xl mb-2">⚠ Error</div>
          <p className="text-white text-center max-w-md px-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3D Canvas Container */}
      <div ref={containerRef} className="w-full h-full bg-black" />

      {/* Controls Overlay */}
      {!loading && !error && vectorData.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 space-y-4">
          {/* Date Display */}
          <div className="text-center">
            <div className="text-cyan-400 text-2xl font-mono">
              {currentVector?.date.split('T')[0]}
            </div>
            <div className="text-white/60 text-sm">
              {currentVector?.date.split('T')[1]?.substring(0, 8)} UTC
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="bg-cyan-500 h-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => {
                setIsPlaying(!isPlaying);
              }}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors font-semibold"
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>

            <button
              onClick={() => {
                setCurrentIndex(0);
                setIsPlaying(false);
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              ⏮ Reset
            </button>

            <div className="flex items-center gap-2">
              <label className="text-white/80 text-sm">Playback Speed:</label>
              <select
                value={speed}
                onChange={(e) => {
                  const newSpeed = Number(e.target.value);
                  setSpeed(newSpeed);
                }}
                className="px-4 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value={0.25}>0.25x (Slow)</option>
                <option value={0.5}>0.5x</option>
                <option value={1}>1x (Normal)</option>
                <option value={2}>2x</option>
                <option value={5}>5x (Fast)</option>
                <option value={10}>10x (Very Fast)</option>
              </select>
            </div>
          </div>

          {/* Data Info */}
          <div className="text-center text-white/40 text-xs">
            Frame {currentIndex + 1} of {vectorData.length} • Powered by NASA JPL Horizons
          </div>
        </div>
      )}

      {/* Instructions */}
      {!loading && !error && (
        <div className="absolute top-4 right-4 bg-black/70 text-white/80 text-sm p-4 rounded-lg max-w-xs">
          <div className="font-semibold mb-2">Controls:</div>
          <div>• Click + drag to rotate</div>
          <div>• Scroll to zoom in/out</div>
          <div>• Use controls below to play/pause</div>
        </div>
      )}
    </div>
  );
}
