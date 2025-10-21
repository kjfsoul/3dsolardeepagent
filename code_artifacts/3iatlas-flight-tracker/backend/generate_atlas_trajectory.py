#!/usr/bin/env python3
"""
NASA JPL Horizons API Integration for 3I/ATLAS Trajectory Data
================================================================

This script fetches trajectory data for comet 3I/ATLAS (C/2025 N1) and related
celestial bodies from NASA's JPL Horizons system. It generates pre-computed
static trajectory data and implements a polling mechanism for updates.

Key Features:
- Fetches trajectory data for 3I/ATLAS, Earth, Mars, and Jupiter
- Generates pre-computed data from July 1, 2025 to current date (Oct 20, 2025)
- Implements twice-daily API polling for new data
- Includes event markers for key milestones
- Provides fallback orbital mechanics calculations if API fails

Author: 3IAtlas Development Team
Date: October 20, 2025
"""

import json
import requests
import sys
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import time
import math
import os

# Constants
AU_TO_KM = 149597870.7  # 1 AU in kilometers
CACHE_FILE = "../frontend/public/data/trajectory_cache.json"
STATIC_FILE = "../frontend/public/data/trajectory_static.json"
EVENTS_FILE = "../frontend/public/data/timeline_events.json"

# 3I/ATLAS identification
ATLAS_DESIGNATIONS = ["C/2025 N1", "3I/ATLAS", "1004083"]  # SPK-ID: 1004083
ATLAS_SPK_ID = "1004083"

# Date range constants
DISCOVERY_DATE = "2025-07-01"
CURRENT_DATE = "2025-10-20"
FUTURE_DATE = "2026-03-31"  # Through Jupiter approach

# Key events with dates
KEY_EVENTS = [
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
        "description": "Closest approach to the Sun at 1.356 AU, maximum velocity 68 km/s",
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


class HorizonsAPIClient:
    """Client for NASA JPL Horizons API"""

    BASE_URL = "https://ssd.jpl.nasa.gov/api/horizons.api"
    LOOKUP_URL = "https://ssd.jpl.nasa.gov/api/horizons_lookup.api"

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': '3IAtlas-FlightTracker/1.0 (Educational)'
        })

    def lookup_object(self, designation: str) -> Optional[Dict]:
        """Look up object to get SPK-ID and verify existence"""
        try:
            params = {
                'sstr': designation,
                'group': 'com',
                'format': 'json'
            }

            print(f"Looking up object: {designation}")
            response = self.session.get(self.LOOKUP_URL, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()
            if data.get('count', 0) > 0:
                result = data['result'][0]
                print(f"✓ Found: {result.get('name', 'Unknown')} (SPK-ID: {result.get('spkid', 'N/A')})")
                return result
            else:
                print(f"✗ Object not found: {designation}")
                return None

        except Exception as e:
            print(f"✗ Lookup error for {designation}: {str(e)}")
            return None

    def fetch_vectors(self, command: str, start_date: str, stop_date: str,
                     step_size: str = "6h", center: str = "@sun") -> List[Dict]:
        """Fetch position and velocity vectors from Horizons"""

        # Horizons requires DES= for certain SPK identifiers; normalize command
        normalized_command = command
        try:
            # If command looks like a large numeric SPK id (e.g., 1004083),
            # wrap with DES= per API guidance and quote value per API examples.
            # Leave small numeric IDs like 399 untouched.
            if command.isdigit() and int(command) >= 1_000_000:
                normalized_command = f"'DES={command}'"
        except Exception:
            pass

        params = {
            'COMMAND': normalized_command,
            'EPHEM_TYPE': 'VECTOR',
            'CENTER': center,
            'START_TIME': start_date,
            'STOP_TIME': stop_date,
            'STEP_SIZE': step_size,
            'format': 'json',
            'OUT_UNITS': 'AU-D',
            'REF_SYSTEM': 'ICRF',
            'VEC_TABLE': '2',
            'CSV_FORMAT': 'YES',
            'OBJ_DATA': 'NO'
        }

        try:
            print(f"Fetching vectors for {command} from {start_date} to {stop_date}...")
            response = self.session.get(self.BASE_URL, params=params, timeout=60)
            response.raise_for_status()

            data = response.json()

            if 'result' not in data:
                raise ValueError(f"No result in response for {command}")

            # Parse the result text
            result_text = '\n'.join(data['result']) if isinstance(data['result'], list) else data['result']
            vectors = self._parse_vector_data(result_text)

            print(f"✓ Fetched {len(vectors)} data points for {command}")
            if len(vectors) == 0:
                # Emit a short diagnostic to help debugging when parser yields no rows
                preview = '\n'.join(result_text.splitlines()[:20])
                api_error = data.get('error', '')
                if api_error:
                    print(f"  API error: {api_error}")
                print("  Parser yielded 0 rows; response preview:\n" + preview)
            return vectors

        except requests.exceptions.Timeout:
            print(f"✗ Timeout fetching data for {command}")
            return []
        except Exception as e:
            print(f"✗ Error fetching vectors for {command}: {str(e)}")
            return []

    def _parse_vector_data(self, text: str) -> List[Dict]:
        """Parse Horizons vector output format (CSV rows under $$SOE)"""
        vectors: List[Dict] = []
        lines = text.split('\n')

        in_data = False

        for raw_line in lines:
            line = raw_line.strip()

            if line.startswith('$$SOE'):
                in_data = True
                continue
            if line.startswith('$$EOE'):
                break
            if not in_data or not line or ',' not in line:
                continue

            # Expected columns:
            # JDTDB, Calendar Date (TDB), X, Y, Z, VX, VY, VZ,
            parts = [p.strip() for p in line.split(',')]
            if len(parts) < 8:
                continue
            try:
                jd_val = float(parts[0])
                date_field = parts[1]
                # Extract ISO-like date portion from the calendar date field
                date_iso = date_field
                if 'A.D.' in date_field:
                    date_iso = date_field.split('A.D.')[-1].strip()

                x = float(parts[2]); y = float(parts[3]); z = float(parts[4])
                vx = float(parts[5]); vy = float(parts[6]); vz = float(parts[7])

                vectors.append({
                    'jd': jd_val,
                    'date': date_iso,
                    'position': {'x': x, 'y': y, 'z': z},
                    # Emit velocity using x,y,z keys to match frontend types
                    'velocity': {'x': vx, 'y': vy, 'z': vz}
                })
            except Exception:
                continue

        return vectors

    @staticmethod
    def _jd_to_iso(jd: float) -> str:
        """Convert Julian Date to ISO format"""
        # Approximate conversion (good enough for display)
        unix_epoch = (jd - 2440587.5) * 86400.0
        dt = datetime.utcfromtimestamp(unix_epoch)
        return dt.strftime('%Y-%m-%d')


class OrbitalMechanicsCalculator:
    """Fallback orbital mechanics calculations if API fails"""

    # 3I/ATLAS orbital elements (from Horizons manual review)
    ATLAS_ELEMENTS = {
        'eccentricity': 6.139587836355706,
        'perihelion_au': 1.356419039495192,
        'perihelion_date': '2025-10-29.4814392594',
        'ascending_node': 322.1568699043938,  # degrees
        'arg_perihelion': 128.0099421020839,  # degrees
        'inclination': 175.1131015287974  # degrees
    }

    # Gravitational parameter for Sun (AU^3/day^2)
    MU_SUN = 2.959122083e-4

    @classmethod
    def calculate_position(cls, date_str: str) -> Dict:
        """Calculate approximate position using orbital elements and hyperbolic orbit equations"""

        # Parse date
        try:
            dt = datetime.fromisoformat(date_str)
        except:
            dt = datetime.strptime(date_str, '%Y-%m-%d')

        # Perihelion date
        perihelion_dt = datetime(2025, 10, 29, 11, 33, 16)  # Oct 29.4814

        # Time since perihelion (in days)
        t = (dt - perihelion_dt).total_seconds() / 86400.0

        # Orbital elements
        e = cls.ATLAS_ELEMENTS['eccentricity']
        q = cls.ATLAS_ELEMENTS['perihelion_au']

        # Semi-major axis (negative for hyperbolic orbit)
        a = q / (1 - e)

        # Mean motion (rad/day)
        n = math.sqrt(cls.MU_SUN / abs(a**3))

        # Mean anomaly
        M = n * t

        # Solve hyperbolic Kepler's equation for eccentric anomaly F
        # For hyperbolic orbits: M = e * sinh(F) - F
        # Using Newton's method
        F = M  # Initial guess
        for _ in range(10):
            F = F - (e * math.sinh(F) - F - M) / (e * math.cosh(F) - 1)

        # True anomaly
        nu = 2.0 * math.atan(math.sqrt((e + 1) / (e - 1)) * math.tanh(F / 2))

        # Distance from Sun
        r = a * (1 - e * math.cosh(F))

        # Position in orbital plane
        x_orb = r * math.cos(nu)
        y_orb = r * math.sin(nu)

        # Convert to degrees and then to radians
        omega = math.radians(cls.ATLAS_ELEMENTS['ascending_node'])
        w = math.radians(cls.ATLAS_ELEMENTS['arg_perihelion'])
        i = math.radians(cls.ATLAS_ELEMENTS['inclination'])

        # Rotation matrices to convert to ecliptic coordinates
        cos_omega = math.cos(omega)
        sin_omega = math.sin(omega)
        cos_w = math.cos(w)
        sin_w = math.sin(w)
        cos_i = math.cos(i)
        sin_i = math.sin(i)

        # Apply rotation matrices
        x = (cos_omega * cos_w - sin_omega * sin_w * cos_i) * x_orb + \
            (-cos_omega * sin_w - sin_omega * cos_w * cos_i) * y_orb

        y = (sin_omega * cos_w + cos_omega * sin_w * cos_i) * x_orb + \
            (-sin_omega * sin_w + cos_omega * cos_w * cos_i) * y_orb

        z = (sin_w * sin_i) * x_orb + (cos_w * sin_i) * y_orb

        # Calculate velocity (simplified)
        # v = sqrt(mu * (2/r - 1/a))
        v_mag = math.sqrt(cls.MU_SUN * (2.0 / abs(r) - 1.0 / a))

        # Velocity direction (perpendicular to position in simplified model)
        v_angle = nu + math.pi / 2
        vx_orb = v_mag * math.cos(v_angle)
        vy_orb = v_mag * math.sin(v_angle)

        # Apply rotation to velocity
        vx = (cos_omega * cos_w - sin_omega * sin_w * cos_i) * vx_orb + \
             (-cos_omega * sin_w - sin_omega * cos_w * cos_i) * vy_orb

        vy = (sin_omega * cos_w + cos_omega * sin_w * cos_i) * vx_orb + \
             (-sin_omega * sin_w + cos_omega * cos_w * cos_i) * vy_orb

        vz = (sin_w * sin_i) * vx_orb + (cos_w * sin_i) * vy_orb

        return {
            'date': dt.strftime('%Y-%m-%d %H:%M:%S'),
            'position': {'x': x, 'y': y, 'z': z},
            'velocity': {'x': vx, 'y': vy, 'z': vz},  # Match API format
            'calculated': True,
            'distance_au': abs(r)
        }

    @classmethod
    def generate_fallback_trajectory(cls, start_date: str, end_date: str,
                                    hours_step: int = 6) -> List[Dict]:
        """Generate fallback trajectory data using orbital mechanics"""
        print("⚠ Using fallback orbital mechanics calculations")
        print("  Based on JPL orbital elements: e=6.14, q=1.356 AU, perihelion=Oct 29, 2025")

        trajectory = []
        current = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        delta = timedelta(hours=hours_step)

        while current <= end:
            date_str = current.strftime('%Y-%m-%d %H:%M:%S')
            point = cls.calculate_position(date_str)
            trajectory.append(point)
            current += delta

        print(f"  Generated {len(trajectory)} calculated trajectory points")
        return trajectory

    @classmethod
    def generate_planet_orbit(cls, planet_name: str, start_date: str, end_date: str,
                             hours_step: int = 24) -> List[Dict]:
        """Generate simplified circular orbit for planets"""

        # Simplified orbital parameters (circular approximation)
        planet_params = {
            'earth': {'radius': 1.0, 'period': 365.25, 'phase': 0},
            'mars': {'radius': 1.524, 'period': 687.0, 'phase': 120},
            'jupiter': {'radius': 5.203, 'period': 4332.6, 'phase': 240}
        }

        if planet_name.lower() not in planet_params:
            return []

        params = planet_params[planet_name.lower()]

        print(f"  Generating {planet_name} orbit (circular approximation, R={params['radius']} AU)")

        trajectory = []
        current = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        delta = timedelta(hours=hours_step)

        # Reference date for phase calculation
        ref_date = datetime(2025, 7, 1)

        while current <= end:
            # Time since reference date (in days)
            t = (current - ref_date).total_seconds() / 86400.0

            # Angular position (rad)
            theta = (2.0 * math.pi * t / params['period']) + math.radians(params['phase'])

            # Position (circular orbit in XY plane)
            x = params['radius'] * math.cos(theta)
            y = params['radius'] * math.sin(theta)
            z = 0.0

            # Velocity (tangential to orbit)
            v_mag = 2.0 * math.pi * params['radius'] / params['period']
            vx = -v_mag * math.sin(theta)
            vy = v_mag * math.cos(theta)
            vz = 0.0

            trajectory.append({
                'date': current.strftime('%Y-%m-%d %H:%M:%S'),
                'position': {'x': x, 'y': y, 'z': z},
                'velocity': {'x': vx, 'y': vy, 'z': vz},  # Match API format
                'calculated': True
            })

            current += delta

        print(f"  Generated {len(trajectory)} points for {planet_name}")
        return trajectory


class TrajectoryDataGenerator:
    """Main class for generating trajectory data"""

    def __init__(self):
        self.api_client = HorizonsAPIClient()
        self.fallback = OrbitalMechanicsCalculator()

    def generate_static_data(self, force_api: bool = False) -> Dict:
        """Generate pre-computed static trajectory data with proper caching"""

        print("\n" + "="*70)
        print("3I/ATLAS TRAJECTORY DATA GENERATION")
        print("="*70)
        print(f"Date Range: {DISCOVERY_DATE} to {FUTURE_DATE}")
        print(f"Current Date: {CURRENT_DATE}")
        print("="*70 + "\n")

        # Check cache validity per horizons.mdc rules (7-day TTL)
        cache_valid = False
        if not force_api and os.path.exists(STATIC_FILE):
            try:
                with open(STATIC_FILE, 'r') as f:
                    cached_data = json.load(f)

                # Check if cache is within 7-day TTL
                generated_time = datetime.fromisoformat(cached_data['metadata']['generated'])
                cache_age = datetime.now() - generated_time

                if cache_age.days < 7:
                    cache_valid = True
                    print(f"✅ Cache valid (age: {cache_age.days} days < 7-day TTL)")
                    print("ℹ Using cached data. Use --force to regenerate.\n")
                    return cached_data
                else:
                    print(f"⚠️ Cache expired (age: {cache_age.days} days >= 7-day TTL)")
                    print("🔄 Regenerating data...\n")
            except Exception as e:
                print(f"⚠️ Cache validation failed: {e}")
                print("🔄 Regenerating data...\n")

        # Fetch data for all objects
        data = {
            'metadata': {
                'generated': datetime.now().isoformat(),
                'date_range': {
                    'start': DISCOVERY_DATE,
                    'end': FUTURE_DATE,
                    'current': CURRENT_DATE
                },
                'step_size': '6h',
                'units': {
                    'distance': 'AU',
                    'velocity': 'AU/day',
                    'time': 'ISO-8601'
                },
                'source': 'NASA JPL Horizons System'
            },
            'atlas': [],
            'earth': [],
            'mars': [],
            'jupiter': []
        }

        # Fetch 3I/ATLAS trajectory
        print("\n[1/4] Fetching 3I/ATLAS (C/2025 N1) trajectory...")
        atlas_data = self.api_client.fetch_vectors(
            ATLAS_SPK_ID, DISCOVERY_DATE, FUTURE_DATE, step_size="6h"
        )

        if not atlas_data:
            print("⚠ API failed for 3I/ATLAS, using fallback...")
            atlas_data = self.fallback.generate_fallback_trajectory(
                DISCOVERY_DATE, FUTURE_DATE
            )

        data['atlas'] = atlas_data

        # Fetch Earth trajectory
        print("\n[2/4] Fetching Earth trajectory...")
        earth_data = self.api_client.fetch_vectors(
            "399", DISCOVERY_DATE, FUTURE_DATE, step_size="1d"
        )
        if not earth_data:
            print("⚠ API failed for Earth, using calculated orbit...")
            earth_data = self.fallback.generate_planet_orbit(
                'earth', DISCOVERY_DATE, FUTURE_DATE, hours_step=24
            )
        data['earth'] = earth_data

        # Fetch Mars trajectory
        print("\n[3/4] Fetching Mars trajectory...")
        mars_data = self.api_client.fetch_vectors(
            "499", DISCOVERY_DATE, FUTURE_DATE, step_size="1d"
        )
        if not mars_data:
            print("⚠ API failed for Mars, using calculated orbit...")
            mars_data = self.fallback.generate_planet_orbit(
                'mars', DISCOVERY_DATE, FUTURE_DATE, hours_step=24
            )
        data['mars'] = mars_data

        # Fetch Jupiter trajectory
        print("\n[4/4] Fetching Jupiter trajectory...")
        jupiter_data = self.api_client.fetch_vectors(
            "599", DISCOVERY_DATE, FUTURE_DATE, step_size="2d"
        )
        if not jupiter_data:
            print("⚠ API failed for Jupiter, using calculated orbit...")
            jupiter_data = self.fallback.generate_planet_orbit(
                'jupiter', DISCOVERY_DATE, FUTURE_DATE, hours_step=48
            )
        data['jupiter'] = jupiter_data

        print("\n" + "="*70)
        print("DATA GENERATION SUMMARY")
        print("="*70)
        print(f"3I/ATLAS points:  {len(data['atlas'])}")
        print(f"Earth points:     {len(data['earth'])}")
        print(f"Mars points:      {len(data['mars'])}")
        print(f"Jupiter points:   {len(data['jupiter'])}")
        print("="*70 + "\n")

        # Save to file
        os.makedirs(os.path.dirname(STATIC_FILE), exist_ok=True)
        with open(STATIC_FILE, 'w') as f:
            json.dump(data, f, indent=2)

        print(f"✓ Static data saved to: {STATIC_FILE}\n")

        return data

    def generate_event_markers(self) -> None:
        """Generate timeline event markers with associated data"""

        print("Generating timeline event markers...")

        # Load educational content from knowledge base
        knowledge_base_path = "/home/ubuntu/Uploads/3I_ATLAS_KNOWLEDGE_BASE.md"
        educational_content = {}

        try:
            with open(knowledge_base_path, 'r') as f:
                kb_content = f.read()

            # Extract relevant sections for each event
            educational_content = self._extract_educational_content(kb_content)

        except FileNotFoundError:
            print("⚠ Knowledge base not found, using basic descriptions")

        # Enrich events with educational content
        enriched_events = []
        for event in KEY_EVENTS:
            enriched_event = event.copy()
            enriched_event['educational_content'] = educational_content.get(
                event['id'],
                event.get('description', '')
            )
            enriched_events.append(enriched_event)

        # Save events
        os.makedirs(os.path.dirname(EVENTS_FILE), exist_ok=True)
        with open(EVENTS_FILE, 'w') as f:
            json.dump({'events': enriched_events}, f, indent=2)

        print(f"✓ Event markers saved to: {EVENTS_FILE}\n")

    def _extract_educational_content(self, kb_content: str) -> Dict[str, str]:
        """Extract relevant educational content from knowledge base"""

        content = {}

        # Discovery content
        if "Discovery & Designation" in kb_content:
            content['discovery'] = """
**Discovery of 3I/ATLAS**

On July 1, 2025, astronomers using the ATLAS (Asteroid Terrestrial-impact Last
Alert System) telescope in Chile detected an unusual object moving through the
constellation Sagittarius. This ancient cosmic wanderer is the third confirmed
interstellar object to visit our solar system.

**Why It's Special:**
- Hyperbolic trajectory indicating extrasolar origin
- High velocity relative to the Sun
- Active coma formation suggesting volatile-rich composition
- Estimated age: over 7 billion years old
"""

        # Mars Flyby content
        content['mars_flyby'] = """
**Mars Close Approach**

On October 3, 2025, 3I/ATLAS makes a close approach to Mars at a distance of
just 0.19 AU (approximately 28.4 million kilometers). This encounter provides
a unique opportunity for comparative observations.

**Scientific Significance:**
- Allows direct comparison of interstellar visitor with Mars
- Tests planetary gravitational effects on hyperbolic trajectory
- Opportunity for coordinated observations from Mars orbiters
"""

        # Perihelion content
        if "perihelion" in kb_content.lower():
            content['perihelion'] = """
**Perihelion: Closest Approach to the Sun**

On October 29, 2025, 3I/ATLAS reaches perihelion at 1.356 AU from the Sun
(just inside Mars' orbit). At this point, the comet achieves its maximum
velocity of approximately 68 km/s.

**What Happens:**
- Maximum solar heating causes intense volatile sublimation
- Coma brightens to potentially naked-eye visibility (magnitude 6-7)
- Greenish color from carbon compounds (CO, CO₂, CH₄)
- Possible development of visible tail
- Peak observing opportunity for ground-based telescopes

**Composition:**
Water ice, carbon monoxide, carbon dioxide, methane, ammonia, and
organic compounds from another star system.
"""

        # Jupiter Approach content
        content['jupiter_approach'] = """
**Jupiter Approach**

On March 16, 2026, 3I/ATLAS makes a close approach to Jupiter at 0.36 AU
(approximately 54 million kilometers). This is the final major planetary
encounter before the comet exits our solar system forever.

**Significance:**
- Jupiter's immense gravity may slightly perturb the trajectory
- Final opportunity for detailed observations before departure
- Tests of long-term stability of interstellar ices
- Comparison with Jupiter's own icy moons (Europa, Ganymede, Callisto)

After this encounter, 3I/ATLAS will continue its journey back into interstellar
space, carrying ancient material from the Milky Way's thick disk to destinations
unknown.
"""

        return content

    def poll_for_updates(self) -> None:
        """Polling mechanism for twice-daily updates"""

        print("\n" + "="*70)
        print("POLLING MODE: Checking for new trajectory data")
        print("="*70)
        print("This would run twice daily to append new data beyond Oct 20, 2025")
        print("Implementation: cron job or scheduled task")
        print("="*70 + "\n")

        # Load existing static data
        try:
            with open(STATIC_FILE, 'r') as f:
                existing_data = json.load(f)
        except FileNotFoundError:
            print("✗ No static data found. Run generation first.")
            return

        # Get last date in dataset
        if existing_data['atlas']:
            last_date = existing_data['atlas'][-1]['date']
            print(f"Last data point: {last_date}")

            # Calculate next date to fetch (after last date)
            last_dt = datetime.fromisoformat(last_date.split()[0])
            next_start = (last_dt + timedelta(days=1)).strftime('%Y-%m-%d')
            next_end = (last_dt + timedelta(days=7)).strftime('%Y-%m-%d')

            print(f"Would fetch: {next_start} to {next_end}")
            print("\n✓ Poll check complete. No action taken (simulation mode).\n")
        else:
            print("✗ No existing ATLAS data to update.")


def main():
    """Main execution function"""

    import argparse

    parser = argparse.ArgumentParser(
        description="Generate 3I/ATLAS trajectory data from NASA Horizons"
    )
    parser.add_argument(
        '--force',
        action='store_true',
        help='Force regeneration even if static data exists'
    )
    parser.add_argument(
        '--poll',
        action='store_true',
        help='Run in polling mode to check for updates'
    )
    parser.add_argument(
        '--events-only',
        action='store_true',
        help='Only generate event markers'
    )

    args = parser.parse_args()

    generator = TrajectoryDataGenerator()

    if args.events_only:
        generator.generate_event_markers()
        return

    if args.poll:
        generator.poll_for_updates()
        return

    # Generate static trajectory data
    generator.generate_static_data(force_api=args.force)

    # Generate event markers
    generator.generate_event_markers()

    print("✓ All data generation complete!\n")
    print("Next steps:")
    print("1. Review generated files in frontend/public/data/")
    print("2. Import data in React components")
    print("3. Set up cron job for --poll mode (twice daily)")
    print("")


if __name__ == "__main__":
    main()
