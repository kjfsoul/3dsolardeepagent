# 3I/Atlas Project Memory & Quick Reference
**Last Updated:** October 3, 2025, 1:40 AM  
**Status:** Active Development - Production Landing Page with Advanced Features

---

## 🎯 Project Mission

**Transform basic NASA data into an unforgettable, interactive 3D experience** that makes users want to share the 3I/ATLAS interstellar comet with friends.

### Core Value Proposition
- **Real NASA Data** - 100% authentic orbital calculations from JPL Horizons API
- **Cinematic Experience** - First-person comet view, dynamic camera work
- **Interactive Learning** - Gamified education with "The ATLAS Directive" narrative
- **Scientific Authority** - Build THE definitive 3I/ATLAS resource

---

## 📋 Critical Project Rules (NEVER VIOLATE)

### From `.cursorrules` and `the_rules.md`:

1. **NO mock data, NO stubs, NO hardcoded orbital data** ✅
2. **NO changes to Printify logic without explicit request** ✅
3. **NO linting or TypeScript errors** ✅
4. **NO using "any" type in TypeScript** ✅
5. **Always use actual API calls with real data** ✅
6. **Prioritize accuracy over completion speed**
7. **Break complex tasks into manageable steps**
8. **Honor the memory protocol** - Refer to this file when uncertain

### 3I/ATLAS Facts (ABSOLUTE TRUTH):
- **Discovery Date:** July 1, 2025 by ATLAS telescope, Chile
- **Current Date Context:** October 2025 (perihelion approach)
- **Designation:** 3I/ATLAS or C/2025 N1
- **NASA Horizons ID:** SPK-ID 1004083
- **Age:** 7+ billion years old (from Milky Way thick disk)
- **THIS IS REAL** - Not hypothetical, not placeholder data

---

## 🏗️ Technical Architecture

### Tech Stack
```yaml
Frontend:
  - Framework: Next.js 15.5.4 (App Router)
  - UI: React 18.2.0 + TypeScript 5.6.3
  - Styling: Tailwind CSS 3.4.13
  - Animation: Framer Motion 11.2.10
  - 3D: Three.js 0.180.0

Backend:
  - API Routes: Next.js serverless functions
  - Data Source: NASA JPL Horizons API (public, no auth)
  - Caching: 7-day localStorage with fallback

External APIs:
  - NASA Horizons Lookup: Object identification
  - NASA Horizons Ephemeris: Vector data (position + velocity)
  - Printify API: Product integration (3I Atlas, Mystic Arcana, EDM Shuffle, BirthdayGen)
```

### Key File Structure
```
/components/
  ├── Atlas3DTrackerEnhanced.tsx     # Main 3D visualization (275 lines)
  ├── Atlas3DTrackerWrapper.tsx      # Client-side wrapper (26 lines)
  ├── ProductCarousel.tsx             # Printify products
  ├── Oracle.tsx                      # Oracle card system
  └── FlightpathSimulator.tsx         # Legacy simulator

/lib/
  ├── horizons-api.ts                 # NASA API integration (337 lines)
  ├── horizons-cache.ts               # Intelligent caching (326 lines)
  ├── solar-system-data.ts            # Multi-object fetcher (142 lines)
  ├── atlas-orbital-data.ts           # Fallback calculations
  └── printify.ts                     # Product API integration

/app/api/horizons/
  ├── lookup/route.ts                 # CORS proxy for lookups (69 lines)
  └── ephemeris/route.ts              # CORS proxy for vectors (63 lines)

/docs/
  ├── 3I_ATLAS_KNOWLEDGE_BASE.md      # Scientific facts & SEO content
  ├── PROJECT_HANDOFF_COMPLETE.md     # Complete project state
  ├── 3D_TRACKER_IMPLEMENTATION.md    # Implementation details
  └── CONTENT_STRATEGY_DOMINANCE.md   # SEO/GEO strategy
```

---

## 🔧 Current Implementation Status

### ✅ COMPLETED (Phase 1)

**NASA Horizons Integration:**
- Direct API integration with CORS proxy
- Multi-object fetching (7 celestial bodies: Sun, Mercury, Venus, Earth, Mars, Jupiter, Saturn, 3I/ATLAS)
- Real-time data caching (7-day duration)
- Fallback orbital calculations using Keplerian mechanics
- SPK-ID: 1004083 for 3I/ATLAS

**3D Visualization:**
- Three.js scene with proper lighting
- Multiple celestial objects rendered
- Interactive controls (Play/Pause/Speed/Camera)
- Mouse rotation and zoom (OrbitControls)
- Responsive UI with proper sizing
- Timeline progression (Oct 1-31, 2025)

**Features:**
- Green comet rendering (0x00ff88) with glow
- Orbital path visualization
- Real NASA position updates each frame
- Camera views: Default, Follow Comet, Top-Down, Closeup

**Printify Integration:**
- Multi-shop product fetching (4 brands)
- Dynamic product carousels
- Real-time pricing and descriptions
- Automatic image updates

### 🔄 IN PROGRESS (Current Priorities)

**Critical Bug Fixes Needed:**
1. **Sun Movement Issue** - Sun drifts instead of staying at origin [0,0,0]
2. **Camera Follow Bugs** - "Follow 3I/ATLAS" loses comet tracking
3. **Motion Perception** - 3I/ATLAS movement not visually apparent
4. **View Switching** - Camera state doesn't reset properly

**Visual Enhancements:**
- Comet trail/glow effects (basic glow exists, needs improvement)
- Better lighting and shadows
- Particle systems for space dust/coma

### 📋 PLANNED (Phase 3)

**The ATLAS Directive Narrative Engine:**
- Interactive story-driven experience
- Chrono-Token system for progression
- Branching narrative tree (JSON-based)
- Integration with 3D tracker (animation_key prop system)
- User data capture and engagement

**Advanced Features:**
- 2D radar/map system (overhead trajectory view)
- Interactive trajectory editor ("what-if" scenarios)
- Cinematic camera system (first-person comet POV)
- Advanced particle effects (realistic comet tail)
- Achievement/gamification system
- AR sky finder (mobile WebXR)

**Supporting Pillars:**
- Live "Broadcasts" section (automated article fetching)
- "Ask ATLAS" AI chatbot (GPT-4 with knowledge base)
- Citizen science observation network
- Community hub with photo submissions
- Multi-language support
- Accessibility features (WCAG 2.1 AAA)

---

## 🚨 Known Issues & Technical Debt

### Current Bugs (From PROJECT_HANDOFF_COMPLETE.md)
1. **Camera System**: View switching doesn't reset properly
2. **Motion Perception**: 3I/ATLAS movement not visually apparent in 31-day span
3. **Origin Drift**: Sun appears to move instead of staying fixed at [0,0,0]
4. **Console Logging**: Excessive logs (reduced but still present)

### Performance Issues
- Animation loop may be inefficient with 7 objects updating
- Three.js objects not properly disposed on unmount
- Multiple simultaneous API requests may overwhelm on first load

### Code Quality
- Some edge cases in error handling not covered
- Inline comments could be improved
- Some error states need better UX feedback

---

## 🎯 Implementation Patterns

### API Call Pattern
```typescript
// Always use via proxy to avoid CORS
const response = await fetch('/api/horizons/ephemeris?' + params);
const data = await response.json();

// Check for cached data first
const cached = getCached3IAtlasVectors(startDate, endDate);
if (cached) return cached;

// Parse NASA Horizons response format
const vectors = parseVectorData(result);
```

### 3D Position Updates (Synchronized)
```typescript
// ALL objects update from same timeline index
for (const [key, vectors] of Object.entries(solarSystemData)) {
  const vec = vectors[timelineIndex];
  mesh.position.set(vec.position.x, vec.position.z, -vec.position.y);
}
```

### Printify Integration (DO NOT MODIFY)
```typescript
// Shop mapping system - maintained separately
const SHOP_TITLE_MAP: Record<string, string> = {
  'https://3iatlas.printify.me': '3iAtlas',
  'https://mystic-arcana-pop-up.printify.me': 'Mystic Arcana Pop-up',
  // ... other shops
};
```

---

## 📊 Project Metrics & Goals

### Success Criteria
- **Search Rankings:** #1 for "3I/ATLAS tracker" and related keywords
- **Traffic Goal:** 500K-1M visitors during October 2025 perihelion
- **Engagement:** 8-12 minute average session time
- **Community:** 10,000+ registered users submitting observations
- **Authority:** 500+ backlinks from DA 50+ sites

### Current Achievements
- ✅ Real NASA data integration (100% authentic)
- ✅ Functional 3D visualization with 7 objects
- ✅ Working control system with multiple camera views
- ✅ Printify product integration across 4 brands
- ✅ Responsive design
- ✅ 7-day intelligent caching

---

## 🚀 Immediate Next Steps (Priority Order)

### Priority 1: Fix Motion & Accuracy (CURRENT)
1. Lock Sun at origin [0,0,0] in animation loop
2. Fix "Follow 3I/ATLAS" camera tracking
3. Increase apparent motion (time scale adjustment)
4. Add visible trail segments for comet

### Priority 2: Visual Polish
1. Enhanced comet glow/bloom effects
2. Particle trail system
3. Better lighting model
4. Scale & distance improvements

### Priority 3: Narrative Integration
1. Complete narrative_tree.json generation
2. Build AtlasDirective component
3. Implement Chrono-Token UI
4. Connect animation_key prop to 3D tracker

### Priority 4: Supporting Features
1. Deploy "Broadcasts" automated article system
2. Integrate "Ask ATLAS" chatbot (OpenAI GPT-4)
3. Add observation submission portal
4. Implement gamification badges

---

## 💡 Development Guidelines

### When Making Changes
1. **Always retrieve knowledge first** using `byterover-retrieve-knowledge`
2. **Check existing patterns** in similar components
3. **Maintain code quality** - no TypeScript errors, no linting issues
4. **Store learnings** using `byterover-store-knowledge` after completion
5. **Test incrementally** - don't assume success without confirmation
6. **Honor file restrictions** - architect mode can only edit `.md` files

### Testing Checklist
- [ ] TypeScript compiles without errors
- [ ] No linting warnings
- [ ] API calls return expected data
- [ ] Three.js scene renders properly
- [ ] Controls respond to user input
- [ ] Mobile responsive
- [ ] Production build succeeds

### Communication Protocol
- Use clear, technical language (avoid "Great", "Certainly", "Okay")
- Be direct and to-the-point
- Wait for user confirmation after each tool use
- Formulate final results without questions (use `attempt_completion`)
- For uncertainties, use `ask_followup_question` with specific suggestions

---

## 📚 Key Documentation References

### Primary Docs (Must Read)
1. **3I_ATLAS_KNOWLEDGE_BASE.md** - All scientific facts, SEO keywords
2. **PROJECT_HANDOFF_COMPLETE.md** - Complete current state, issues, next steps
3. **3D_TRACKER_IMPLEMENTATION.md** - Technical implementation details
4. **CONTENT_STRATEGY_DOMINANCE.md** - SEO/GEO strategy, feature roadmap

### Implementation Guides
- **HORIZONS_API_ANALYSIS.md** - NASA API integration patterns
- **HORIZONS_ENHANCEMENT_PLAN.md** - Advanced feature planning
- **The ATLAS Directive_ Final Consolidated Execution Plan.md** - Phased dev plan

### Rules & Standards
- **.cursorrules** - Critical project constraints
- **the_rules.md** - Development philosophy
- **AGENTS.md** - Memory protocol guidelines

---

## 🔐 Environment Variables

```env
# Printify Integration
PRINTIFY_API_TOKEN=<provided>
NEXT_PUBLIC_3IATLAS_BASE=https://3iatlas.printify.me/
NEXT_PUBLIC_ARCANA_BASE=https://mystic-arcana-pop-up.printify.me/
NEXT_PUBLIC_EDM_BASE=https://edm-shuffle-pop-up.printify.me/
NEXT_PUBLIC_BDAY_BASE=https://birthdaygen-popup.printify.me/

# NASA (for future features, not needed for Horizons)
NASA_API_KEY=69REZf7nyHSgkTZGz79UbSUeooqfAmU7UuCH53o6

# Development
PORT=3030
```

---

## 🎓 Learning Points

### NASA Horizons API
- **No authentication required** for Horizons (unlike general NASA API)
- **Two-step process**: Lookup SPK-ID → Fetch vectors
- **CORS issues**: Solved with Next.js API route proxies
- **Response format**: Text-based with $$SOE/$$EOE markers
- **Units**: AU-D (Astronomical Units, Days) preferred
- **Reference frame**: ICRF (inertial frame) for stability

### Three.js Patterns
- **Client-only rendering**: Use dynamic imports with `ssr: false`
- **Coordinate system**: Y-up in Three.js, convert from Horizons Z-up
- **Animation loop**: Use `requestAnimationFrame` for smooth 60fps
- **Memory management**: Dispose geometries/materials on unmount
- **OrbitControls**: Enable damping for smooth camera movement

### Next.js 15 App Router
- **Server Components by default**: Wrap client components properly
- **API routes**: Use `/app/api/` directory structure
- **Dynamic imports**: Required for Three.js and other client-only libs
- **Image optimization**: Use Next.js `<Image>` component
- **Caching**: Leverage Next.js built-in caching with revalidation

---

## 📞 Quick Commands

```bash
# Development
npm run dev        # Start dev server on port 3030

# Production
npm run build      # Build for production
npm start          # Start production server

# Linting (disabled in starter, but we maintain clean code)
npm run lint       # Verify code quality
```

---

## 🎯 Success Indicators

You'll know the project is on track when:
- ✅ All API calls return real NASA data (no mocks)
- ✅ TypeScript compiles without errors
- ✅ 3D visualization shows all 7 objects moving
- ✅ Users spend 8+ minutes exploring features
- ✅ Camera controls respond smoothly
- ✅ Printify products load and display correctly
- ✅ Mobile experience is responsive
- ✅ Search engines index and rank content

---

## 🔄 Update Protocol

When this file needs updating:
1. Add new learnings to relevant sections
2. Update "Last Updated" timestamp
3. Mark completed items with ✅
4. Add new issues to "Known Issues"
5. Store critical patterns using `byterover-store-knowledge`

---

**This file is the source of truth for project context. When uncertain, start here.**
