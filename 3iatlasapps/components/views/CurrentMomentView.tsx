'use client';

/**
 * Current Moment Super-Lens - 3I/ATLAS at Oct 8, 2025 Position
 * Freeze-frame at Oct 8, 2025 position
 * Free camera rotation around 3I/ATLAS
 * Zoom controls for detailed inspection
 * Object labels for planets, moons, asteroids
 * Star field background with proper scaling
 * Distance indicators and scale references
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  fetchSolarSystemData, 
  SOLAR_SYSTEM_OBJECTS, 
  type SolarSystemObjectKey 
} from '@/lib/solar-system-data';

interface CurrentMomentViewProps {
  className?: string;
  onObjectSelect?: (objectName: string) => void;
  initialZoom?: number;
  showLabels?: boolean;
}

interface CelestialLabel {
  name: string;
  position: THREE.Vector3;
  type: 'planet' | 'moon' | 'asteroid' | 'comet';
  distance: number;
}

const CurrentMomentView: React.FC<CurrentMomentViewProps> = ({
  className = '',
  onObjectSelect,
  initialZoom = 15,
  showLabels: initialShowLabels = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    objects: Map<string, THREE.Object3D>;
    labels: Map<string, THREE.Sprite>;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [solarSystemData, setSolarSystemData] = useState<Record<string, any[]>>({});
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(initialShowLabels);
  const [zoomLevel, setZoomLevel] = useState(initialZoom);
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  const [distanceScale, setDistanceScale] = useState<'real' | 'logarithmic' | 'compressed'>('real');

  // Target date: October 8, 2025
  const TARGET_DATE = '2025-10-08';
  
  // Animation refs
  const animationIdRef = useRef<number | undefined>(undefined);

  // Performance monitoring
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  // Load solar system data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        console.log('[CurrentMoment] Loading solar system data for Oct 8, 2025...');
        
        const objectsToLoad: SolarSystemObjectKey[] = [
          'atlas',
          'mercury',
          'venus',
          'earth',
          'mars',
          'jupiter',
          'saturn',
          'uranus',
          'neptune',
        ];

        const data = await fetchSolarSystemData(
          objectsToLoad,
          TARGET_DATE,
          TARGET_DATE,
          '1d'
        );

        if (Object.keys(data).length === 0) {
          throw new Error('No data received from solar system data source');
        }
        
        setSolarSystemData(data);
        setLoading(false);
        console.log(`[CurrentMoment] Loaded ${Object.keys(data).length} objects for ${TARGET_DATE}`);
      } catch (err) {
        console.error('[CurrentMoment] Load failed:', err);
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
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.01,
      1000
    );
    camera.position.set(zoomLevel, zoomLevel * 0.8, zoomLevel);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0x222222, 1);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 3, 100);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Enhanced Sun with corona effect
    const sunGeo = new THREE.SphereGeometry(0.3, 32, 32);
    const sunMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xffaa00,
      emissiveIntensity: 0.5,
    });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.name = 'sun';
    scene.add(sun);

    // Sun corona
    const coronaGeo = new THREE.SphereGeometry(0.8, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide,
    });
    const corona = new THREE.Mesh(coronaGeo, coronaMat);
    corona.name = 'sunCorona';
    scene.add(corona);

    // Enhanced starfield with depth
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 3000;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const radius = 100 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);

      const intensity = 0.3 + Math.random() * 0.7;
      const colorTemp = 2000 + Math.random() * 6000; // Star color temperature
      
      // Convert color temperature to RGB
      let r, g, b;
      if (colorTemp <= 6600) {
        r = 1;
        g = Math.max(0, Math.min(1, (colorTemp - 2000) / 4600));
        b = Math.max(0, Math.min(1, (colorTemp - 2000) / 8000));
      } else {
        r = Math.max(0, Math.min(1, 1 - (colorTemp - 6600) / 3400));
        g = Math.max(0, Math.min(1, 1 - (colorTemp - 6600) / 6800));
        b = 1;
      }
      
      starColors[i * 3] = r * intensity;
      starColors[i * 3 + 1] = g * intensity;
      starColors[i * 3 + 2] = b * intensity;
      starSizes[i] = 0.3 + Math.random() * 0.7;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

    const starMaterial = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });

    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // Create objects and labels
    const objectMeshes = new Map<string, THREE.Object3D>();
    const labelSprites = new Map<string, THREE.Sprite>();

    // Helper function to create labels
    const createLabel = (text: string, color: string = '#ffffff') => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 256;
      canvas.height = 64;

      context.fillStyle = 'rgba(0, 0, 0, 0.7)';
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.font = 'bold 24px Arial';
      context.fillStyle = color;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        opacity: 0.9
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(4, 1, 1);
      
      return sprite;
    };

    for (const [key, obj] of Object.entries(SOLAR_SYSTEM_OBJECTS)) {
      if (!solarSystemData[key] || solarSystemData[key].length === 0) continue;

      const isAtlas = key === 'atlas';
      const isSun = key === 'sun';
      
      let mesh: THREE.Mesh;
      
      if (isSun) {
        // Sun is already created above
        mesh = sun;
      } else {
        const geometry = new THREE.SphereGeometry(obj.size, isAtlas ? 32 : 20, isAtlas ? 32 : 20);
        
        let material: THREE.Material;
        if (isAtlas) {
          material = new THREE.MeshStandardMaterial({
            color: obj.color,
            emissive: obj.color,
            emissiveIntensity: 0.3,
            metalness: 0.3,
            roughness: 0.7,
          });
        } else {
          material = new THREE.MeshStandardMaterial({
            color: obj.color,
            metalness: 0.1,
            roughness: 0.8,
          });
        }
        
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
      }

      mesh.name = key;
      mesh.userData = {
        objectType: key === 'atlas' ? 'comet' : 
                    key === 'moon' ? 'moon' : 
                    key === 'sun' ? 'star' : 'planet',
        originalColor: obj.color
      };

      objectMeshes.set(key, mesh);

      // Enhanced effects for 3I/ATLAS
      if (isAtlas) {
        // Coma (comet atmosphere)
        const comaGeo = new THREE.SphereGeometry(obj.size * 3, 32, 32);
        const comaMat = new THREE.MeshBasicMaterial({
          color: obj.color,
          transparent: true,
          opacity: 0.4,
        });
        const coma = new THREE.Mesh(comaGeo, comaMat);
        scene.add(coma);
        objectMeshes.set('atlas_coma', coma);

        // Ion tail (simplified, pointing away from sun)
        const tailGeo = new THREE.ConeGeometry(obj.size * 0.5, obj.size * 8, 8);
        const tailMat = new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.6,
        });
        const tail = new THREE.Mesh(tailGeo, tailMat);
        scene.add(tail);
        objectMeshes.set('atlas_tail', tail);
      }

      // Create label
      const labelColor = isAtlas ? '#00ff88' : 
                        isSun ? '#ffaa00' : '#ffffff';
      const label = createLabel(obj.name, labelColor);
      scene.add(label);
      labelSprites.set(key, label);
    }

    // OrbitControls with enhanced settings
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.minDistance = 0.5;
    controls.maxDistance = 200;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.5;

    // Raycaster for object selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      objects: objectMeshes,
      labels: labelSprites,
      raycaster,
      mouse
    };

    // Handle mouse events
    const handleMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Raycasting for hover effects
      raycaster.setFromCamera(mouse, camera);
      const meshes = Array.from(objectMeshes.values());
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hoveredName = intersects[0].object.name;
        setHoveredObject(hoveredName);
        containerRef.current.style.cursor = 'pointer';
      } else {
        setHoveredObject(null);
        containerRef.current.style.cursor = 'default';
      }
    };

    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = Array.from(objectMeshes.values());
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const clickedObject = intersects[0].object.name;
        setSelectedObject(clickedObject);
        onObjectSelect?.(clickedObject);
      }
    };

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    containerRef.current.addEventListener('mousemove', handleMouseMove);
    containerRef.current.addEventListener('click', handleClick);
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      containerRef.current?.removeEventListener('mousemove', handleMouseMove);
      containerRef.current?.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [loading, error, solarSystemData, zoomLevel, onObjectSelect]);

  // Animation loop
  useEffect(() => {
    if (!sceneRef.current || Object.keys(solarSystemData).length === 0) {
      return;
    }

    const { scene, camera, renderer, objects, labels, raycaster, mouse } = sceneRef.current;
    let lastTime = performance.now();

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const now = performance.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      // Update object positions (static for current moment)
      for (const [key, vectors] of Object.entries(solarSystemData)) {
        if (!vectors || vectors.length === 0) continue;

        const mesh = objects.get(key);
        if (!mesh) continue;

        const currentVec = vectors[0]; // First (and only) frame for current moment
        
        if (currentVec) {
          let position = new THREE.Vector3(
            currentVec.position.x,
            currentVec.position.z,
            -currentVec.position.y
          );

          // Apply distance scaling
          if (distanceScale === 'logarithmic') {
            const distance = position.length();
            if (distance > 1) {
              position.normalize().multiplyScalar(1 + Math.log10(distance));
            }
          } else if (distanceScale === 'compressed') {
            position.multiplyScalar(0.3); // Compress outer distances
          }

          mesh.position.copy(position);

          // Update 3I/ATLAS special effects
          if (key === 'atlas') {
            const coma = objects.get('atlas_coma');
            const tail = objects.get('atlas_tail');
            
            if (coma) {
              coma.position.copy(position);
              // Pulsating coma effect
              const scale = 1 + Math.sin(now * 0.001) * 0.1;
              coma.scale.setScalar(scale);
            }
            
            if (tail) {
              tail.position.copy(position);
              // Point tail away from sun
              const sunDirection = position.clone().normalize().multiplyScalar(-1);
              tail.lookAt(sunDirection);
              tail.rotateX(Math.PI / 2);
            }
          }

          // Update labels
          const label = labels.get(key);
          if (label && showLabels) {
            label.position.copy(position);
            label.position.y += 1.5; // Offset above object
            
            // Scale labels based on distance
            const distance = camera.position.distanceTo(position);
            const scale = Math.max(0.5, Math.min(2, 10 / distance));
            label.scale.set(4 * scale, 1 * scale, 1);
            label.visible = true;
          } else if (label) {
            label.visible = false;
          }
        }
      }

      // Update hover effects
      if (hoveredObject) {
        raycaster.setFromCamera(mouse, camera);
        const meshes = Array.from(objects.values());
        const intersects = raycaster.intersectObjects(meshes);

        // Reset all materials
        for (const mesh of meshes) {
          if (mesh instanceof THREE.Mesh && mesh.material && mesh.userData.originalColor) {
            (mesh.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(mesh.userData.originalColor);
            (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.1;
          }
        }

        // Highlight hovered object
        if (intersects.length > 0) {
          const hoveredMesh = intersects[0].object;
          if (hoveredMesh instanceof THREE.Mesh && hoveredMesh.material && hoveredMesh.userData.originalColor) {
            (hoveredMesh.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0xffffff);
            (hoveredMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5;
          }
        }
      }

      // Update controls
      if (sceneRef.current) {
        sceneRef.current.controls.update();
      }

      // Performance monitoring
      frameCountRef.current++;
      if (now - lastTimeRef.current >= 1000) {
        console.log(`[CurrentMoment] FPS: ${frameCountRef.current}`);
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
  }, [solarSystemData, showLabels, hoveredObject, distanceScale]);

  // Calculate distances and metrics
  const atlasData = solarSystemData['atlas'] || [];
  const sunData = solarSystemData['sun'] || [];
  const earthData = solarSystemData['earth'] || [];
  
  let distanceFromSun = 0;
  let distanceFromEarth = 0;
  let apparentMagnitude = 0;

  if (atlasData.length > 0) {
    const atlasVector = atlasData[0];
    
    // Distance from Sun
    distanceFromSun = Math.sqrt(
      Math.pow(atlasVector.position.x, 2) +
      Math.pow(atlasVector.position.y, 2) +
      Math.pow(atlasVector.position.z, 2)
    );

    // Distance from Earth
    if (earthData.length > 0) {
      const earthVector = earthData[0];
      distanceFromEarth = Math.sqrt(
        Math.pow(atlasVector.position.x - earthVector.position.x, 2) +
        Math.pow(atlasVector.position.y - earthVector.position.y, 2) +
        Math.pow(atlasVector.position.z - earthVector.position.z, 2)
      );
    }

    // Apparent magnitude (simplified calculation)
    apparentMagnitude = 15 + 5 * Math.log10(distanceFromSun * distanceFromEarth);
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500 mb-4" />
          <p className="text-white text-lg">Loading Current Moment...</p>
          <p className="text-white/60 text-sm mt-2">
            Fetching position data for October 8, 2025
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
            className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3D Canvas */}
      <div ref={containerRef} className="w-full h-full bg-black rounded-xl overflow-hidden" />

      {/* Current Moment UI Overlay */}
      {!loading && !error && (
        <>
          {/* Date and Time Display */}
          <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-green-500/30">
            <div className="text-green-400 font-semibold text-sm">Current Moment</div>
            <div className="text-white text-xl font-bold">October 8, 2025</div>
            <div className="text-white/60 text-xs mt-1">
              3I/ATLAS Super-Lens View
            </div>
          </div>

          {/* Object Information Panel */}
          {selectedObject && (
            <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-blue-500/30 max-w-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="text-blue-400 font-semibold text-sm">
                  {SOLAR_SYSTEM_OBJECTS[selectedObject as keyof typeof SOLAR_SYSTEM_OBJECTS]?.name || selectedObject}
                </div>
                <button
                  onClick={() => setSelectedObject(null)}
                  className="text-white/60 hover:text-white transition-colors"
                  aria-label="Close object info"
                >
                  ✕
                </button>
              </div>
              
              {selectedObject === 'atlas' && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/60">Distance from Sun:</span>
                    <span className="text-yellow-400 font-mono">{distanceFromSun.toFixed(3)} AU</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Distance from Earth:</span>
                    <span className="text-blue-400 font-mono">{distanceFromEarth.toFixed(3)} AU</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Apparent Magnitude:</span>
                    <span className="text-green-400 font-mono">{apparentMagnitude.toFixed(1)}</span>
                  </div>
                  <div className="text-green-300 text-xs mt-2">
                    Interstellar Comet • Active Observation
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Control Panel */}
          <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="text-white font-semibold text-sm mb-3">Super-Lens Controls</div>
            
            {/* Zoom Controls */}
            <div className="space-y-2">
              <div className="text-white/70 text-xs">Zoom Level</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomLevel(Math.max(1, zoomLevel - 5))}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-sm transition-colors"
                  aria-label="Zoom out"
                >
                  −
                </button>
                <div className="flex-1 bg-white/10 rounded px-2 py-1 text-center text-sm text-white">
                  {zoomLevel.toFixed(0)} AU
                </div>
                <button
                  onClick={() => setZoomLevel(Math.min(100, zoomLevel + 5))}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-sm transition-colors"
                  aria-label="Zoom in"
                >
                  +
                </button>
              </div>
            </div>

            {/* Distance Scale */}
            <div className="mt-4 space-y-2">
              <div className="text-white/70 text-xs">Distance Scale</div>
              <div className="flex gap-1">
                {(['real', 'logarithmic', 'compressed'] as const).map((scale) => (
                  <button
                    key={scale}
                    onClick={() => setDistanceScale(scale)}
                    className={`px-2 py-1 rounded text-xs capitalize transition-colors ${
                      distanceScale === scale
                        ? 'bg-green-600 text-white'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {scale}
                  </button>
                ))}
              </div>
            </div>

            {/* Display Options */}
            <div className="mt-4 space-y-2">
              <button
                onClick={() => setShowLabels(!showLabels)}
                className={`w-full px-3 py-2 rounded text-sm transition-colors ${
                  showLabels
                    ? 'bg-green-600 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                aria-label={showLabels ? 'Hide labels' : 'Show labels'}
              >
                {showLabels ? '🏷️ Hide Labels' : '🏷️ Show Labels'}
              </button>
            </div>
          </div>

          {/* Scale Reference */}
          <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <div className="text-white font-semibold text-xs mb-2">Scale Reference</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-yellow-400"></div>
                <span className="text-white/60">1 AU = 149.6M km</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-400 rounded-full"></div>
                <span className="text-white/60">3I/ATLAS</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
                <span className="text-white/60">Planets</span>
              </div>
            </div>
          </div>

          {/* Instructions Overlay */}
          <div className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-black/70 text-white/80 text-sm p-4 rounded-lg max-w-xs backdrop-blur-sm border border-white/10">
            <div className="font-semibold mb-2">Current Moment Controls</div>
            <div className="space-y-1 text-xs">
              <div>🖱️ Click + drag to rotate view</div>
              <div>🎯 Scroll to zoom in/out</div>
              <div>👆 Click objects for details</div>
              <div>🏷️ Toggle labels for names</div>
              <div>📏 Adjust distance scales</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CurrentMomentView;
