/**
 * PlanetLocators Component
 * =============================
 * Screen-space indicators for celestial bodies
 * Shows arrows pointing to off-screen planets
 * Uses <Html> from drei to render DOM safely within Canvas
 */

import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

type Body = { name: string; world: THREE.Vector3; color: string };

export function PlanetLocators({ bodies }: { bodies: Body[] }) {
  const { camera, size } = useThree();

  const project = (v: THREE.Vector3) => {
    const p = v.clone().project(camera);
    // screen coords
    const x = (p.x * 0.5 + 0.5) * size.width;
    const y = (-p.y * 0.5 + 0.5) * size.height;
    const inView = p.z > 0 && Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1;
    return { x, y, inView };
  };

  return (
    // Html renders normal DOM safely within <Canvas>
    <Html fullscreen pointerEvents="none" style={{ zIndex: 1 }}>
      <div style={{ position: 'absolute', inset: 0, fontFamily: 'system-ui, sans-serif' }}>
        {bodies.map((b) => {
          const s = project(b.world);
          const left = Math.max(12, Math.min(size.width - 12, s.x));
          const top = Math.max(12, Math.min(size.height - 12, s.y));
          const style: React.CSSProperties = {
            position: 'absolute',
            left,
            top,
            transform: 'translate(-50%,-50%)',
            color: b.color,
            textShadow: '0 1px 2px rgba(0,0,0,0.9)',
            fontSize: 12,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          };

          return (
            <div key={b.name} style={style}>
              {s.inView ? (
                null // Don't show locator when planet is in view - let the 3D label handle it
              ) : (
                <>➜ {b.name}</>
              )}
            </div>
          );
        })}
      </div>
    </Html>
  );
}
