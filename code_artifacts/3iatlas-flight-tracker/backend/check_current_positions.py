#!/usr/bin/env python3
"""
Quick Position Check Script
============================
Fetches current positions from NASA Horizons for verification.
Run this anytime to check if your static data matches reality.
"""

import requests
from datetime import datetime

def fetch_position(object_id, object_name):
    """Fetch current position from Horizons API"""
    
    # Normalize command for large SPK IDs
    command = object_id
    if object_id.isdigit() and int(object_id) >= 1_000_000:
        command = f"'DES={object_id}'"
    
    today = datetime.now().strftime('%Y-%m-%d')
    
    params = {
        'COMMAND': command,
        'EPHEM_TYPE': 'VECTOR',
        'CENTER': '@sun',
        'START_TIME': today,
        'STOP_TIME': today,
        'STEP_SIZE': '1d',
        'format': 'json',
        'OUT_UNITS': 'AU-D',
        'REF_SYSTEM': 'ICRF',
        'VEC_TABLE': '2',
        'CSV_FORMAT': 'YES',
        'OBJ_DATA': 'NO'
    }
    
    try:
        response = requests.get(
            'https://ssd.jpl.nasa.gov/api/horizons.api',
            params=params,
            timeout=30
        )
        response.raise_for_status()
        data = response.json()
        
        if 'error' in data:
            print(f"❌ {object_name}: {data['error']}")
            return None
        
        result_text = data.get('result', '')
        if isinstance(result_text, list):
            result_text = '\n'.join(result_text)
        
        # Parse CSV data
        lines = result_text.split('\n')
        in_data = False
        
        for line in lines:
            if '$$SOE' in line:
                in_data = True
                continue
            if '$$EOE' in line:
                break
            
            if in_data and ',' in line:
                parts = [p.strip() for p in line.split(',')]
                if len(parts) >= 8:
                    position = {
                        'x': float(parts[2]),
                        'y': float(parts[3]),
                        'z': float(parts[4])
                    }
                    velocity = {
                        'x': float(parts[5]),
                        'y': float(parts[6]),
                        'z': float(parts[7])
                    }
                    distance = (position['x']**2 + position['y']**2 + position['z']**2)**0.5
                    
                    return {
                        'position': position,
                        'velocity': velocity,
                        'distance_au': distance
                    }
        
        return None
        
    except Exception as e:
        print(f"❌ {object_name}: {str(e)}")
        return None


def main():
    print("\n" + "="*70)
    print("CURRENT POSITIONS FROM NASA HORIZONS")
    print("="*70)
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print("="*70 + "\n")
    
    objects = [
        ('1004083', '3I/ATLAS (C/2025 N1)'),
        ('399', 'Earth'),
        ('499', 'Mars'),
        ('599', 'Jupiter'),
        ('699', 'Saturn'),
        ('299', 'Venus'),
        ('199', 'Mercury'),
    ]
    
    for obj_id, obj_name in objects:
        print(f"Fetching {obj_name}...", end=' ')
        result = fetch_position(obj_id, obj_name)
        
        if result:
            print("✓")
            pos = result['position']
            vel = result['velocity']
            dist = result['distance_au']
            
            print(f"  Position: x={pos['x']:>10.6f}, y={pos['y']:>10.6f}, z={pos['z']:>10.6f} AU")
            print(f"  Velocity: vx={vel['x']:>9.6f}, vy={vel['y']:>9.6f}, vz={vel['z']:>9.6f} AU/day")
            print(f"  Distance from Sun: {dist:.4f} AU\n")
        else:
            print()
    
    print("="*70)
    print("\nTo update your static data with these values, run:")
    print("  python3 generate_atlas_trajectory.py --force")
    print("="*70 + "\n")


if __name__ == "__main__":
    main()

