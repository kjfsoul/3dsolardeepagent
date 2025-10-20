# Three.js Components - Enhanced 3I/ATLAS Visualization

This directory contains enhanced Three.js components for the immersive 3I/ATLAS flight tracker.

## Components

### FollowCamera
Implements "Ride with ATLAS" camera perspective with smooth following behavior.

**Features:**
- Smooth interpolation using lerp
- Velocity-aware positioning
- Multiple follow modes: `follow`, `chase`, `orbit`, `disabled`
- Configurable trailing offset

**Usage:**
```tsx
import { FollowCamera } from "@/components/three";

<FollowCamera
  targetRef={cometRef}
  mode="follow"
  velocity={cometVelocity}
/>
```

### CameraController
Manages multiple camera view modes with smooth transitions.

**View Modes:**
1. `RIDE_WITH_ATLAS` - Close follow perspective (primary)
2. `SOLAR_SYSTEM_OVERVIEW` - Wide view of full trajectory
3. `PERIHELION_CLOSEUP` - Dramatic Sun approach view
4. `MARS_FLYBY` - Fixed view centered on Mars
5. `FREE_CAMERA` - User-controlled OrbitControls

**Usage:**
```tsx
import { CameraController } from "@/components/three";

<CameraController
  viewMode={viewMode}
  cometRef={cometRef}
  marsRef={marsRef}
  cometVelocity={velocity}
/>
```

### CometVisuals
Enhanced comet visualization with nucleus, coma, and tail.

**Features:**
- Dark gray-green nucleus
- Particle-based coma with 5,000 particles (adjustable)
- Greenish tail with glow effect
- Dynamic activity based on distance from Sun
- Tail orientation based on velocity

**Usage:**
```tsx
import { CometVisuals } from "@/components/three";

<CometVisuals
  position={position}
  velocity={velocity}
  distanceFromSun={distance}
  quality={quality}
  scale={1.0}
/>
```

### MilestoneMarkers
Interactive 3D markers for trajectory milestones.

**Features:**
- Glowing spheres with pulsing animation
- Color-coded markers (Discovery: blue, JWST: purple, Mars: red, Perihelion: orange)
- Hover effects with detailed information
- Click handling
- HTML overlay labels

**Usage:**
```tsx
import { MilestoneMarkers } from "@/components/three";

<MilestoneMarkers
  milestones={milestones}
  onMilestoneClick={handleClick}
  orbitScale={10}
/>
```

### Starfield
Animated background starfield with parallax effect.

**Features:**
- 10,000+ stars with varying sizes
- Color variation (white, blue, yellow)
- Subtle rotation for parallax depth
- Performance optimized

**Usage:**
```tsx
import { Starfield } from "@/components/three";

<Starfield quality={quality} />
```

### ViewSwitcher
UI component for switching between camera views.

**Usage:**
```tsx
import { ViewSwitcher } from "@/components/three";

<ViewSwitcher
  currentView={viewMode}
  onViewChange={setViewMode}
/>
```

## Integration Example

See `components/views/HistoricalFlightViewEnhanced.tsx` for a complete integration example.

## Performance Considerations

- Uses adaptive quality system via `useAdaptiveQuality` hook
- Particle counts adjust based on device capabilities
- LOD (Level of Detail) for geometry
- Target: 60 FPS on desktop, 30 FPS on mobile

## Data Format

Trajectory data should be in the format:
```json
{
  "atlas": [
    {
      "date": "2025-07-01 00:00:00",
      "position": [x, y, z],
      "velocity": [vx, vy, vz]
    }
  ],
  "earth": [...],
  "mars": [...],
  "jupiter": [...],
  "milestones": [
    {
      "name": "Discovery",
      "date": "2025-07-01",
      "description": "...",
      "position": [x, y, z]
    }
  ]
}
```

## Coordinate System

- Units: AU (Astronomical Units)
- Coordinate transformation: `(x, z, -y)` for Three.js space
- Orbit scale: 10x for visibility
