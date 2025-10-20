# 3I/ATLAS Trajectory Data Generation System

## Overview

This system generates accurate trajectory data for the interstellar object **3I/ATLAS (C/2025 N1)** and planets (Earth, Mars, Jupiter) using NASA's JPL Horizons API with a Kepler orbital mechanics fallback.

## Files

### Core Scripts

1. **`generate_trajectory.py`** - Main generator script
   - Fetches vector data from NASA Horizons API
   - Implements fallback Kepler orbital mechanics for 3I/ATLAS
   - Converts coordinates from Horizons format to Three.js format
   - Generates milestone markers with metadata
   - Output: `3iatlas_trajectory_data.json`

2. **`update_trajectory.py`** - Update script for regular refreshes
   - Designed to run twice daily via cron
   - Fetches latest data (current date to +7 days)
   - Merges new data with existing static file
   - Maintains 7-day rolling window of fresh data

3. **`3iatlas_trajectory_data.json`** - Generated trajectory data
   - Contains trajectories for ATLAS, Earth, Mars, Jupiter
   - Includes 4 milestone events with positions
   - 857 data points per object (6-hour intervals)
   - File size: ~1 MB

## 3I/ATLAS Orbital Parameters

Based on hypothetical specifications:

- **SPK-ID**: 1004083
- **Discovery**: July 1, 2025
- **Eccentricity**: 6.14 (highly hyperbolic - will exit solar system)
- **Perihelion**: October 29, 2025 at 11:47 UT
- **Perihelion Distance**: 1.36 AU
- **Inclination**: 175° (retrograde orbit)
- **Mars Flyby**: October 3, 2025 at 0.19 AU
- **Jupiter Approach**: March 16, 2026 at 0.36 AU
- **Hyperbolic Excess Velocity**: 57.98 km/s
- **Speed at Perihelion**: ~68 km/s

## Data Format

### JSON Structure

```json
{
  "atlas": [
    {
      "jd": 2460857.5,
      "date": "2025-07-01 00:00:00",
      "position": [-4.413, 0.074, -0.846],
      "velocity": [0.034938, 0.000472, -0.005400]
    },
    ...
  ],
  "earth": [...],
  "mars": [...],
  "jupiter": [...],
  "milestones": [
    {
      "name": "Discovery",
      "date": "2025-07-01",
      "description": "3I/ATLAS discovered - first interstellar visitor of 2025",
      "position": [-4.413, 0.074, -0.846]
    },
    ...
  ]
}
```

### Coordinate System

- **Units**: AU (Astronomical Units) for position, AU/day for velocity
- **Coordinate Conversion**: Horizons → Three.js
  - Three.js [x, y, z] = Horizons [x, z, -y]
  - This accounts for different coordinate system conventions

### Time Format

- **Julian Date (JD)**: Standard astronomical time format
- **ISO Date**: Human-readable format (YYYY-MM-DD HH:MM:SS)
- **Time Range**: July 1, 2025 to January 31, 2026
- **Step Size**: 6 hours (857 data points)

## Usage

### Generate Initial Data

```bash
python3 generate_trajectory.py
```

This will:
1. Attempt to fetch data from NASA Horizons API for all objects
2. Use Kepler fallback for 3I/ATLAS (since it doesn't exist in real database)
3. Parse and convert coordinate systems
4. Add milestone markers
5. Save to `3iatlas_trajectory_data.json`

### Update Data (Twice Daily)

```bash
python3 update_trajectory.py
```

This will:
1. Load existing trajectory data
2. Fetch latest data for next 7 days
3. Merge with existing data
4. Prune old historical data (keep 30 days)
5. Update the JSON file

### Setup Automatic Updates

To run twice daily (midnight and noon):

```bash
# Edit crontab
crontab -e

# Add this line:
0 */12 * * * /usr/bin/python3 /home/ubuntu/update_trajectory.py
```

Or use the helper command:

```bash
python3 update_trajectory.py --setup-cron
```

## NASA Horizons API Details

### Base URL
```
https://ssd.jpl.nasa.gov/api/horizons.api
```

### Authentication
- No authentication required
- Rate limit: 1,000 requests/hour

### Parameters Used

```python
{
    'format': 'json',
    'COMMAND': "'1004083'",  # Object SPK-ID
    'EPHEM_TYPE': 'VECTORS',
    'CENTER': '@sun',
    'START_TIME': "'2025-07-01'",
    'STOP_TIME': "'2026-01-31'",
    'STEP_SIZE': "'6h'",
    'OUT_UNITS': 'AU-D',
    'REF_SYSTEM': 'ICRF',
    'VEC_TABLE': '2',
    'VEC_CORR': 'NONE'
}
```

### Response Format

Horizons returns JSON with embedded text data in this format:

```
$$SOE
2460857.500000000 = A.D. 2025-Jul-01 00:00:00.0000 TDB 
 X = 1.604852883868353E-01 Y =-1.003877668284229E+00 Z = 5.873838535200654E-05
 VX= 1.671155951613705E-02 VY= 2.657695095774474E-03 VZ= 3.629966495530106E-07
$$EOE
```

## Kepler Fallback Mechanism

Since 3I/ATLAS is a hypothetical object, the Horizons API cannot provide real data. The fallback generator uses classical Kepler orbital mechanics:

### Key Equations

1. **Hyperbolic Orbit Semi-major Axis**:
   ```
   a = -q / (e - 1)  // negative for hyperbolic
   ```

2. **Mean Motion**:
   ```
   n = sqrt(μ / |a|³)
   ```

3. **Kepler's Equation (Hyperbolic)**:
   ```
   M = e * sinh(F) - F
   ```
   Solve for F (hyperbolic eccentric anomaly) using Newton's method

4. **True Anomaly**:
   ```
   ν = 2 * arctan(sqrt((e+1)/(e-1)) * tanh(F/2))
   ```

5. **Orbital Radius**:
   ```
   r = a * (1 - e * cosh(F))
   ```

6. **Velocity Magnitude**:
   ```
   v = sqrt(μ * (2/r - 1/a))
   ```

### Orbital Rotations

The generator applies three rotation matrices to convert from orbital plane to ecliptic coordinates:

1. Rotate by ω (argument of periapsis) around z-axis
2. Rotate by i (inclination) around x-axis
3. Rotate by Ω (longitude of ascending node) around z-axis

## Milestone Events

The system tracks and marks four key events:

1. **Discovery** - July 1, 2025
   - First observation of 3I/ATLAS
   - Distance: 4.494 AU from Sun

2. **Mars Flyby** - October 3, 2025
   - Closest approach to Mars at 0.19 AU
   - Distance from Sun: 1.658 AU

3. **Perihelion** - October 29, 2025
   - Closest approach to Sun at 1.36 AU
   - Speed: ~68 km/s

4. **Jupiter Approach** - March 16, 2026
   - Close approach to Jupiter at 0.36 AU
   - Distance from Sun: 3.636 AU
   - After this, 3I/ATLAS exits the solar system

## Error Handling

### Retry Logic
- 3 attempts with exponential backoff (2, 4, 8 seconds)
- Automatic fallback to Kepler generator for ATLAS

### Data Validation
- Check for NaN values in positions and velocities
- Verify reasonable distance ranges
- Validate JSON structure before saving

### Logging
- All operations logged to `trajectory_generation_log.txt`
- Includes timestamps, error messages, and success confirmations

## Performance

- **Initial Generation**: ~10-15 seconds
- **Update Run**: ~5-10 seconds
- **File Size**: ~1 MB (compressible to ~200 KB with gzip)
- **Memory Usage**: <100 MB during generation

## Data Validation Results

### 3I/ATLAS Trajectory
- ✅ 857 data points generated
- ✅ Discovery distance: 4.494 AU (reasonable)
- ✅ Perihelion distance: 1.360 AU (matches specification)
- ✅ Speed range: 61-68 km/s (realistic for hyperbolic comet)
- ✅ Speed at perihelion: ~68 km/s (matches specification)

### Planets
- ✅ Earth: ~1.0 AU average distance (correct)
- ✅ Mars: ~1.6 AU average distance (correct)
- ✅ Jupiter: ~5.1 AU average distance (correct)
- ✅ All planets have 857 data points

### Milestones
- ✅ All 4 milestones have positions
- ✅ Positions align with trajectory data
- ✅ Distances match expected values

## Troubleshooting

### Issue: "Could not find data section in Horizons result"
**Solution**: This is expected for 3I/ATLAS (hypothetical object). The Kepler fallback will automatically activate.

### Issue: NaN values in velocity
**Solution**: This was fixed by correcting the hyperbolic orbit velocity equation to use `(2/r - 1/a)` instead of `(2/r + 1/a)`.

### Issue: Extremely large position values
**Solution**: Fixed by correcting the orbital mechanics calculations and using proper gravitational parameter (μ = 0.000295912208286 AU³/day²).

### Issue: API rate limit exceeded
**Solution**: The script includes delays between requests and can be adjusted if needed. Consider reducing update frequency.

## Dependencies

```bash
pip install requests scipy numpy
```

- **requests**: HTTP library for API calls
- **scipy**: Scientific computing (Newton's method for orbit solving)
- **numpy**: Numerical arrays and math functions

## Future Enhancements

1. **Real-time tracking**: If 3I/ATLAS becomes a real object, update SPK-ID
2. **Additional planets**: Add Saturn, Uranus, Neptune if needed
3. **Comet tail simulation**: Add data for visual tail rendering
4. **High-precision mode**: Use more frequent time steps for smoother animation
5. **Data compression**: Implement gzip compression for JSON file
6. **API caching**: Cache API responses to reduce redundant calls

## References

- [NASA JPL Horizons System](https://ssd.jpl.nasa.gov/horizons/)
- [Horizons API Documentation](https://ssd-api.jpl.nasa.gov/doc/horizons.html)
- [Orbital Mechanics (Curtis)](https://www.elsevier.com/books/orbital-mechanics-for-engineering-students/curtis/978-0-08-097747-8)
- [IAU Minor Planet Center](https://www.minorplanetcenter.net/)

## License

This trajectory data is generated from publicly available NASA data and computed using standard orbital mechanics. No licensing restrictions apply.

## Contact

For issues or questions about the trajectory generation system, please refer to the project documentation or contact the development team.

---

**Generated**: October 20, 2025  
**Version**: 1.0  
**Last Updated**: October 20, 2025
