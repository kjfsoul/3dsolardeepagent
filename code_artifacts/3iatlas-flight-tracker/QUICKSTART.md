# 🚀 Quick Start Guide

Get the 3I/ATLAS Flight Tracker running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Python 3.8+ installed
- Git (to clone or copy files)

## Step 1: Generate Trajectory Data (1 minute)

```bash
cd backend
python3 generate_atlas_trajectory.py
```

Expected output:
```
======================================================================
3I/ATLAS TRAJECTORY DATA GENERATION
======================================================================
✓ Fetched 1093 data points for 3I/ATLAS
✓ Generated 274 points for earth
✓ Generated 274 points for mars
✓ Generated 137 points for jupiter
✓ Static data saved
✓ Event markers saved
======================================================================
```

## Step 2: Install Dependencies (2 minutes)

```bash
cd ../frontend
npm install
```

## Step 3: Start Development Server (30 seconds)

```bash
npm run dev
```

## Step 4: Open in Browser

Navigate to: **http://localhost:5173**

## 🎮 Controls

- **Timeline Slider**: Scrub through time
- **Play/Pause**: Toggle animation
- **Speed**: Change playback speed (0.5x - 25x)
- **Camera Toggle**: Switch between "Riding with ATLAS" and Free Cam
- **Timeline Buttons (Left)**: Jump to key events
- **Mouse (Free Cam)**:
  - Left drag: Rotate
  - Right drag: Pan
  - Scroll: Zoom

## 🌟 Key Events to Try

Click these buttons on the left side:

1. **Discovery** (July 1, 2025)
2. **Mars Flyby** (October 3, 2025)
3. **Perihelion** (October 29, 2025) - Watch the glow effect!
4. **Jupiter Approach** (March 16, 2026)

## 📱 Test on Mobile

1. Get your local IP: `ifconfig` or `ipconfig`
2. Open on mobile: `http://YOUR_IP:5173`

## 🛠️ Troubleshooting

### Comet not visible?
- Check the timeline - you might be at a date before discovery
- Click "Reset" button to go to the beginning

### Performance issues?
- Try closing other browser tabs
- Reduce star count in Starfield component
- Use Free Cam instead of Follow mode

### Data loading fails?
- Make sure you ran `python3 generate_atlas_trajectory.py`
- Check that files exist in `frontend/public/data/`

### Port already in use?
```bash
npm run dev -- --port 5174
```

## 📦 Production Build

Ready to deploy?

```bash
npm run build
npm run preview
```

Output in: `frontend/dist/`

## 🔗 Next Steps

- **Integration**: See `docs/INTEGRATION.md`
- **Deployment**: See `docs/DEPLOYMENT.md`
- **API Reference**: See `docs/API.md`
- **Full README**: See `README.md`

## 🎨 Quick Customization

### Change Colors

Edit `frontend/tailwind.config.js`:
```javascript
colors: {
  'atlas-green': '#00ff88',  // Change to your color
}
```

### Change Initial Speed

Edit `frontend/src/App.tsx`:
```typescript
<Atlas3DTrackerEnhanced
  initialSpeed={5}  // Change from 2 to 5
/>
```

### Change Camera Position

Edit `frontend/src/components/FollowCamera.tsx`:
```typescript
offset={new THREE.Vector3(10, 5, 10)}  // Farther camera
```

## ✅ Success Checklist

- [ ] Data generated (check `frontend/public/data/`)
- [ ] Dependencies installed (check `node_modules/`)
- [ ] Dev server running (check http://localhost:5173)
- [ ] Comet visible and moving
- [ ] Timeline controls working
- [ ] Event buttons responsive
- [ ] Educational content displays

## 💡 Pro Tips

1. **Follow Mode**: Best for cinematic experience
2. **Free Cam**: Best for exploration
3. **2x Speed**: Good balance for viewing
4. **Perihelion Event**: Most dramatic visuals
5. **Mobile**: Hold phone horizontally

## 🚨 Common Errors

### "Cannot find module '@react-three/fiber'"
```bash
cd frontend
npm install
```

### "Failed to load trajectory data"
```bash
cd backend
python3 generate_atlas_trajectory.py
```

### "Port 5173 already in use"
```bash
npm run dev -- --port 5174
```

## 📞 Need Help?

1. Check the full README.md
2. Review docs/INTEGRATION.md
3. Open GitHub issue
4. Check browser console for errors

---

**Enjoy your journey with 3I/ATLAS!** 🌠

*Estimated time from start to finish: 5 minutes*
