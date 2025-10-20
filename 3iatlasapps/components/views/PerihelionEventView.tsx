'use client';

/**
 * Perihelion Event View - 3I/ATLAS Closest Solar Approach
 * Time-lapse around Oct 28-29, 2025
 * Enhanced solar corona effects around Sun
 * Comet tail intensification visualization
 * Heat/radiation particle effects
 * Multiple camera angles (Sun POV, comet POV, side view)
 * Speed increase visualization with motion blur
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  fetchSolarSystemData, 
  SOLAR_SYSTEM_OBJECTS, 
  type SolarSystemObjectKey 
} from '@/lib/solar-system-data';

interface PerihelionEventViewProps {
  className?: string;
  onPerihelionReached?: (date: string) => void;
  initialCameraAngle?: 'sun' | 'comet' | 'side' | 'top';
  autoPlay?: boolean;
}

type CameraAngle = 'sun' | 'comet' | 'side' | 'top';

const PerihelionEventView: React.FC<PerihelionEventViewProps> = ({
  className = '',
  onPerihelionReached,
  initialCameraAngle = 'side',
  autoPlay = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    objects: Map<string, THREE.Object3D>;
    particles: THREE.Points;
    coronaParticles: THREE.Points;
    radiationParticles: THREE.Points;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [solarSystemData, setSolarSystemData] = useState<Record<string, any[]>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState(10);
  const [cameraAngle, setCameraAngle] = useState<CameraAngle>(initialCameraAngle);
  const [showCorona, setShowCorona] = useState(true);
  const [showRadiation, setShowRadiation] = useState(true);
  const [showTail, setShowTail] = useState(true);
  const [perihelionReached, setPerihelionReached] = useState(false);
  const [intensity, setIntensity] = useState(0);

  // Perihelion date range: October 28-29, 2025
  const START_DATE = '2025-10-25';
  const END_DATE = '2025-11-02';
  const PERIHELION_DATE = '2025-10-29';
  
  // Animation refs
  const animationIdRef = useRef<number | undefined>(undefined);
  const isPlayingRef = useRef(isPlaying);
  const speedRef = useRef(speed);
  const currentIndexRef = useRef(currentIndex);

  // Performance monitoring
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Load solar system data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        console.log('[PerihelionEvent] Loading perihelion data...');
        
        const objectsToLoad: SolarSystemObjectKey[] = [
          'atlas',
          'mercury',
          'venus',
          'earth',
          'mars',
          'jupiter',
          'saturn',
        ];

        const data = await fetchSolarSystemData(
          objectsToLoad,
          START_DATE,
          END_DATE,
          '6h' // Higher frequency for perihelion event
        );

        if (Object.keys(data).length === 0) {
          throw new Error('No data received from solar system data source');
        }
        
        setSolarSystemData(data);
        setLoading(false);
        console.log(`[PerihelionEvent] Loaded ${Object.keys(data).length} objects for perihelion event`);
      } catch (err) {
        console.error('[PerihelionEvent] Load failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || loading || error || Object.keys(solarSystemData).length === 0) {
      return;
    }

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.01,
      1000
    );
    
    // Set initial camera position based on angle
    switch (cameraAngle) {
      case 'sun':
        camera.position.set(0, 2, 5);
        break;
      case 'comet':
        camera.position.set(5, 3, 5);
        break;
      case 'side':
        camera.position.set(15, 5, 0);
        break;
      case 'top':
        camera.position.set(0, 20, 0);
        break;
    }
    
    camera.lookAt(0, 0, 0);

    // Renderer setup with motion blur support
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);

    // Enhanced lighting for perihelion
    const ambientLight = new THREE.AmbientLight(0x222266, 0.5);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 5, 50);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Enhanced Sun with multiple layers
    const sunGeo = new THREE.SphereGeometry(0.4, 64, 64);
    const sunMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xffaa00,
      emissiveIntensity: 1.0,
      metalness: 0.2,
      roughness: 0.1,
    });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.name = 'sun';
    scene.add(sun);

    // Dynamic corona effect
    const coronaGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide,
    });
    const corona = new THREE.Mesh(coronaGeo, coronaMat);
    corona.name = 'sunCorona';
    scene.add(corona);

    // Outer corona
    const outerCoronaGeo = new THREE.SphereGeometry(2.0, 32, 32);
    const outerCoronaMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
    });
    const outerCorona = new THREE.Mesh(outerCoronaGeo, outerCoronaMat);
    outerCorona.name = 'outerCorona';
    scene.add(outerCorona);

    // Solar particle system
    const particleCount = 1000;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const radius = 0.5 + Math.random() * 3;

      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi);

      const velocity = 0.01 + Math.random() * 0.05;
      particleVelocities[i * 3] = velocity * Math.sin(phi) * Math.cos(theta);
      particleVelocities[i * 3 + 1] = velocity * Math.sin(phi) * Math.sin(theta);
      particleVelocities[i * 3 + 2] = velocity * Math.cos(phi);

      const colorChoice = Math.random();
      if (colorChoice < 0.3) {
        particleColors[i * 3] = 1.0;
        particleColors[i * 3 + 1] = 0.8;
        particleColors[i * 3 + 2] = 0.2;
      } else if (colorChoice < 0.7) {
        particleColors[i * 3] = 1.0;
        particleColors[i * 3 + 1] = 0.6;
        particleColors[i * 3 + 2] = 0.1;
      } else {
        particleColors[i * 3] = 1.0;
        particleColors[i * 3 + 1] = 0.4;
        particleColors[i * 3 + 2] = 0.0;
      }
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(particleVelocities, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Radiation particle system
    const radiationCount = 500;
    const radiationGeometry = new THREE.BufferGeometry();
    const radiationPositions = new Float32Array(radiationCount * 3);
    const radiationVelocities = new Float32Array(radiationCount * 3);

    for (let i = 0; i < radiationCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 0.5 + Math.random() * 5;

      radiationPositions[i * 3] = distance * Math.cos(angle);
      radiationPositions[i * 3 + 1] = (Math.random() - 0.5) * 2;
      radiationPositions[i * 3 + 2] = distance * Math.sin(angle);

      const speed = 0.02 + Math.random() * 0.08;
      radiationVelocities[i * 3] = speed * Math.cos(angle);
      radiationVelocities[i * 3 + 1] = (Math.random() - 0.5) * speed * 0.5;
      radiationVelocities[i * 3 + 2] = speed * Math.sin(angle);
    }

    radiationGeometry.setAttribute('position', new THREE.BufferAttribute(radiationPositions, 3));
    radiationGeometry.setAttribute('velocity', new THREE.BufferAttribute(radiationVelocities, 3));

    const radiationMaterial = new THREE.PointsMaterial({
      size: 0.08,
      color: 0x00ffff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    const radiationParticles = new THREE.Points(radiationGeometry, radiationMaterial);
    scene.add(radiationParticles);

    // Corona particles
    const coronaCount = 300;
    const coronaGeometry = new THREE.BufferGeometry();
    const coronaPositions = new Float32Array(coronaCount * 3);

    for (let i = 0; i < coronaCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const radius = 0.6 + Math.random() * 0.8;

      coronaPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      coronaPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      coronaPositions[i * 3 + 2] = radius * Math.cos(phi);
    }

    coronaGeometry.setAttribute('position', new THREE.BufferAttribute(coronaPositions, 3));

    const coronaMaterial = new THREE.PointsMaterial({
      size: 0.12,
      color: 0xffaa00,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });

    const coronaParticlesSystem = new THREE.Points(coronaGeometry, coronaMaterial);
    scene.add(coronaParticlesSystem);

    // Create objects
    const objectMeshes = new Map<string, THREE.Object3D>();

    for (const [key, obj] of Object.entries(SOLAR_SYSTEM_OBJECTS)) {
      if (!solarSystemData[key] || solarSystemData[key].length === 0) continue;

      const isAtlas = key === 'atlas';
      
      const geometry = new THREE.SphereGeometry(obj.size, isAtlas ? 64 : 32, isAtlas ? 64 : 32);
      
      let material: THREE.Material;
      if (isAtlas) {
        material = new THREE.MeshStandardMaterial({
          color: obj.color,
          emissive: obj.color,
          emissiveIntensity: 0.8,
          metalness: 0.4,
          roughness: 0.3,
        });
      } else {
        material = new THREE.MeshStandardMaterial({
          color: obj.color,
          metalness: 0.2,
          roughness: 0.7,
        });
      }
      
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      objectMeshes.set(key, mesh);

      // Enhanced effects for 3I/ATLAS during perihelion
      if (isAtlas) {
        // Intense coma
        const comaGeo = new THREE.SphereGeometry(obj.size * 5, 32, 32);
        const comaMat = new THREE.MeshBasicMaterial({
          color: obj.color,
          transparent: true,
          opacity: 0.6,
        });
        const coma = new THREE.Mesh(comaGeo, comaMat);
        scene.add(coma);
        objectMeshes.set('atlas_coma', coma);

        // Dynamic tail
        const tailGeo = new THREE.ConeGeometry(obj.size, obj.size * 15, 16);
        const tailMat = new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.8,
        });
        const tail = new THREE.Mesh(tailGeo, tailMat);
        scene.add(tail);
        objectMeshes.set('atlas_tail', tail);

        // Ion tail
        const ionTailGeo = new THREE.ConeGeometry(obj.size * 0.3, obj.size * 20, 8);
        const ionTailMat = new THREE.MeshBasicMaterial({
          color: 0xff00ff,
          transparent: true,
          opacity: 0.4,
        });
        const ionTail = new THREE.Mesh(ionTailGeo, ionTailMat);
        scene.add(ionTail);
        objectMeshes.set('atlas_ion_tail', ionTail);
      }

      // Draw orbital path
      if (solarSystemData[key].length > 0) {
        const pathPoints = solarSystemData[key].map(
          (v: any) => new THREE.Vector3(v.position.x, v.position.z, -v.position.y)
        );
        const pathGeo = new THREE.BufferGeometry().setFromPoints(pathPoints);
        const pathMat = new THREE.LineBasicMaterial({
          color: key === 'atlas' ? 0x00ff88 : obj.color,
          opacity: key === 'atlas' ? 0.9 : 0.2,
          transparent: true,
        });
        const path = new THREE.Line(pathGeo, pathMat);
        scene.add(path);
      }
    }

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.minDistance = 0.1;
    controls.maxDistance = 100;

    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      objects: objectMeshes,
      particles,
      coronaParticles: coronaParticlesSystem,
      radiationParticles
    };

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [loading, error, solarSystemData, cameraAngle]);

  // Animation loop
  useEffect(() => {
    if (!sceneRef.current || Object.keys(solarSystemData).length === 0) {
      return;
    }

    const { scene, camera, renderer, objects, particles, coronaParticles, radiationParticles } = sceneRef.current;
    let lastTime = performance.now();
    let localIndex = currentIndexRef.current;

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const now = performance.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      // Update playback
      if (isPlayingRef.current) {
        const atlasData = solarSystemData['atlas'] || [];
        const maxFrames = atlasData.length;
        
        if (maxFrames > 1) {
          localIndex += deltaTime * speedRef.current * 0.5;
          if (localIndex >= maxFrames) {
            localIndex = localIndex % maxFrames;
          }
          
          const intIndex = Math.floor(localIndex);
          if (intIndex !== currentIndexRef.current) {
            currentIndexRef.current = intIndex;
            setCurrentIndex(intIndex);
            
            // Check for perihelion
            const currentDate = atlasData[intIndex]?.date;
            if (currentDate && currentDate.startsWith(PERIHELION_DATE) && !perihelionReached) {
              setPerihelionReached(true);
              onPerihelionReached?.(currentDate);
            }
            
            // Update intensity based on distance
            const currentVector = atlasData[intIndex];
            if (currentVector) {
              const distance = Math.sqrt(
                Math.pow(currentVector.position.x, 2) +
                Math.pow(currentVector.position.y, 2) +
                Math.pow(currentVector.position.z, 2)
              );
              const newIntensity = Math.max(0, Math.min(1, (2 - distance) / 2));
              setIntensity(newIntensity);
            }
          }
        }
      }

      // Update particle systems
      if (showRadiation) {
        const particlePositions = particles.geometry.attributes.position.array as Float32Array;
        const particleVelocities = particles.geometry.attributes.velocity.array as Float32Array;

        for (let i = 0; i < particlePositions.length; i += 3) {
          particlePositions[i] += particleVelocities[i] * deltaTime * 10;
          particlePositions[i + 1] += particleVelocities[i + 1] * deltaTime * 10;
          particlePositions[i + 2] += particleVelocities[i + 2] * deltaTime * 10;

          const distance = Math.sqrt(
            particlePositions[i] ** 2 +
            particlePositions[i + 1] ** 2 +
            particlePositions[i + 2] ** 2
          );

          if (distance > 5) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const radius = 0.5 + Math.random() * 0.5;

            particlePositions[i] = radius * Math.sin(phi) * Math.cos(theta);
            particlePositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
            particlePositions[i + 2] = radius * Math.cos(phi);
          }
        }

        particles.geometry.attributes.position.needsUpdate = true;
      }

      if (showCorona) {
        // Animate corona particles
        const coronaPositions = coronaParticles.geometry.attributes.position.array as Float32Array;
        const time = now * 0.001;

        for (let i = 0; i < coronaPositions.length; i += 3) {
          const offset = Math.sin(time + i * 0.1) * 0.1;
          coronaPositions[i] *= (1 + offset);
          coronaPositions[i + 1] *= (1 + offset);
          coronaPositions[i + 2] *= (1 + offset);
        }

        coronaParticles.geometry.attributes.position.needsUpdate = true;
      }

      // Update object positions
      const entries = Object.entries(solarSystemData);
      for (const [key, vectors] of entries) {
        if (!vectors || vectors.length === 0) continue;

        const mesh = objects.get(key);
        if (!mesh) continue;

        const frameIndex = Math.floor(localIndex);
        const boundedIndex = Math.min(frameIndex, vectors.length - 1);
        const currentVec = vectors[boundedIndex];
        
        if (currentVec) {
          const position = new THREE.Vector3(
            currentVec.position.x,
            currentVec.position.z,
            -currentVec.position.y
          );
          mesh.position.copy(position);

          // Update 3I/ATLAS special effects
          if (key === 'atlas') {
            const coma = objects.get('atlas_coma');
            const tail = objects.get('atlas_tail');
            const ionTail = objects.get('atlas_ion_tail');
            
            if (coma instanceof THREE.Mesh) {
              coma.position.copy(position);
              const comaScale = 1 + intensity * 2;
              coma.scale.setScalar(comaScale);
              (coma.material as THREE.MeshBasicMaterial).opacity = 0.3 + intensity * 0.5;
            }
            
            if (tail && showTail) {
              tail.position.copy(position);
              // Point tail away from sun
              const sunDirection = position.clone().normalize().multiplyScalar(-1);
              tail.lookAt(sunDirection);
              tail.rotateX(Math.PI / 2);
              const tailScale = 1 + intensity * 1.5;
              tail.scale.set(tailScale, tailScale, tailScale);
            }

            if (ionTail instanceof THREE.Mesh && showTail) {
              ionTail.position.copy(position);
              const sunDirection = position.clone().normalize().multiplyScalar(-1);
              ionTail.lookAt(sunDirection);
              ionTail.rotateX(Math.PI / 2);
              const ionTailScale = 1 + intensity * 2;
              ionTail.scale.set(ionTailScale, ionTailScale, ionTailScale);
            }
          }
        }
      }

      // Update camera based on angle
      if (cameraAngle === 'sun' && sceneRef.current) {
        sceneRef.current.controls.target.set(0, 0, 0);
      } else if (cameraAngle === 'comet' && solarSystemData['atlas']) {
        const atlasData = solarSystemData['atlas'];
        const currentVector = atlasData[Math.floor(localIndex)];
        if (currentVector) {
          const atlasPosition = new THREE.Vector3(
            currentVector.position.x,
            currentVector.position.z,
            -currentVector.position.y
          );
          camera.position.copy(atlasPosition);
          camera.position.add(new THREE.Vector3(2, 2, 2));
          camera.lookAt(0, 0, 0);
        }
      }

      // Update controls
      if (sceneRef.current) {
        sceneRef.current.controls.update();
      }

      // Performance monitoring
      frameCountRef.current++;
      if (now - lastTimeRef.current >= 1000) {
        console.log(`[PerihelionEvent] FPS: ${frameCountRef.current}`);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [solarSystemData, onPerihelionReached, showCorona, showRadiation, showTail, cameraAngle, perihelionReached, intensity]);

  // Get current date and progress
  const atlasData = solarSystemData['atlas'] || [];
  const currentDate = atlasData[currentIndex]?.date || '';
  const progress = atlasData.length > 0 ? (currentIndex / atlasData.length) * 100 : 0;

  // Calculate distance metrics
  const currentVector = atlasData[currentIndex];
  let distanceFromSun = 0;
  let velocity = 0;

  if (currentVector) {
    distanceFromSun = Math.sqrt(
      Math.pow(currentVector.position.x, 2) +
      Math.pow(currentVector.position.y, 2) +
      Math.pow(currentVector.position.z, 2)
    );

    if (currentIndex > 0) {
      const prevVector = atlasData[currentIndex - 1];
      const dx = currentVector.position.x - prevVector.position.x;
      const dy = currentVector.position.y - prevVector.position.y;
      const dz = currentVector.position.z - prevVector.position.z;
      const dt = 6; // 6 hours between frames
      velocity = Math.sqrt(dx * dx + dy * dy + dz * dz) / dt;
    }
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500 mb-4" />
          <p className="text-white text-lg">Loading Perihelion Event...</p>
          <p className="text-white/60 text-sm mt-2">
            Fetching data for October 25 - November 2, 2025
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10">
          <div className="text-red-500 text-xl mb-2">⚠ Error</div>
          <p className="text-white text-center max-w-md px-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3D Canvas */}
      <div ref={containerRef} className="w-full h-full bg-black rounded-xl overflow-hidden" />

      {/* Perihelion Event UI Overlay */}
      {!loading && !error && (
        <>
          {/* Perihelion Alert */}
          {perihelionReached && (
            <div className="pointer-events-auto absolute top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg p-4 animate-pulse border-2 border-orange-400">
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">🌟 PERIHELION REACHED! 🌟</div>
                <div className="text-sm">3I/ATLAS at Closest Solar Approach</div>
                <div className="text-xs mt-1">{PERIHELION_DATE}</div>
              </div>
            </div>
          )}

          {/* Event Information */}
          <div className="pointer-events-auto absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-orange-500/30">
            <div className="text-orange-400 font-semibold text-sm">Perihelion Event</div>
            <div className="text-white text-xl font-bold">{currentDate.split('T')[0]}</div>
            <div className="text-white/60 text-xs mt-1">
              October 25 - November 2, 2025
            </div>
            
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white/60">Distance from Sun:</span>
                <span className="text-yellow-400 font-mono">{distanceFromSun.toFixed(3)} AU</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Velocity:</span>
                <span className="text-green-400 font-mono">{(velocity * 24).toFixed(1)} AU/day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Intensity:</span>
                <span className="text-orange-400 font-mono">{(intensity * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Intensity Bar */}
            <div className="mt-3">
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${intensity * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Timeline Controls */}
          <div className="pointer-events-auto absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-transparent p-6 space-y-4">
            {/* Timeline Scrubber */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-white/70 text-xs">
                <span>Perihelion Timeline</span>
                <span>{currentDate.split('T')[0]}</span>
              </div>
              
              <div className="relative">
                {/* Perihelion Marker */}
                <div 
                  className="absolute top-0 flex flex-col items-center"
                  style={{ 
                    left: '50%', 
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="w-4 h-4 bg-orange-500 rounded-full animate-pulse" />
                  <span className="text-xs text-orange-400 mt-1">Perihelion</span>
                </div>
                
                <div className="w-full bg-white/20 rounded-full h-2 mt-6">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-orange-500 to-red-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                <input
                  type="range"
                  min="0"
                  max={atlasData.length - 1}
                  value={currentIndex}
                  onChange={(e) => {
                    const newIndex = Number(e.target.value);
                    setCurrentIndex(newIndex);
                    currentIndexRef.current = newIndex;
                  }}
                  className="absolute top-0 left-0 right-0 opacity-0 cursor-pointer h-8 mt-4"
                  style={{ marginTop: '-1rem' }}
                />
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>

              <button
                onClick={() => {
                  setCurrentIndex(0);
                  currentIndexRef.current = 0;
                  setPerihelionReached(false);
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                aria-label="Reset"
              >
                ⏮ Reset
              </button>

              {/* Speed Controls */}
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <span>Speed:</span>
                <div className="flex gap-1">
                  {[1, 5, 10, 25, 50, 100].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        speed === s
                          ? 'bg-orange-600 text-white'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                      aria-label={`${s}x speed`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Camera Angle Controls */}
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <span>Camera:</span>
                <div className="flex gap-1">
                  {(['sun', 'comet', 'side', 'top'] as CameraAngle[]).map((angle) => (
                    <button
                      key={angle}
                      onClick={() => setCameraAngle(angle)}
                      className={`px-2 py-1 rounded text-xs capitalize transition-colors ${
                        cameraAngle === angle
                          ? 'bg-orange-600 text-white'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                      aria-label={`${angle} camera angle`}
                    >
                      {angle}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Visual Effects Controls */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setShowCorona(!showCorona)}
                className={`px-3 py-2 rounded text-sm transition-colors ${
                  showCorona
                    ? 'bg-orange-600 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                aria-label={showCorona ? 'Hide corona' : 'Show corona'}
              >
                ☀️ Corona
              </button>

              <button
                onClick={() => setShowRadiation(!showRadiation)}
                className={`px-3 py-2 rounded text-sm transition-colors ${
                  showRadiation
                    ? 'bg-orange-600 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                aria-label={showRadiation ? 'Hide radiation' : 'Show radiation'}
              >
                ⚡ Radiation
              </button>

              <button
                onClick={() => setShowTail(!showTail)}
                className={`px-3 py-2 rounded text-sm transition-colors ${
                  showTail
                    ? 'bg-orange-600 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                aria-label={showTail ? 'Hide tail' : 'Show tail'}
              >
                🌠 Tail
              </button>
            </div>

            {/* Frame Information */}
            <div className="text-center text-white/50 text-xs">
              Frame {currentIndex + 1} / {atlasData.length} • Perihelion Event: October 25 - November 2, 2025
            </div>
          </div>

          {/* Instructions Overlay */}
          <div className="pointer-events-auto absolute top-1/2 right-4 transform -translate-y-1/2 bg-black/70 text-white/80 text-sm p-4 rounded-lg max-w-xs backdrop-blur-sm border border-white/10">
            <div className="font-semibold mb-2">Perihelion Event Controls</div>
            <div className="space-y-1 text-xs">
              <div>🖱️ Click + drag to rotate view</div>
              <div>🎯 Scroll to zoom in/out</div>
              <div>📅 Watch for perihelion moment</div>
              <div>📸 Switch camera angles</div>
              <div>🌟 Toggle visual effects</div>
              <div>⚡ Observe radiation surge</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PerihelionEventView;
