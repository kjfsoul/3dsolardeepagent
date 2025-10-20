#!/usr/bin/env python3
"""
3I/ATLAS Trajectory Data Generator
Fetches trajectory data from NASA JPL Horizons API for 3I/ATLAS and planets
"""

import json
import re
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import requests
import numpy as np
from scipy.optimize import newton

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/home/ubuntu/trajectory_generation_log.txt'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Constants
HORIZONS_API_URL = "https://ssd.jpl.nasa.gov/api/horizons.api"
AU_TO_THREEJS_SCALE = 1.0  # We'll keep AU as base unit
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds

# Object IDs for Horizons API
OBJECTS = {
    'atlas': '1004083',      # 3I/ATLAS (C/2025 N1)
    'earth': '399',          # Earth
    'mars': '499',           # Mars
    'jupiter': '599'         # Jupiter
}

# Orbital elements for 3I/ATLAS (for fallback calculations)
ATLAS_ELEMENTS = {
    'e': 6.14,                          # eccentricity (highly hyperbolic)
    'q': 1.36,                          # perihelion distance (AU)
    'i': 175.0,                         # inclination (degrees)
    'perihelion_date': '2025-10-29',    # perihelion date
    'perihelion_time': '11:47',         # UT time
    'v_infinity': 57.98                 # hyperbolic excess velocity (km/s)
}

# Milestone events
MILESTONES = [
    {
        'name': 'Discovery',
        'date': '2025-07-01',
        'description': '3I/ATLAS discovered - first interstellar visitor of 2025'
    },
    {
        'name': 'Mars Flyby',
        'date': '2025-10-03',
        'description': 'Closest approach to Mars at 0.19 AU'
    },
    {
        'name': 'Perihelion',
        'date': '2025-10-29',
        'description': 'Closest approach to Sun at 1.36 AU, traveling at ~68 km/s'
    },
    {
        'name': 'Jupiter Approach',
        'date': '2026-03-16',
        'description': 'Approach to Jupiter at 0.36 AU before exiting solar system'
    }
]


def horizons_to_threejs(x: float, y: float, z: float) -> List[float]:
    """
    Convert Horizons coordinate system to Three.js coordinate system
    Horizons: +X = vernal equinox, +Y = 90° east in equatorial plane, +Z = north pole
    Three.js: +X = right, +Y = up, +Z = out of screen
    
    Conversion: Three.js [x, y, z] = Horizons [x, z, -y]
    """
    return [x, z, -y]


def parse_horizons_vectors(result_text: str) -> List[Dict]:
    """
    Parse the vector data from Horizons API text result
    Returns list of data points with julian date, ISO date, position, velocity
    
    Format:
    2460857.500000000 = A.D. 2025-Jul-01 00:00:00.0000 TDB 
     X = 1.604852883868353E-01 Y =-1.003877668284229E+00 Z = 5.873838535200654E-05
     VX= 1.671155951613705E-02 VY= 2.657695095774474E-03 VZ= 3.629966495530106E-07
    """
    data_points = []
    
    # Find the data section (between $$SOE and $$EOE markers)
    soe_match = re.search(r'\$\$SOE\s*\n(.*?)\$\$EOE', result_text, re.DOTALL)
    if not soe_match:
        raise ValueError("Could not find data section in Horizons result")
    
    data_section = soe_match.group(1)
    lines = data_section.strip().split('\n')
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
        
        # Check if this is a date line (contains '=' and 'A.D.')
        if '=' in line and 'A.D.' in line:
            try:
                # Parse JD and date from first line
                # Format: "2460857.500000000 = A.D. 2025-Jul-01 00:00:00.0000 TDB"
                parts = line.split('=')
                jd = float(parts[0].strip())
                date_str = parts[1].strip().replace('A.D. ', '').replace(' TDB', '').strip()
                
                # Get position from next line
                i += 1
                if i >= len(lines):
                    break
                pos_line = lines[i].strip()
                
                # Parse X = value Y = value Z = value
                x_match = re.search(r'X\s*=\s*([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)', pos_line)
                y_match = re.search(r'Y\s*=\s*([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)', pos_line)
                z_match = re.search(r'Z\s*=\s*([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)', pos_line)
                
                if not (x_match and y_match and z_match):
                    i += 1
                    continue
                
                x = float(x_match.group(1))
                y = float(y_match.group(1))
                z = float(z_match.group(1))
                
                # Get velocity from next line
                i += 1
                if i >= len(lines):
                    break
                vel_line = lines[i].strip()
                
                # Parse VX= value VY= value VZ= value
                vx_match = re.search(r'VX\s*=\s*([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)', vel_line)
                vy_match = re.search(r'VY\s*=\s*([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)', vel_line)
                vz_match = re.search(r'VZ\s*=\s*([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)', vel_line)
                
                if not (vx_match and vy_match and vz_match):
                    i += 1
                    continue
                
                vx = float(vx_match.group(1))
                vy = float(vy_match.group(1))
                vz = float(vz_match.group(1))
                
                # Convert to Three.js coordinates
                position = horizons_to_threejs(x, y, z)
                velocity = horizons_to_threejs(vx, vy, vz)
                
                data_points.append({
                    'jd': jd,
                    'date': date_str,
                    'position': position,
                    'velocity': velocity
                })
                
            except (ValueError, IndexError, AttributeError) as e:
                logger.warning(f"Error parsing data point: {e}")
        
        i += 1
    
    return data_points


def fetch_horizons_data(object_id: str, start_date: str, end_date: str, 
                       step_size: str = '6h') -> Optional[List[Dict]]:
    """
    Fetch trajectory data from NASA Horizons API with retry logic
    """
    params = {
        'format': 'json',
        'COMMAND': f"'{object_id}'",
        'EPHEM_TYPE': 'VECTORS',
        'CENTER': '@sun',
        'START_TIME': f"'{start_date}'",
        'STOP_TIME': f"'{end_date}'",
        'STEP_SIZE': f"'{step_size}'",
        'OUT_UNITS': 'AU-D',
        'REF_SYSTEM': 'ICRF',
        'VEC_TABLE': '2',
        'VEC_CORR': 'NONE'
    }
    
    for attempt in range(MAX_RETRIES):
        try:
            logger.info(f"Fetching data for object {object_id} (attempt {attempt + 1}/{MAX_RETRIES})")
            response = requests.get(HORIZONS_API_URL, params=params, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            # Check for API errors
            if 'result' not in result:
                logger.error(f"No result field in response: {result}")
                raise ValueError("Invalid API response")
            
            # Parse the embedded text data
            result_text = result['result']
            data_points = parse_horizons_vectors(result_text)
            
            if not data_points:
                raise ValueError("No data points extracted from result")
            
            logger.info(f"Successfully fetched {len(data_points)} data points for object {object_id}")
            return data_points
            
        except Exception as e:
            logger.error(f"Error fetching data for object {object_id}: {e}")
            if attempt < MAX_RETRIES - 1:
                wait_time = RETRY_DELAY * (2 ** attempt)  # Exponential backoff
                logger.info(f"Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                logger.error(f"Failed to fetch data after {MAX_RETRIES} attempts")
                return None
    
    return None


def kepler_fallback_trajectory(start_date: str, end_date: str, 
                               step_hours: int = 6) -> List[Dict]:
    """
    Fallback trajectory generator using Kepler orbital mechanics
    Generates approximate trajectory for 3I/ATLAS based on known orbital elements
    """
    logger.info("Using Kepler fallback trajectory generator")
    
    # Parse dates
    start_dt = datetime.fromisoformat(start_date)
    end_dt = datetime.fromisoformat(end_date)
    perihelion_dt = datetime.fromisoformat(ATLAS_ELEMENTS['perihelion_date'])
    
    # Orbital elements for 3I/ATLAS
    e = ATLAS_ELEMENTS['e']  # eccentricity (6.14, highly hyperbolic)
    q = ATLAS_ELEMENTS['q']  # perihelion distance (1.36 AU)
    i = np.radians(ATLAS_ELEMENTS['i'])  # inclination (175°, retrograde)
    
    # Additional orbital elements (assumed/simplified)
    omega = np.radians(90)   # argument of periapsis
    OMEGA = np.radians(180)  # longitude of ascending node
    
    # For hyperbolic orbit: a = q / (e - 1) (negative)
    a = -q / (e - 1)  # negative semimajor axis for hyperbolic orbit
    
    # Gravitational parameter (AU^3/day^2)
    # GM_sun = 0.000295912208286 AU^3/day^2 (from NASA)
    mu = 0.000295912208286
    
    # Mean motion for hyperbolic orbit
    n = np.sqrt(mu / abs(a)**3)
    
    data_points = []
    current_dt = start_dt
    
    while current_dt <= end_dt:
        # Time since perihelion (in days)
        dt_days = (current_dt - perihelion_dt).total_seconds() / 86400.0
        
        # Mean anomaly for hyperbolic orbit
        M = n * dt_days
        
        # Solve Kepler's equation for hyperbolic orbit
        # M = e * sinh(F) - F, where F is hyperbolic eccentric anomaly
        # Limit M to prevent overflow
        if abs(M) > 50:
            # For very large times, use asymptotic approximation
            F = np.sign(M) * (np.log(2 * abs(M) / e) + np.log(1 + np.sqrt(1 + (2*abs(M)/e)**2)))
        else:
            try:
                # Use Newton's method with better initial guess
                F_guess = np.sign(M) * np.log(abs(M) + 1)
                F = newton(lambda f: e * np.sinh(f) - f - M, F_guess, maxiter=20)
            except:
                # If Newton's method fails, use approximation
                F = np.sign(M) * np.log(abs(M) + 1)
        
        # True anomaly
        tan_half_nu = np.sqrt((e + 1) / (e - 1)) * np.tanh(F / 2)
        nu = 2 * np.arctan(tan_half_nu)
        
        # Distance from sun (radius)
        r = a * (1 - e * np.cosh(F))
        
        # Position in orbital plane
        x_orb = r * np.cos(nu)
        y_orb = r * np.sin(nu)
        z_orb = 0
        
        # Rotation matrices to convert from orbital plane to ecliptic coordinates
        # First rotate by omega (argument of periapsis) around z-axis
        # Then rotate by i (inclination) around x-axis  
        # Finally rotate by OMEGA (longitude of ascending node) around z-axis
        
        # Apply rotations
        cos_omega, sin_omega = np.cos(omega), np.sin(omega)
        cos_i, sin_i = np.cos(i), np.sin(i)
        cos_OMEGA, sin_OMEGA = np.cos(OMEGA), np.sin(OMEGA)
        
        # Combine rotation matrices
        x = (cos_OMEGA * cos_omega - sin_OMEGA * sin_omega * cos_i) * x_orb + \
            (-cos_OMEGA * sin_omega - sin_OMEGA * cos_omega * cos_i) * y_orb
        
        y = (sin_OMEGA * cos_omega + cos_OMEGA * sin_omega * cos_i) * x_orb + \
            (-sin_OMEGA * sin_omega + cos_OMEGA * cos_omega * cos_i) * y_orb
        
        z = (sin_omega * sin_i) * x_orb + (cos_omega * sin_i) * y_orb
        
        # Convert to Three.js coordinates
        position = horizons_to_threejs(x, y, z)
        
        # Calculate velocity
        # For hyperbolic orbit: v = sqrt(mu * (2/r - 1/a))
        # Note: a is negative for hyperbolic orbits, so -1/a is positive
        v_mag = np.sqrt(mu * (2.0 / abs(r) - 1.0 / a)) if r != 0 else 0
        
        # Velocity direction (simplified: perpendicular to radius in orbital plane)
        vx_orb = -v_mag * np.sin(nu)
        vy_orb = v_mag * (e + np.cos(nu))
        
        # Normalize and scale
        v_norm = np.sqrt(vx_orb**2 + vy_orb**2)
        if v_norm > 0:
            vx_orb = vx_orb / v_norm * v_mag
            vy_orb = vy_orb / v_norm * v_mag
        
        # Apply same rotations to velocity
        vx = (cos_OMEGA * cos_omega - sin_OMEGA * sin_omega * cos_i) * vx_orb + \
             (-cos_OMEGA * sin_omega - sin_OMEGA * cos_omega * cos_i) * vy_orb
        
        vy = (sin_OMEGA * cos_omega + cos_OMEGA * sin_omega * cos_i) * vx_orb + \
             (-sin_OMEGA * sin_omega + cos_OMEGA * cos_omega * cos_i) * vy_orb
        
        vz = (sin_omega * sin_i) * vx_orb + (cos_omega * sin_i) * vy_orb
        
        velocity = horizons_to_threejs(vx, vy, vz)
        
        # Julian date (J2000 epoch: JD 2451545.0 = 2000-01-01 12:00:00)
        jd = 2451545.0 + (current_dt - datetime(2000, 1, 1, 12, 0, 0)).total_seconds() / 86400.0
        
        data_points.append({
            'jd': jd,
            'date': current_dt.strftime('%Y-%m-%d %H:%M:%S'),
            'position': position,
            'velocity': velocity
        })
        
        current_dt += timedelta(hours=step_hours)
    
    logger.info(f"Generated {len(data_points)} fallback data points")
    return data_points


def find_position_at_date(trajectory: List[Dict], target_date: str) -> Optional[List[float]]:
    """
    Find the position in trajectory closest to target date
    """
    target_dt = datetime.fromisoformat(target_date)
    
    best_match = None
    min_diff = float('inf')
    
    for point in trajectory:
        try:
            # Parse date string (handle various formats)
            date_str = point['date'].split()[0]  # Get just the date part
            point_dt = datetime.fromisoformat(date_str)
            diff = abs((point_dt - target_dt).total_seconds())
            
            if diff < min_diff:
                min_diff = diff
                best_match = point['position']
        except:
            continue
    
    return best_match


def generate_trajectory_data(start_date: str = '2025-07-01', 
                            end_date: str = '2026-01-31',
                            step_size: str = '6h',
                            output_file: str = '/home/ubuntu/3iatlas_trajectory_data.json') -> bool:
    """
    Main function to generate complete trajectory data
    """
    logger.info(f"Starting trajectory data generation from {start_date} to {end_date}")
    
    trajectory_data = {}
    
    # Fetch data for each object
    for name, object_id in OBJECTS.items():
        logger.info(f"Processing {name}...")
        
        if name == 'atlas':
            # Try API first, fallback to Kepler if needed
            data = fetch_horizons_data(object_id, start_date, end_date, step_size)
            if data is None:
                logger.warning("API failed, using Kepler fallback for ATLAS")
                data = kepler_fallback_trajectory(start_date, end_date, step_hours=6)
        else:
            # For planets, use API only
            data = fetch_horizons_data(object_id, start_date, end_date, step_size)
            if data is None:
                logger.error(f"Failed to fetch data for {name}")
                # Use empty list as fallback for planets
                data = []
        
        trajectory_data[name] = data
        
        # Small delay to respect rate limits
        time.sleep(0.1)
    
    # Add milestones with positions
    atlas_trajectory = trajectory_data.get('atlas', [])
    milestones_with_positions = []
    
    for milestone in MILESTONES:
        position = find_position_at_date(atlas_trajectory, milestone['date'])
        if position:
            milestones_with_positions.append({
                'name': milestone['name'],
                'date': milestone['date'],
                'description': milestone['description'],
                'position': position
            })
            logger.info(f"Added milestone: {milestone['name']} at position {position}")
    
    trajectory_data['milestones'] = milestones_with_positions
    
    # Validate data
    total_points = sum(len(data) for data in trajectory_data.values() if isinstance(data, list))
    logger.info(f"Total data points generated: {total_points}")
    
    if total_points == 0:
        logger.error("No data points generated!")
        return False
    
    # Save to file
    try:
        with open(output_file, 'w') as f:
            json.dump(trajectory_data, f, indent=2)
        logger.info(f"Trajectory data saved to {output_file}")
        return True
    except Exception as e:
        logger.error(f"Error saving trajectory data: {e}")
        return False


if __name__ == '__main__':
    logger.info("=" * 80)
    logger.info("3I/ATLAS Trajectory Data Generator")
    logger.info("=" * 80)
    
    success = generate_trajectory_data()
    
    if success:
        logger.info("Trajectory generation completed successfully!")
    else:
        logger.error("Trajectory generation failed!")
        exit(1)
