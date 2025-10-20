#!/usr/bin/env python3
"""
3I/ATLAS Trajectory Update Script
Updates trajectory data with latest information from NASA Horizons API
Designed to run twice daily via cron or scheduler
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List
from generate_trajectory import (
    fetch_horizons_data, 
    kepler_fallback_trajectory,
    find_position_at_date,
    OBJECTS,
    logger,
    horizons_to_threejs
)

# Setup additional logging for update script
update_logger = logging.getLogger('update_script')

# Configuration
DATA_FILE = '/home/ubuntu/3iatlas_trajectory_data.json'
ROLLING_WINDOW_DAYS = 7  # Maintain 7-day rolling window of fresh data


def load_existing_data() -> Dict:
    """
    Load existing trajectory data from file
    """
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
        logger.info(f"Loaded existing data from {DATA_FILE}")
        return data
    except FileNotFoundError:
        logger.warning(f"Data file not found: {DATA_FILE}. Starting with empty data.")
        return {}
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing JSON from {DATA_FILE}: {e}")
        return {}


def get_date_range_for_update() -> tuple:
    """
    Calculate date range for update (current date to +7 days)
    """
    now = datetime.now()
    start_date = now.strftime('%Y-%m-%d')
    end_date = (now + timedelta(days=ROLLING_WINDOW_DAYS)).strftime('%Y-%m-%d')
    
    return start_date, end_date


def merge_trajectory_data(existing: List[Dict], new: List[Dict]) -> List[Dict]:
    """
    Merge new trajectory data with existing data
    Remove old "future" data and add fresh predictions
    """
    if not existing:
        return new
    
    if not new:
        return existing
    
    # Convert to dict keyed by date for easy merging
    merged = {}
    
    # Add existing data
    for point in existing:
        date_key = point.get('date', '').split()[0]  # Get date part only
        if date_key:
            merged[date_key] = point
    
    # Add/overwrite with new data
    for point in new:
        date_key = point.get('date', '').split()[0]
        if date_key:
            merged[date_key] = point
    
    # Convert back to list and sort by date
    result = list(merged.values())
    result.sort(key=lambda x: x.get('jd', 0))
    
    return result


def prune_old_data(trajectory: List[Dict], cutoff_date: datetime) -> List[Dict]:
    """
    Remove data points older than cutoff date (but keep some historical context)
    Keep at least 30 days of historical data
    """
    historical_cutoff = cutoff_date - timedelta(days=30)
    
    pruned = []
    for point in trajectory:
        try:
            date_str = point['date'].split()[0]
            point_dt = datetime.fromisoformat(date_str)
            
            if point_dt >= historical_cutoff:
                pruned.append(point)
        except:
            # If date parsing fails, keep the point
            pruned.append(point)
    
    return pruned


def update_trajectory_data() -> bool:
    """
    Main update function
    Fetches latest data and merges with existing
    """
    logger.info("=" * 80)
    logger.info("Starting trajectory data update")
    logger.info("=" * 80)
    
    # Load existing data
    existing_data = load_existing_data()
    
    # Get date range for update
    start_date, end_date = get_date_range_for_update()
    logger.info(f"Fetching updates from {start_date} to {end_date}")
    
    # Update each object's trajectory
    updated_data = existing_data.copy()
    
    for name, object_id in OBJECTS.items():
        logger.info(f"Updating {name}...")
        
        # Fetch new data
        if name == 'atlas':
            new_data = fetch_horizons_data(object_id, start_date, end_date, step_size='6h')
            if new_data is None:
                logger.warning("API failed, using Kepler fallback for ATLAS")
                new_data = kepler_fallback_trajectory(start_date, end_date, step_hours=6)
        else:
            new_data = fetch_horizons_data(object_id, start_date, end_date, step_size='6h')
            if new_data is None:
                logger.error(f"Failed to fetch data for {name}, keeping existing data")
                continue
        
        # Merge with existing
        existing_trajectory = existing_data.get(name, [])
        merged_trajectory = merge_trajectory_data(existing_trajectory, new_data)
        
        # Prune old data
        merged_trajectory = prune_old_data(merged_trajectory, datetime.now())
        
        updated_data[name] = merged_trajectory
        logger.info(f"Updated {name}: {len(merged_trajectory)} total points")
    
    # Update milestones (in case ATLAS position changed)
    if 'milestones' in existing_data and 'atlas' in updated_data:
        atlas_trajectory = updated_data['atlas']
        updated_milestones = []
        
        for milestone in existing_data['milestones']:
            position = find_position_at_date(atlas_trajectory, milestone['date'])
            if position:
                updated_milestones.append({
                    'name': milestone['name'],
                    'date': milestone['date'],
                    'description': milestone['description'],
                    'position': position
                })
        
        updated_data['milestones'] = updated_milestones
    
    # Add update timestamp
    updated_data['last_updated'] = datetime.now().isoformat()
    
    # Save updated data
    try:
        with open(DATA_FILE, 'w') as f:
            json.dump(updated_data, f, indent=2)
        logger.info(f"Updated trajectory data saved to {DATA_FILE}")
        
        # Log statistics
        total_points = sum(len(data) for data in updated_data.values() 
                          if isinstance(data, list))
        logger.info(f"Total data points: {total_points}")
        
        return True
    except Exception as e:
        logger.error(f"Error saving updated data: {e}")
        return False


def setup_cron_job():
    """
    Helper function to display instructions for setting up cron job
    """
    cron_command = f"0 */12 * * * /usr/bin/python3 {__file__}"
    
    print("\n" + "=" * 80)
    print("CRON JOB SETUP INSTRUCTIONS")
    print("=" * 80)
    print("\nTo run this update script twice daily, add the following to your crontab:")
    print(f"\n  {cron_command}\n")
    print("This will run the update at midnight and noon every day.")
    print("\nTo edit crontab, run: crontab -e")
    print("=" * 80 + "\n")


if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--setup-cron':
        setup_cron_job()
    else:
        success = update_trajectory_data()
        
        if success:
            logger.info("Trajectory update completed successfully!")
        else:
            logger.error("Trajectory update failed!")
            exit(1)
