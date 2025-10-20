#!/usr/bin/env python3
"""
🚀 ONE-CLICK PLANET UPDATER 🚀
================================
Add all planets to your 3I/ATLAS tracker in one command!

USAGE:
    python3 update_all_planets.py

CUSTOMIZATION (edit the config below):
    - Change date ranges
    - Add/remove planets
    - Adjust step sizes (more/fewer data points)
    - Toggle fallback calculations
"""

import sys
import os

# Add parent directory to path to import the generator
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from generate_atlas_trajectory import HorizonsAPIClient, OrbitalMechanicsCalculator
import json
from datetime import datetime

# ============================================================================
# 🎛️  CONFIGURATION - CUSTOMIZE THESE VALUES
# ============================================================================

CONFIG = {
    # Date range for trajectory data
    "start_date": "2025-07-01",
    "end_date": "2026-03-31",
    "current_date": "2025-10-20",

    # Objects to fetch (SPK-ID or name: config)
    # 💡 TIP: Comment out any line with # to exclude that object
    "objects": {
        # === Interstellar Visitor ===
        "1004083": {"name": "3I/ATLAS", "step": "6h", "color": "#00ffff"},
        
        # === Planets ===
        "199": {"name": "Mercury", "step": "1d", "color": "#8c7853"},
        "299": {"name": "Venus", "step": "1d", "color": "#ffc649"},
        "399": {"name": "Earth", "step": "1d", "color": "#4a90e2"},
        "499": {"name": "Mars", "step": "1d", "color": "#e27b58"},
        "599": {"name": "Jupiter", "step": "2d", "color": "#c88b3a"},
        "699": {"name": "Saturn", "step": "2d", "color": "#fad5a5"},
        "799": {"name": "Uranus", "step": "4d", "color": "#4fd0e0"},
        "899": {"name": "Neptune", "step": "4d", "color": "#4166f5"},
        "999": {"name": "Pluto", "step": "4d", "color": "#b8a793"},
        
        # === Major Asteroids (dwarf planets & largest asteroids) ===
        "Ceres": {"name": "Ceres", "step": "2d", "color": "#a89f91"},
        "20000004": {"name": "Vesta", "step": "2d", "color": "#b5a88f"},
        "20000002": {"name": "Pallas", "step": "2d", "color": "#9d9589"},
        
        # === Famous Comets ===
        # Uncomment these to add (may be far from Sun during this period):
        # "20002688": {"name": "Halley", "step": "4d", "color": "#88ccff"},
        # "900118": {"name": "Encke", "step": "2d", "color": "#99ddff"},
    },

    # Output file paths
    "output_trajectory": "../frontend/public/data/trajectory_static.json",
    "output_events": "../frontend/public/data/timeline_events.json",

    # Use fallback calculations if API fails?
    "use_fallback": True,
}

# ============================================================================
# 🚀 MAIN SCRIPT - NO NEED TO EDIT BELOW THIS LINE
# ============================================================================

def main():
    print("\n" + "="*70)
    print("🌟 3I/ATLAS COMPLETE SOLAR SYSTEM DATA GENERATOR 🌟")
    print("="*70)
    print(f"📅 Date Range: {CONFIG['start_date']} to {CONFIG['end_date']}")
    print(f"📍 Current Date: {CONFIG['current_date']}")
    print(f"🪐 Fetching {len(CONFIG['objects'])} objects")
    print("="*70 + "\n")

    api_client = HorizonsAPIClient()
    fallback_calc = OrbitalMechanicsCalculator()

    # Prepare data structure
    data = {
        "metadata": {
            "generated": datetime.now().isoformat(),
            "date_range": {
                "start": CONFIG["start_date"],
                "end": CONFIG["end_date"],
                "current": CONFIG["current_date"]
            },
            "units": {
                "distance": "AU",
                "velocity": "AU/day",
                "time": "ISO-8601"
            },
            "source": "NASA JPL Horizons System"
        }
    }

    # Fetch data for each object
    for idx, (spk_id, obj_config) in enumerate(CONFIG["objects"].items(), 1):
        obj_name = obj_config["name"]
        step_size = obj_config["step"]

        print(f"\n[{idx}/{len(CONFIG['objects'])}] Fetching {obj_name}...")

        # Fetch from Horizons API
        vectors = api_client.fetch_vectors(
            spk_id,
            CONFIG["start_date"],
            CONFIG["end_date"],
            step_size=step_size
        )

        # Use fallback if API failed and fallback is enabled
        if not vectors and CONFIG["use_fallback"]:
            print(f"⚠️  API failed for {obj_name}, using fallback calculations...")

            if spk_id == "1004083":  # 3I/ATLAS
                vectors = fallback_calc.generate_fallback_trajectory(
                    CONFIG["start_date"],
                    CONFIG["end_date"]
                )
            else:  # Planets
                # Extract hours from step size (e.g., "1d" -> 24, "2d" -> 48)
                hours = int(step_size.replace('d', '')) * 24 if 'd' in step_size else int(step_size.replace('h', ''))
                vectors = fallback_calc.generate_planet_orbit(
                    obj_name.lower(),
                    CONFIG["start_date"],
                    CONFIG["end_date"],
                    hours_step=hours
                )

        # Store data with lowercase key (e.g., "atlas", "earth", "mercury")
        data_key = obj_name.lower().replace("/", "").replace("-", "")
        data[data_key] = vectors

        print(f"✅ {obj_name}: {len(vectors)} data points")

    # Summary
    print("\n" + "="*70)
    print("📊 DATA GENERATION SUMMARY")
    print("="*70)
    for spk_id, obj_config in CONFIG["objects"].items():
        obj_name = obj_config["name"]
        data_key = obj_name.lower().replace("/", "").replace("-", "")
        point_count = len(data.get(data_key, []))
        print(f"{obj_name:20s}: {point_count:5d} points")
    print("="*70 + "\n")

    # Save trajectory data
    output_path = os.path.join(os.path.dirname(__file__), CONFIG["output_trajectory"])
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"✅ Trajectory data saved to: {output_path}")

    # Generate timeline events
    events_path = os.path.join(os.path.dirname(__file__), CONFIG["output_events"])
    generate_timeline_events(events_path)

    print(f"✅ Timeline events saved to: {events_path}")

    print("\n" + "="*70)
    print("🎉 ALL DATA GENERATION COMPLETE!")
    print("="*70)
    print("\n📋 Next Steps:")
    print("1. ✅ Data files are ready in frontend/public/data/")
    print("2. 🚀 Restart your dev server: cd frontend && npm run dev")
    print("3. 🌐 Open http://localhost:5173 to see all planets!")
    print("\n💡 To customize: Edit CONFIG at the top of this script")
    print("="*70 + "\n")


def generate_timeline_events(output_path):
    """Generate timeline event markers"""
    events = {
        "events": [
            {
                "id": "discovery",
                "name": "Discovery",
                "date": "2025-07-01",
                "description": "3I/ATLAS discovered by ATLAS telescope in Chile",
                "type": "milestone"
            },
            {
                "id": "mars_flyby",
                "name": "Mars Flyby",
                "date": "2025-10-03",
                "distance_au": 0.19,
                "description": "Close approach to Mars at 0.19 AU",
                "type": "encounter"
            },
            {
                "id": "perihelion",
                "name": "Perihelion",
                "date": "2025-10-29",
                "distance_au": 1.356,
                "max_velocity_kms": 68.0,
                "description": "Closest approach to the Sun at 1.356 AU",
                "type": "milestone"
            },
            {
                "id": "jupiter_approach",
                "name": "Jupiter Approach",
                "date": "2026-03-16",
                "distance_au": 0.36,
                "description": "Close approach to Jupiter at 0.36 AU",
                "type": "encounter"
            }
        ]
    }

    with open(output_path, 'w') as f:
        json.dump(events, f, indent=2)


if __name__ == "__main__":
    main()
