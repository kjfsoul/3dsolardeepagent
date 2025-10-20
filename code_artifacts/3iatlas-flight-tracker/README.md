
# 3I/ATLAS Immersive Flight Tracker

An immersive 3D visualization experience for tracking comet 3I/ATLAS (C/2025 N1), the third confirmed interstellar visitor to our solar system. Built with React Three Fiber and powered by NASA JPL Horizons data.

![3I/ATLAS Flight Tracker](docs/screenshot.png)

## ✨ Features

### 🚀 Core Visualization
- **"Riding with ATLAS" Camera**: Experience the journey from the comet's perspective
- **Real-time Trajectory**: Pre-computed trajectory data from July 1, 2025 through March 31, 2026
- **Accurate Orbital Mechanics**: Based on JPL Horizons orbital elements (e=6.14, q=1.356 AU)
- **Cinematic Transitions**: Smooth camera movements for key events

### 🌟 Celestial Bodies
- **Sun**: Central reference point with realistic glow
- **Earth, Mars, Jupiter**: Full planetary orbits for context
- **3I/ATLAS Comet**: Detailed model with greenish nucleus and tail

### 🎯 Key Events
1. **Discovery** (July 1, 2025) - ATLAS telescope detection
2. **Mars Flyby** (October 3, 2025) - Close approach at 0.19 AU
3. **Perihelion** (October 29, 2025) - Maximum speed of 68 km/s
4. **Jupiter Approach** (March 16, 2026) - Final planetary encounter

### 📊 Interactive Features
- **Real-time Telemetry HUD**: Distance, velocity, date
- **Timeline Navigation**: Jump to key events with one click
- **Educational Content**: Rich markdown content for each milestone
- **Playback Controls**: Play/pause, speed adjustment (0.5x-25x)
- **Camera Modes**: Follow mode or free orbit controls

### 📱 Mobile Responsive
- Adaptive quality based on device
- Touch-friendly controls
- Optimized rendering for 30+ FPS on mobile

## 🏗️ Architecture

```
3iatlas-flight-tracker/
├── backend/
│   └── generate_atlas_trajectory.py    # NASA Horizons API client
├── frontend/
│   ├── public/
│   │   └── data/
│   │       ├── trajectory_static.json  # Pre-computed trajectories
│   │       └── timeline_events.json    # Event markers with content
│   ├── src/
│   │   ├── components/
│   │   │   ├── Atlas3DTrackerEnhanced.tsx  # Main component
│   │   │   ├── FollowCamera.tsx            # Camera system
│   │   │   ├── Comet3D.tsx                 # Comet model
│   │   │   ├── CelestialBodies.tsx         # Sun & planets
│   │   │   ├── TrajectoryTrail.tsx         # Path visualization
│   │   │   ├── Starfield.tsx               # Background stars
│   │   │   ├── TelemetryHUD.tsx            # Overlay UI
│   │   │   ├── PlaybackControls.tsx        # User controls
│   │   │   └── TimelinePanel.tsx           # Event timeline
│   │   ├── types/
│   │   │   └── trajectory.ts               # TypeScript types
│   │   └── styles/
│   │       └── globals.css                 # Global styles
│   └── package.json
└── docs/
    ├── INTEGRATION.md                       # Integration guide
    └── API.md                               # API documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd 3iatlas-flight-tracker
```

2. **Generate trajectory data**
```bash
cd backend
python3 generate_atlas_trajectory.py
```

This will create:
- `frontend/public/data/trajectory_static.json` (trajectory data)
- `frontend/public/data/timeline_events.json` (event markers)

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Start development server**
```bash
npm run dev
```

5. **Open browser**
Navigate to `http://localhost:5173`

## 📦 Production Build

```bash
cd frontend
npm run build
npm run preview
```

The optimized production build will be in `frontend/dist/`.

## 🔧 Configuration

### Backend Configuration

Edit `backend/generate_atlas_trajectory.py`:

```python
# Date range
DISCOVERY_DATE = "2025-07-01"
CURRENT_DATE = "2025-10-20"
FUTURE_DATE = "2026-03-31"

# 3I/ATLAS SPK-ID
ATLAS_SPK_ID = "1004083"
```

### Frontend Configuration

Edit `frontend/src/components/Atlas3DTrackerEnhanced.tsx`:

```typescript
<Atlas3DTrackerEnhanced
  autoPlay={true}           // Start playing automatically
  initialSpeed={2}          // Default playback speed
  initialFollowMode={true}  // Start in "Riding with ATLAS" mode
/>
```

## 🎮 User Controls

### Playback Controls (Bottom Center)
- **Play/Pause**: Toggle animation
- **Speed**: Adjust from 0.5x to 25x
- **Timeline Slider**: Scrub through time
- **Reset**: Return to beginning
- **Camera Mode**: Toggle between Follow and Free Cam

### Timeline Events (Left Side)
- Click any event to jump to that date
- Educational content appears in bottom panel
- Triggers cinematic camera transitions

### Camera Controls (Free Cam Mode)
- **Left Mouse**: Rotate view
- **Right Mouse**: Pan view
- **Scroll Wheel**: Zoom in/out
- **Touch**: Pinch to zoom, drag to rotate

## 📊 Data Sources

### NASA JPL Horizons System
- **Orbital Elements**: From JPL Solution #26
- **Data Arc**: 603 observations over 104 days
- **Accuracy**: Sub-kilometer precision

### Fallback Orbital Mechanics
If NASA API is unavailable, the system uses:
- Hyperbolic Kepler's equation solver
- Real JPL orbital elements (e=6.14, q=1.356 AU)
- Perihelion date: October 29, 2025

### Educational Content
Based on comprehensive knowledge base covering:
- Discovery and designation
- Physical characteristics
- Scientific significance
- Origin and age (7+ billion years)
- Public viewing opportunities

## 🌐 Integration

### Standalone Deployment
Deploy the built frontend to any static hosting:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

### Integration into Existing Project
See [docs/INTEGRATION.md](docs/INTEGRATION.md) for detailed instructions on integrating into:
- Next.js applications
- React applications
- Existing 3iatlas.mysticarcana.com site

## 🔄 Data Updates

### Twice-Daily Polling (Optional)

Set up a cron job to update trajectory data:

```bash
# Run at 6 AM and 6 PM
0 6,18 * * * cd /path/to/backend && python3 generate_atlas_trajectory.py --poll
```

This will:
1. Check for new data beyond current dataset
2. Fetch from NASA Horizons API
3. Append to existing static data
4. Regenerate JSON files

## 🎨 Customization

### Visual Style
Edit colors in `frontend/tailwind.config.js`:
```javascript
colors: {
  'atlas-green': '#00ff88',  // Trajectory color
  'atlas-blue': '#00aaff',   // UI accents
  'atlas-dark': '#0a0a0a',   // Background
}
```

### Comet Appearance
Edit `frontend/src/components/Comet3D.tsx`:
```typescript
// Nucleus color
<meshStandardMaterial
  color="#00ffaa"          // Greenish nucleus
  emissive="#00ff88"       // Glow color
  emissiveIntensity={2.0}  // Glow strength
/>
```

### Camera Behavior
Edit `frontend/src/components/FollowCamera.tsx`:
```typescript
offset={new THREE.Vector3(5, 3, 5)}  // Camera position relative to comet
smoothness={0.05}                     // Interpolation speed
```

## 🐛 Troubleshooting

### Comet not visible
- Check trajectory data loaded correctly
- Verify date range includes current playback position
- Check browser console for errors

### Performance issues
- Reduce star count in Starfield component
- Disable planetary orbits
- Lower playback speed
- Use free cam mode instead of follow mode

### Data loading fails
- Verify JSON files exist in `frontend/public/data/`
- Run `python3 generate_atlas_trajectory.py` to regenerate
- Check browser network tab for 404 errors

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Credits

- **NASA JPL Horizons System**: Trajectory data
- **ATLAS Telescope**: Comet discovery
- **React Three Fiber**: 3D rendering framework
- **Three.js**: WebGL library

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Experience the journey of a lifetime - ride with 3I/ATLAS as it passes through our solar system!** 🌠
