# NASA Horizons API Analysis & Implementation Plan
## Real-Time 3D Tracker for 3I/ATLAS

*Analysis Date: October 1, 2025*

---

## API Documentation Analysis

Based on the official NASA JPL Horizons API documentation, there are **three distinct APIs** available:

### 1. **Horizons Lookup API** (GET)
**Purpose:** Object identification and alias resolution  
**Endpoint:** `https://ssd.jpl.nasa.gov/api/horizons_lookup.api`  
**Use Case:** Convert names/designations to SPK IDs

**Key Features:**
- Search by name, designation, SPK-ID, IAU number, or MPC packed designation
- Returns all aliases and identifiers for an object
- Can filter by object group (ast, com, pln, sat, sct, mb, sb)
- No authentication required

**Example for 3I/ATLAS:**
```bash
# Search for 3I/ATLAS (likely designated C/2025 N1)
GET https://ssd.jpl.nasa.gov/api/horizons_lookup.api?sstr=C/2025%20N1&group=com&format=json
```

### 2. **Horizons File API** (POST)
**Purpose:** Batch ephemeris generation via file upload  
**Endpoint:** `https://ssd.jpl.nasa.gov/api/horizons_file.api`  
**Use Case:** Complex queries, batch processing

**Key Features:**
- Requires input file with settings
- Supports observer, vector, and close-approach tables
- More powerful but more complex
- No authentication required

**NOT RECOMMENDED** for real-time web app (too slow, file-based)

### 3. **Horizons API** (GET) - Main API
**Purpose:** Real-time ephemeris queries via URL parameters  
**Endpoint:** `https://ssd.jpl.nasa.gov/api/horizons.api`  
**Use Case:** **THIS IS WHAT WE NEED** for real-time tracking

**Key Features:**
- HTTP GET with query parameters
- Returns ephemeris, vectors, or close-approach data
- Fast, cacheable, perfect for web apps
- No authentication required

---

## Authentication & API Key Analysis

### **CRITICAL FINDING: NASA API Key NOT Required for Horizons**

Based on the documentation:

1. ✅ **Horizons APIs are PUBLIC** - No authentication mentioned in any docs
2. ✅ **No API key parameters** in any example queries
3. ✅ **Direct access via GET/POST** without headers

**Your NASA API Key (`NASA_API_KEY=69REZf7nyHSgkTZGz79UbSUeooqfAmU7UuCH53o6`):**
- This is for NASA's **general API system** (api.nasa.gov)
- Used for: APOD, Mars Photos, Earth imagery, etc.
- **NOT needed** for Horizons (ssd.jpl.nasa.gov)
- **Keep it** for potential future features (Mars weather, APOD integration, etc.)

### Rate Limiting

While no authentication is required, the Horizons system likely has:
- **Fair use limits** (not documented but implied)
- **503 errors** if server is overloaded
- **Best practice:** Cache responses, don't hammer the API

---

## Recommended API: Horizons GET API

### Why This API Wins:

1. **Real-time capable** - Instant HTTP GET requests
2. **URL-based** - Easy to construct and cache
3. **JSON output** - Perfect for JavaScript parsing
4. **No file uploads** - Clean, simple requests
5. **Documented query parameters** - Flexible control

### Required Query Parameters

```typescript
interface HorizonsQueryParams {
  // REQUIRED
  COMMAND: string;        // Object identifier (SPK-ID, designation, or name)
  
  // EPHEMERIS SETTINGS
  EPHEM_TYPE: 'VECTOR' | 'OBSERVER';  // Type of ephemeris
  CENTER: string;         // Coordinate center (e.g., '@sun', '500@0' for geocentric)
  START_TIME: string;     // Start date (YYYY-MM-DD or JD)
  STOP_TIME: string;      // Stop date
  STEP_SIZE: string;      // Time step (e.g., '1 d', '6 h', '30 m')
  
  // OUTPUT SETTINGS
  format: 'json' | 'text'; // Output format (use JSON!)
  OUT_UNITS: 'AU-D' | 'KM-S'; // Distance-time units
  REF_SYSTEM: 'ICRF';     // Reference frame (ICRF for inertial)
  
  // OPTIONAL (for customization)
  VEC_TABLE: '1' | '2';   // Vector table type
  CSV_FORMAT: 'YES' | 'NO'; // Comma-separated output
  OBJ_DATA: 'YES' | 'NO';   // Include object summary
}
```

---

## Implementation Strategy for 3I/ATLAS Tracker

### Step 1: Identify 3I/ATLAS in Horizons

**Official Designations for 3I/ATLAS:**
- `3I/ATLAS` (primary interstellar designation) ✅
- `C/2025 N1` (provisional comet designation) ✅
- `3I` (short interstellar form) ✅
- `2025 N1` (short provisional form) ✅
- SPK-ID (obtained via Lookup API)

**IMPORTANT:** 3I/ATLAS is the THIRD confirmed interstellar object, discovered July 1, 2025. 
It IS in the Horizons database as of October 2025.

**Test Query:**
```bash
# Primary designation - Check if object exists and get SPK-ID
curl "https://ssd.jpl.nasa.gov/api/horizons_lookup.api?sstr=3I/ATLAS&group=com&format=json"

# Alternative: Provisional designation
curl "https://ssd.jpl.nasa.gov/api/horizons_lookup.api?sstr=C/2025%20N1&group=com&format=json"

# Alternative: Short forms
curl "https://ssd.jpl.nasa.gov/api/horizons_lookup.api?sstr=3I&group=com&format=json"
```

### Step 2: Fetch Orbital Vectors

**Why Vectors vs Observer Data:**
- **VECTOR mode:** Returns XYZ position + velocity in 3D space
- **OBSERVER mode:** Returns RA/DEC from Earth (2D sky projection)
- **For 3D visualization:** We need VECTOR mode

**Example Query:**
```bash
# Get position vectors for 3I/ATLAS
# October 1-31, 2025, every 6 hours

curl -G "https://ssd.jpl.nasa.gov/api/horizons.api" \
  --data-urlencode "COMMAND=C/2025 N1" \
  --data-urlencode "EPHEM_TYPE=VECTOR" \
  --data-urlencode "CENTER=@sun" \
  --data-urlencode "START_TIME=2025-10-01" \
  --data-urlencode "STOP_TIME=2025-10-31" \
  --data-urlencode "STEP_SIZE=6h" \
  --data-urlencode "format=json" \
  --data-urlencode "OUT_UNITS=AU-D" \
  --data-urlencode "REF_SYSTEM=ICRF" \
  --data-urlencode "VEC_TABLE=2"
```

**Expected Response Structure:**
```json
{
  "signature": {
    "source": "NASA/JPL Horizons API",
    "version": "1.2"
  },
  "result": [
    "... header info ...",
    "$$SOE",
    "2459854.500000000 = A.D. 2025-Oct-01 00:00:00.0000 TDB",
    " X = 1.234567890123456E+00 Y = -2.345678901234567E+00 Z = 3.456789012345678E-01",
    " VX= 1.234567890123E-02 VY= 2.345678901234E-02 VZ= 3.456789012345E-03",
    "... more data points ...",
    "$$EOE"
  ]
}
```

### Step 3: Parse Vector Data

```typescript
interface VectorData {
  jd: number;           // Julian Date
  date: string;         // Human-readable date
  position: {
    x: number;          // AU
    y: number;          // AU
    z: number;          // AU
  };
  velocity: {
    vx: number;         // AU/day
    vy: number;         // AU/day
    vz: number;         // AU/day
  };
}

function parseHorizonsVectors(response: string): VectorData[] {
  const lines = response.split('\n');
  const vectors: VectorData[] = [];
  
  let inDataSection = false;
  let currentJD = 0;
  let currentDate = '';
  
  for (const line of lines) {
    if (line.includes('$$SOE')) {
      inDataSection = true;
      continue;
    }
    if (line.includes('$$EOE')) {
      break;
    }
    
    if (!inDataSection) continue;
    
    // Parse JD and date line
    if (line.match(/^\d{7}\.\d+/)) {
      const match = line.match(/^(\d+\.\d+) = A\.D\. (.+) TDB$/);
      if (match) {
        currentJD = parseFloat(match[1]);
        currentDate = match[2];
      }
    }
    
    // Parse position line (starts with " X =")
    if (line.trim().startsWith('X =')) {
      const posMatch = line.match(/X\s*=\s*([\-\d.E+]+)\s+Y\s*=\s*([\-\d.E+]+)\s+Z\s*=\s*([\-\d.E+]+)/);
      if (posMatch) {
        const x = parseFloat(posMatch[1]);
        const y = parseFloat(posMatch[2]);
        const z = parseFloat(posMatch[3]);
        
        // Position stored, wait for velocity line
        vectors.push({
          jd: currentJD,
          date: currentDate,
          position: { x, y, z },
          velocity: { vx: 0, vy: 0, vz: 0 } // Will be updated
        });
      }
    }
    
    // Parse velocity line (starts with " VX=")
    if (line.trim().startsWith('VX=')) {
      const velMatch = line.match(/VX\s*=\s*([\-\d.E+]+)\s+VY\s*=\s*([\-\d.E+]+)\s+VZ\s*=\s*([\-\d.E+]+)/);
      if (velMatch && vectors.length > 0) {
        const lastVector = vectors[vectors.length - 1];
        lastVector.velocity.vx = parseFloat(velMatch[1]);
        lastVector.velocity.vy = parseFloat(velMatch[2]);
        lastVector.velocity.vz = parseFloat(velMatch[3]);
      }
    }
  }
  
  return vectors;
}
```

---

## Three.js Integration Architecture

### System Design

```
┌─────────────────┐
│   React/Next.js │
│   Component     │
└────────┬────────┘
         │
         ├──► Horizons API Wrapper
         │    ├──► Lookup API (get SPK-ID)
         │    └──► Main API (get vectors)
         │
         ├──► Data Cache Layer
         │    └──► localStorage/IndexedDB
         │
         └──► Three.js Scene
              ├──► Solar System
              │    ├──► Sun (center)
              │    ├──► Planets (optional)
              │    └──► Orbital paths
              │
              ├──► 3I/ATLAS
              │    ├──► Position (from vectors)
              │    ├──► Coma (particle system)
              │    └──► Tail (trail effect)
              │
              └──► Controls
                   ├──► OrbitControls (user navigation)
                   ├──► TimeSlider (scrub timeline)
                   └──► ViewPresets (camera angles)
```

### Component Structure

```typescript
// components/Atlas3DTracker.tsx
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface Atlas3DTrackerProps {
  startDate: string;
  endDate: string;
  autoPlay?: boolean;
}

export function Atlas3DTracker({ startDate, endDate, autoPlay = true }: Atlas3DTrackerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(startDate);
  const [vectorData, setVectorData] = useState<VectorData[]>([]);
  
  // Fetch data from Horizons
  useEffect(() => {
    async function fetchAtlasData() {
      try {
        // Step 1: Get SPK-ID
        const lookupResponse = await fetch(
          'https://ssd.jpl.nasa.gov/api/horizons_lookup.api?' +
          new URLSearchParams({
            sstr: 'C/2025 N1',
            group: 'com',
            format: 'json'
          })
        );
        const lookupData = await lookupResponse.json();
        
        if (lookupData.count === 0) {
          console.error('3I/ATLAS not found in Horizons database');
          return;
        }
        
        const spkid = lookupData.result[0].spkid;
        
        // Step 2: Get vector data
        const horizonsResponse = await fetch(
          'https://ssd.jpl.nasa.gov/api/horizons.api?' +
          new URLSearchParams({
            COMMAND: spkid,
            EPHEM_TYPE: 'VECTOR',
            CENTER: '@sun',
            START_TIME: startDate,
            STOP_TIME: endDate,
            STEP_SIZE: '6h',
            format: 'json',
            OUT_UNITS: 'AU-D',
            REF_SYSTEM: 'ICRF',
            VEC_TABLE: '2'
          })
        );
        
        const horizonsData = await horizonsResponse.json();
        const vectors = parseHorizonsVectors(horizonsData.result.join('\n'));
        
        setVectorData(vectors);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching Horizons data:', error);
      }
    }
    
    fetchAtlasData();
  }, [startDate, endDate]);
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || loading || vectorData.length === 0) return;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    
    // Add Sun
    const sunGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);
    
    // Add 3I/ATLAS
    const atlasGeometry = new THREE.SphereGeometry(0.02, 16, 16);
    const atlasMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const atlas = new THREE.Mesh(atlasGeometry, atlasMaterial);
    scene.add(atlas);
    
    // Add orbital path
    const pathPoints = vectorData.map(v => 
      new THREE.Vector3(v.position.x, v.position.z, -v.position.y)
    );
    const pathGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
    const pathMaterial = new THREE.LineBasicMaterial({ color: 0x888888 });
    const pathLine = new THREE.Line(pathGeometry, pathMaterial);
    scene.add(pathLine);
    
    // Position camera
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    
    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    
    // Animation loop
    let frameIndex = 0;
    function animate() {
      requestAnimationFrame(animate);
      
      if (autoPlay && vectorData.length > 0) {
        const currentVector = vectorData[frameIndex % vectorData.length];
        atlas.position.set(
          currentVector.position.x,
          currentVector.position.z,
          -currentVector.position.y
        );
        setCurrentDate(currentVector.date);
        frameIndex++;
      }
      
      controls.update();
      renderer.render(scene, camera);
    }
    
    animate();
    
    // Cleanup
    return () => {
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [loading, vectorData, autoPlay]);
  
  return (
    <div className="relative w-full h-[600px]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white">Loading 3I/ATLAS trajectory data...</div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full bg-black" />
      <div className="absolute bottom-4 left-4 text-white bg-black/70 px-4 py-2 rounded">
        {currentDate}
      </div>
    </div>
  );
}
```

---

## Caching Strategy

### Why Caching is Critical:

1. **Horizons data doesn't change** - Orbital elements are deterministic
2. **Reduce server load** - Be a good API citizen
3. **Improve performance** - Instant page loads
4. **Offline capability** - PWA functionality

### Implementation:

```typescript
// lib/horizonsCache.ts
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedData {
  data: VectorData[];
  timestamp: number;
  params: {
    startDate: string;
    endDate: string;
    stepSize: string;
  };
}

export async function getCachedOrFetch(
  startDate: string,
  endDate: string,
  stepSize: string
): Promise<VectorData[]> {
  const cacheKey = `horizons_${startDate}_${endDate}_${stepSize}`;
  
  // Check cache
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    const parsedCache: CachedData = JSON.parse(cached);
    if (Date.now() - parsedCache.timestamp < CACHE_DURATION) {
      console.log('Using cached Horizons data');
      return parsedCache.data;
    }
  }
  
  // Fetch fresh data
  console.log('Fetching fresh Horizons data');
  const vectors = await fetchHorizonsVectors(startDate, endDate, stepSize);
  
  // Cache it
  const cacheData: CachedData = {
    data: vectors,
    timestamp: Date.now(),
    params: { startDate, endDate, stepSize }
  };
  localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  
  return vectors;
}
```

---

## Next Steps: Implementation Roadmap

### Phase 1: API Integration (Days 1-2)
- [ ] Create `/lib/horizons-api.ts` wrapper
- [ ] Test Lookup API for 3I/ATLAS identifier
- [ ] Test Main API for vector data
- [ ] Implement data parsing functions
- [ ] Add error handling & retries

### Phase 2: Three.js Scene (Days 3-4)
- [ ] Create basic scene with Sun
- [ ] Plot 3I/ATLAS trajectory
- [ ] Add orbital path visualization
- [ ] Implement camera controls
- [ ] Add date/time display

### Phase 3: Interactivity (Days 5-6)
- [ ] Timeline scrubber
- [ ] Play/pause controls
- [ ] Speed controls (1x, 10x, 100x)
- [ ] Camera presets (top view, side view, comet POV)
- [ ] Information overlay

### Phase 4: Polish (Day 7)
- [ ] Add planets (Mars, Earth) for context
- [ ] Particle system for coma
- [ ] Trail effect for tail
- [ ] Responsive design
- [ ] Loading states & error handling

---

## API Key Storage (For Future Features)

While not needed for Horizons, your NASA API key should be stored securely:

```env
# .env.local
NEXT_PUBLIC_NASA_API_KEY=69REZf7nyHSgkTZGz79UbSUeooqfAmU7UuCH53o6

# Future uses:
# - Mars Weather API
# - APOD (Astronomy Picture of the Day)
# - Earth imagery
# - Neo (Near Earth Objects) API
```

---

## Conclusion

**✅ READY TO BUILD:**
1. No authentication required for Horizons
2. Use Horizons Lookup API to find 3I/ATLAS SPK-ID
3. Use Horizons Main API (GET) for vector data
4. Parse vectors into Three.js coordinates
5. Cache aggressively to reduce API load

**🚀 LET'S START CODING!**

The foundation is solid - we have all the information needed to build the real-time 3D tracker.

---

*Document Version: 1.0*  
*Last Updated: October 1, 2025*  
*Ready for implementation*
