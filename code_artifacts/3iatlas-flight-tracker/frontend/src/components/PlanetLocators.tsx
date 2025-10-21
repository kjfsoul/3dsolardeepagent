/**
 * PlanetLocators Component
 * =============================
 * Screen-space indicators for celestial bodies
 * Shows arrows pointing to off-screen planets
 */

import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface PlanetLocatorsProps {
  bodies: { name: string; world: THREE.Vector3; color: string }[];
}

export function PlanetLocators({ bodies }: PlanetLocatorsProps) {
  const { camera, size } = useThree();

  const project = (v: THREE.Vector3) => {
    const p = v.clone().project(camera as THREE.PerspectiveCamera);
    const x = (p.x * 0.5 + 0.5) * size.width;
    const y = (-p.y * 0.5 + 0.5) * size.height;
    const inView = p.z > 0 && Math.abs(p.x) < 1 && Math.abs(p.y) < 1;
    return { x, y, inView, z: p.z };
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        fontSize: 12,
        fontFamily: 'monospace',
      }}
    >
      {bodies.map((b) => {
        const s = project(b.world);
        
        if (s.inView) {
          // Body is visible in viewport - show subtle indicator
          return (
            <div
              key={b.name}
              style={{
                position: 'absolute',
                left: s.x,
                top: s.y,
                transform: 'translate(-50%, -50%)',
                color: b.color,
                textShadow: '0 1px 3px #000',
                fontWeight: 'bold',
              }}
            >
              ● {b.name}
            </div>
          );
        } else if (s.z > 0) {
          // Body is behind camera or off-screen - show arrow at edge
          const clampedX = Math.max(20, Math.min(size.width - 20, s.x));
          const clampedY = Math.max(20, Math.min(size.height - 20, s.y));
          
          return (
            <div
              key={b.name}
              style={{
                position: 'absolute',
                left: clampedX,
                top: clampedY,
                transform: 'translate(-50%, -50%)',
                color: b.color,
                textShadow: '0 1px 3px #000',
                fontWeight: 'bold',
                opacity: 0.7,
              }}
            >
              ➜ {b.name}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

