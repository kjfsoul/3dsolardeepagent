# AI DEV DIAGNOSIS PROMPT - Earth Position Skipping Bug

## Context

The 3I/ATLAS flight tracker displays solar system bodies (Sun, Earth, Mars, Jupiter, etc.) and a comet (3I/ATLAS) in real-time 3D visualization. Users report that **Earth jumps to TWO DIFFERENT POSITIONS on the same dates**: September 7, 2025 and November 14, 2025.

## Problem

When scrubbing the timeline to September 7 or November 14, 2025, Earth appears in two different positions instead of a consistent single position. The user provided screenshots showing Earth at different locations on what should be the same date.

## Critical Clue

User mentioned these dates are "approximately 67 to 68 days from the origin" which suggests the skipping pattern repeats at regular intervals.

## What's Been Tried

### Attempt 1: Data Smoothing (FAILED)

- Added `smoothEphemerisData()` function in `horizons-api.ts` (lines 309-363)
- Integrated smoothing into atlas data loading pipeline in `solar-system-data.ts` (line 140)
- Targeted Sept 7, Nov 14 and surrounding dates with aggressive interpolation
- **Result**: Still skipping

### Attempt 2: Planet Index Modulo Fix (PARTIAL)

- **File:** `SceneContent.tsx` line 119
- **Changed from:** `const planetIndex = Math.floor((idx / 4) % trajectory.length);`
- **Changed to:** `const clampedIndex = Math.min(planetIndex, trajectory.length - 1);`
- **Also fixed:** `Atlas3DTrackerEnhanced.tsx` bodyPositionAt() function (lines 95-102)
- **Result**: Slight improvement but still skipping

### Attempt 3: Removed Complex Interpolation (FAILED)

- Simplified frame advancement logic in `Atlas3DTrackerEnhanced.tsx`
- Removed delta-checking and lerp smoothing that was added earlier
- **Result**: No change

## Current Code Structure

### Data Loading

- **File:** `solar-system-data.ts`
- Planet data fetched from `/public/data/SOLAR_SYSTEM_POSITIONS.json`
- Comet data fetched from `/public/data/3I_ATLAS_positions_parsed.json`
- Planet data is **DAILY** (one entry per day, 275 total)
- Comet data is **6-hourly** (4 entries per day)

### Index Calculation

- **File:** `SceneContent.tsx` lines 112-127

```typescript
function getPlanetPos(trajectory: VectorData[], idx: number): [number, number, number] {
  const planetIndex = Math.floor(idx / 4);  // Convert 6-hourly comet index to daily planet index
  const clampedIndex = Math.min(planetIndex, trajectory.length - 1);
  const frame = trajectory[clampedIndex];
  // ...
}
```

### Animation Loop

- **File:** `Atlas3DTrackerEnhanced.tsx` lines 180-190

```typescript
setCurrentIndex((prevIndex) => {
  const increment = speed * deltaTime * 2.0;
  const nextIndex = prevIndex + increment;
  if (nextIndex >= atlasData.length - 1) {
    return 0;  // Loop back to start
  }
  return nextIndex;
});
```

## Key Files to Investigate

1. **`code_artifacts/3iatlas-flight-tracker/frontend/src/components/SceneContent.tsx`**
   - Lines 112-127: Planet position calculation
   - Lines 340-362: Comet 3D rendering

2. **`code_artifacts/3iatlas-flight-tracker/frontend/src/components/Atlas3DTrackerEnhanced.tsx`**
   - Lines 95-102: `bodyPositionAt()` helper
   - Lines 180-190: Frame advancement logic
   - Lines 242-258: Planet candidate positions for focus

3. **`code_artifacts/3iatlas-flight-tracker/frontend/src/lib/solar-system-data.ts`**
   - Lines 118-145: Atlas data loading and smoothing

4. **`code_artifacts/3iatlas-flight-tracker/frontend/src/lib/horizons-api.ts`**
   - Lines 309-363: Data smoothing function

## Data Structure

### JSON Data Files

- `/public/data/SOLAR_SYSTEM_POSITIONS.json` - Planet ephemeris
- `/public/data/3I_ATLAS_positions_parsed.json` - Comet ephemeris

Both use this format:

```json
{
  "date": "A.D. 2025-Sep-07 00:00:00.0000",
  "position": { "x": 0.970, "y": -0.272, "z": 0.0 },
  "velocity": { "vx": 0.004, "vy": 0.016, "vz": 0.0 }
}
```

## Hypothesis

The skip likely occurs because:

1. **Data mismatch**: Planet and comet trajectories have different sampling rates (daily vs 6-hourly)
2. **Index mapping issue**: The conversion from comet index to planet index (`idx / 4`) may have edge cases
3. **Rendering race condition**: Multiple renders with different indices before state updates
4. **Data gaps**: Missing entries in the JSON files at those specific dates

## Debugging Instructions

### Step 1: Verify Data Integrity

```bash
cd code_artifacts/3iatlas-flight-tracker/frontend/public/data
jq '[.[] | select(.object == "Earth (399)" and (.date | contains("2025-Sep-07")))]' SOLAR_SYSTEM_POSITIONS.json
```

Should return exactly ONE entry for Earth on Sept 7.

### Step 2: Add Console Logging

Add this to `SceneContent.tsx` getPlanetPos() function:

```typescript
const planetIndex = Math.floor(idx / 4);
console.log(`[DEBUG] Comet idx: ${idx}, Planet idx: ${planetIndex}, Date: ${trajectory[planetIndex]?.date}`);
```

### Step 3: Check Render Frequency

Add to `Atlas3DTrackerEnhanced.tsx` animation loop:

```typescript
console.log(`[ANIMATION] currentIndex: ${nextIndex}, speed: ${speed}, deltaTime: ${deltaTime}`);
```

### Step 4: Visual Inspection

Open browser console and watch the logs while scrubbing to Sept 7 and Nov 14. Look for:

- Multiple renders with different indices
- Index jumping backwards
- Data lookup returning undefined

## Expected Behavior

Earth should move smoothly in its orbit, appearing at ONE consistent position per date. No sudden jumps, teleports, or duplicate positions.

## Success Criteria

- [ ] Earth position is consistent when scrubbing to Sept 7, 2025
- [ ] Earth position is consistent when scrubbing to Nov 14, 2025
- [ ] No console errors or warnings
- [ ] Smooth orbital motion throughout entire timeline

## Branch Information

- **Feature Branch:** `feature/instructions-fixes`
- **All changes on feature branch, NOT merged to main**
- **Preview URL:** Check latest Vercel deployment with `vercel ls`

## Additional Context

User also mentioned:

- Countdown correction to Oct 29 instead of Oct 28
- Enhanced lighting for perihelion
- Post-processing effects
- These are separate features and working correctly

Focus ONLY on the Earth position skipping issue.

---

**Your mission:** Root cause the Earth position skipping and provide a minimal fix that ensures Earth appears at one consistent position per date.

---

# SECOND ISSUE: Playback Controls Visibility

## Problem

Playback controls (bottom control bar) **do not appear in default view** but magically appear when the user zooms out the browser window. This should NEVER happen - controls should always be visible regardless of viewport zoom level.

## Expected Behavior

- Controls should be **permanently visible** at the bottom of the screen
- No interaction with 3D camera scale context
- Fixed to viewport, not affected by zoom levels
- Always clickable/interactive

## Current Implementation

### CSS (globals.css)

```css
.controls-overlay {
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  pointer-events: auto;
}
```

### Usage

Controls are rendered inside `<Atlas3DTrackerEnhanced>` component.

## Suspected Root Cause

Controls might be:

1. **Inside the 3D Canvas context** - affected by 3D camera transformations
2. **Z-index issue** - hidden behind 3D scene
3. **Overflow hidden** - clipped by parent containers
4. **Positioning conflict** - absolute within wrong container

## Files to Check

1. **`code_artifacts/3iatlas-flight-tracker/frontend/src/components/Atlas3DTrackerEnhanced.tsx`**
   - Where `<PlaybackControls>` is rendered
   - Parent container structure

2. **`code_artifacts/3iatlas-flight-tracker/frontend/src/App.tsx`**
   - Layout structure
   - How Canvas and controls are positioned

3. **`code_artifacts/3iatlas-flight-tracker/frontend/src/styles/globals.css`**
   - Lines 19-45: layout-container, main-content, controls-overlay

## Debugging Steps

### Step 1: Verify DOM Structure

```javascript
// In browser console on live site:
document.querySelector('.controls-overlay')
// Should exist and be visible

getComputedStyle(document.querySelector('.controls-overlay'))
// Check: z-index, position, display, visibility, opacity
```

### Step 2: Check Parent Overflow

```javascript
document.querySelector('.layout-container').style.overflow
document.querySelector('.main-content').style.overflow
// Should NOT be 'hidden' or 'clip'
```

### Step 3: Verify 3D Canvas Position

```javascript
document.querySelector('canvas')
// Check if it overlays controls
```

## Hypothesis

Controls are likely:

- Rendered INSIDE the Canvas element or its container
- The Canvas has `position: absolute` and covers everything
- Controls have lower stacking order than 3D scene

## Potential Fixes

### Option 1: Move controls outside Canvas container

```tsx
<div className="layout-container">
  <Canvas>{/* 3D scene */}</Canvas>
  <div className="controls-overlay"> {/* OUTSIDE Canvas */}
    <PlaybackControls />
  </div>
</div>
```

### Option 2: Increase z-index

```css
.controls-overlay {
  z-index: 9999; /* Much higher */
}
```

### Option 3: Check parent overflow

```css
.layout-container {
  overflow: visible !important;
}
.main-content {
  overflow: visible !important;
}
```

## Success Criteria

- [ ] Controls visible on page load at default zoom
- [ ] Controls visible when browser zoom changes
- [ ] Controls clickable regardless of viewport state
- [ ] Controls stay fixed to bottom of viewport
- [ ] No magic appearing/disappearing

---

**Combined Mission:** Fix BOTH the Earth position skipping AND controls visibility issues with minimal, clean solutions.

---

# CRITICAL UPDATE: Modulo Fix Already Applied!

## Status: PARTIAL FIX ALREADY IN CODE

The planet indexing logic fix was **already committed** in commit `b160d65` on branch `feature/instructions-fixes`:

- ✅ Removed modulo operator from `getPlanetPos()` in `SceneContent.tsx`
- ✅ Added clamping with `Math.min(planetIndex, trajectory.length - 1)`
- ✅ Fixed in `Atlas3DTrackerEnhanced.tsx` `bodyPositionAt()` function

**However:** User reports skipping STILL HAPPENS despite this fix.

## This Means:

The modulo wrapping was NOT the root cause, or there are MULTIPLE issues:

### Hypothesis A: Rendering Race Condition
- Multiple renders with stale indices
- React state updates not synced with 3D rendering
- Need to verify how `currentIndex` propagates to planet rendering

### Hypothesis B: Data Consistency Issue
- Missing or duplicate data entries in JSON files
- Date parsing mismatch between comet and planet data
- Check if both datasets span the same date range

### Hypothesis C: Another Index Calculation Location
- There may be MORE places calculating planet positions
- Check ALL calls to `getPlanetPos()` and `bodyPositionAt()`
- Search for other division-by-4 calculations

## New Focus Areas:

1. **Verify the fix is actually running** - Add console logs to see what indices are being used
2. **Check React re-renders** - Too many renders might cause flicker
3. **Data integrity** - Verify Earth has consistent data for Sept 7 and Nov 14
4. **Search for other planet position calculations** - Might be multiple code paths

The modulo fix was good thinking but insufficient. Need deeper investigation.
