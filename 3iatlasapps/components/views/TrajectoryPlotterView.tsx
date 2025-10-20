'use client';

/**
 * Trajectory Plotter View - View 5
 * Interactive trajectory plotting with drag-and-drop interface
 * Real-time physics calculations and impact prediction
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  fetchSolarSystemData,
  SOLAR_SYSTEM_OBJECTS,
  type SolarSystemObjectKey
} from '@/lib/solar-system-data';
import { StableNBodySimulator, type PhysicsHealthStats } from '@/lib/trajectory-calculator';
import {
  MemoryManager,
  debounce,
  throttle,
  usePerformanceMonitor,
  sphereGeometryPool,
  bufferGeometryPool,
  lineBasicMaterialPool,
  meshStandardMaterialPool
} from '@/lib/performance-utils';

interface TrajectoryPlotterViewProps {
  solarSystemData: Record<string, any[]>;
  onTrajectoryChange: (trajectory: any) => void;
  className?: string;
}

interface PhysicsData {
  velocity: { x: number; y: number; z: number };
  acceleration: { x: number; y: number; z: number };
  energy: number;
  angularMomentum: number;
  timeToImpact: number | null;
  impactObject: string | null;
  health: PhysicsHealthStats | null;
}

const TrajectoryPlotterView: React.FC<TrajectoryPlotterViewProps> = ({
  solarSystemData,
  onTrajectoryChange,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    cometMesh: THREE.Mesh;
    trajectoryLine: THREE.Line;
    solarSystemObjects: Map<string, THREE.Mesh>;
    simulator: StableNBodySimulator;
    isDragging: boolean;
  } | null>(null);

  const [physicsData, setPhysicsData] = useState<PhysicsData>({
    velocity: { x: 0, y: 0, z: 0 },
    acceleration: { x: 0, y: 0, z: 0 },
    energy: 0,
    angularMomentum: 0,
    timeToImpact: null,
    impactObject: null,
    health: null,
  });

  const [isDragging, setIsDragging] = useState(false);
  const { trackMetric } = usePerformanceMonitor();

  // Debounce trajectory updates to prevent excessive calculations
  const updateTrajectoryRef = useRef<NodeJS.Timeout | null>(null);
  
  const updateTrajectory = useCallback(() => {
    if (!sceneRef.current) return;
    
    // Clear existing timeout
    if (updateTrajectoryRef.current) {
      clearTimeout(updateTrajectoryRef.current);
    }
    
    // Debounce trajectory calculation
    updateTrajectoryRef.current = setTimeout(() => {
      const startTime = performance.now();
      const { simulator, trajectoryLine } = sceneRef.current!;
      const sim = new StableNBodySimulator();
      sim.initializeWithSolarSystem(simulator.getPositions());
      
      const trajectoryPoints: THREE.Vector3[] = [];
      const MAX_POINTS = 500; // Reduced from 2000 for better performance
      
      for (let i = 0; i < MAX_POINTS; i++) {
        sim.step();
        const atlasBody = sim.getState().bodies.get('atlas');
        if (atlasBody) {
          trajectoryPoints.push(new THREE.Vector3(atlasBody.position.x, atlasBody.position.y, atlasBody.position.z));
        }
      }
      
      // Track performance metrics
      const calculationTime = performance.now() - startTime;
      trackMetric('trajectoryCalculationTime', calculationTime);

      try {
        // Use BufferGeometry for better performance
        const positions = new Float32Array(MAX_POINTS * 3);
        trajectoryPoints.forEach((point, i) => {
          positions[i * 3] = point.x;
          positions[i * 3 + 1] = point.y;
          positions[i * 3 + 2] = point.z;
        });
        
        trajectoryLine.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        trajectoryLine.geometry.computeBoundingSphere();
      } catch (e) {
        console.error("Error updating trajectory geometry:", e);
      }

      const atlasState = sim.getState().bodies.get('atlas');
      if(atlasState) {
        setPhysicsData({
          velocity: atlasState.velocity,
          acceleration: atlasState.acceleration,
          energy: sim.getState().totalEnergy,
          angularMomentum: new THREE.Vector3().crossVectors(new THREE.Vector3(atlasState.position.x, atlasState.position.y, atlasState.position.z), new THREE.Vector3(atlasState.velocity.x, atlasState.velocity.y, atlasState.velocity.z)).length(),
          timeToImpact: null, // Simplified
          impactObject: null, // Simplified
          health: sim.getHealthStats(),
        });
      }
    }, 100); // 100ms debounce
  }, [trackMetric]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || !solarSystemData) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);

    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(20, 15, 20);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 3, 200);
    scene.add(sunLight);

    const solarSystemObjects = new Map<string, THREE.Mesh>();
    const simulator = new StableNBodySimulator(0.1, true, 1e-4);
    
    const initialPositions: Record<string, any> = {};
    for (const key in solarSystemData) {
        if(solarSystemData[key] && solarSystemData[key].length > 0) {
            initialPositions[key] = solarSystemData[key][0];
        }
    }
    simulator.initializeWithSolarSystem(initialPositions);

    const simState = simulator.getState();
    simState.bodies.forEach((body, id) => {
        const config = SOLAR_SYSTEM_OBJECTS[id as SolarSystemObjectKey];
        const color = config ? config.color : 0xffffff;
        const size = config ? config.size : 0.1;
        
        // Use object pools for better performance
        const geometry = sphereGeometryPool.acquire();
        geometry.scale(size, size, size);
        
        const material = meshStandardMaterialPool.acquire();
        material.color.setHex(color);
        material.emissive.setHex(id === 'sun' ? color : 0x000000);
        material.emissiveIntensity = id === 'sun' ? 1 : 0;
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = id;
        mesh.position.set(body.position.x, body.position.y, body.position.z);
        scene.add(mesh);
        solarSystemObjects.set(id, mesh);
    });

    const cometMesh = solarSystemObjects.get('atlas');
    if (!cometMesh) return;

    // Use object pools for trajectory line
    const trajectoryGeometry = bufferGeometryPool.acquire();
    const trajectoryMaterial = lineBasicMaterialPool.acquire();
    trajectoryMaterial.color.setHex(0x00ff88);
    trajectoryMaterial.transparent = true;
    trajectoryMaterial.opacity = 0.7;
    const trajectoryLine = new THREE.Line(trajectoryGeometry, trajectoryMaterial);
    scene.add(trajectoryLine);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    const handleMouseDown = (event: MouseEvent) => {
      mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(cometMesh);
      if (intersects.length > 0) {
        setIsDragging(true);
        controls.enabled = false;
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging || !sceneRef.current) return;
      mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(dragPlane, intersection);
      
      const atlasBody = sceneRef.current.simulator.getState().bodies.get('atlas');
      if(atlasBody) {
          atlasBody.position.x = intersection.x;
          atlasBody.position.y = intersection.y;
          atlasBody.position.z = intersection.z;
          cometMesh.position.copy(intersection);
          updateTrajectory();
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      controls.enabled = true;
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);

    sceneRef.current = {
      scene, camera, renderer, controls, cometMesh, trajectoryLine, solarSystemObjects, simulator, isDragging: false
    };

    updateTrajectory();

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    const animationIdRef = { current: requestAnimationFrame(animate) };

    return () => {
      // Cancel animation frame
      cancelAnimationFrame(animationIdRef.current);
      
      // Clear trajectory update timeout
      if (updateTrajectoryRef.current) {
        clearTimeout(updateTrajectoryRef.current);
      }
      
      // Remove event listeners
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      
      // Release objects back to pools instead of disposing
      sceneRef.current?.solarSystemObjects.forEach((mesh) => {
        if (mesh.geometry instanceof THREE.SphereGeometry) {
          sphereGeometryPool.release(mesh.geometry);
        } else {
          mesh.geometry.dispose();
        }
        
        if (mesh.material instanceof THREE.MeshStandardMaterial) {
          meshStandardMaterialPool.release(mesh.material);
        } else if (mesh.material instanceof THREE.Material) {
          mesh.material.dispose();
        }
      });
      
      // Release trajectory line objects back to pools
      if (trajectoryLine.geometry) {
        bufferGeometryPool.release(trajectoryLine.geometry);
      }
      
      if (trajectoryLine.material) {
        lineBasicMaterialPool.release(trajectoryLine.material);
      }
      
      // Dispose controls
      controls.dispose();
      
      // Dispose renderer
      renderer.dispose();
      
      // Clear references
      sceneRef.current = null;
    };
  }, [solarSystemData]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Physics Dashboard */}
      <div className="absolute top-4 left-4 bg-black/90 text-white p-4 rounded-lg max-w-sm">
        <h3 className="text-lg font-bold mb-3">Physics Dashboard</h3>
        <div className="space-y-2 text-sm">
          <div>
            <div className="text-gray-400">Velocity (AU/day):</div>
            <div className="font-mono">
              X: {physicsData.velocity.x.toFixed(3)}<br/>
              Y: {physicsData.velocity.y.toFixed(3)}<br/>
              Z: {physicsData.velocity.z.toFixed(3)}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Energy:</div>
            <div className="font-mono">{physicsData.energy.toFixed(3)}</div>
          </div>
          <div>
            <div className="text-gray-400">Angular Momentum:</div>
            <div className="font-mono">{physicsData.angularMomentum.toFixed(3)}</div>
          </div>
          {physicsData.timeToImpact && (
            <div className="text-red-400">
              <div>⚠️ Impact Predicted</div>
              <div>Object: {physicsData.impactObject}</div>
              <div>Time: {physicsData.timeToImpact.toFixed(2)} days</div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-black/90 text-white p-4 rounded-lg max-w-sm">
        <h4 className="font-bold mb-2">Trajectory Plotter</h4>
        <div className="text-sm space-y-1">
          <div>• Click and drag 3I/ATLAS to change trajectory</div>
          <div>• Green line shows predicted path</div>
          <div>• Physics dashboard shows real-time calculations</div>
          <div>• Red warnings indicate potential impacts</div>
          <div>• Drag to rotate view, scroll to zoom</div>
        </div>
      </div>

      {/* Scenario Presets */}
      <div className="absolute top-4 right-4 bg-black/90 text-white p-4 rounded-lg">
        <h4 className="font-bold mb-2">Scenarios</h4>
        <div className="space-y-2">
          <button className="block w-full text-left px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm">
            Earth Impact
          </button>
          <button className="block w-full text-left px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded text-sm">
            Jupiter Slingshot
          </button>
          <button className="block w-full text-left px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm">
            Mars Flyby
          </button>
          <button className="block w-full text-left px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm">
            Solar Closeup
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrajectoryPlotterView;
