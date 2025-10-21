# 3I/ATLAS Trajectory Data Automation

This repository includes automated workflows to keep 3I/ATLAS trajectory data current with NASA JPL Horizons.

## 🤖 Automated Workflows

### 1. Push-Triggered Update
**File:** `.github/workflows/update-trajectory-data.yml`
- **Triggers:** Every push to `main` branch
- **Action:** Updates trajectory data and commits changes
- **Manual trigger:** Available in GitHub Actions tab

### 2. Daily Scheduled Update  
**File:** `.github/workflows/daily-trajectory-update.yml`
- **Triggers:** Daily at 6:00 AM UTC
- **Action:** Fetches latest NASA data and commits if changes exist
- **Manual trigger:** Available in GitHub Actions tab

## 🛠️ Manual Update Script

**File:** `update-trajectory.sh`
```bash
# Run from project root
./update-trajectory.sh
```

This script:
- Fetches latest NASA Horizons data
- Commits changes if new data is available
- Pushes to repository
- Provides status updates

## 📊 What Gets Updated

**Objects Tracked:**
- 3I/ATLAS (SPK-ID: 1004083)
- All planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto
- Major asteroids: Ceres, Vesta, Pallas

**Data Files:**
- `frontend/public/data/trajectory_static.json` - Position/velocity data
- `frontend/public/data/timeline_events.json` - Key event markers

**Date Range:** July 1, 2025 → March 31, 2026
**Update Frequency:** 6-hour intervals for 3I/ATLAS, daily for planets

## 🎯 Your Role

**Daily Check (Optional):**
1. Visit GitHub Actions tab
2. Verify workflows completed successfully
3. Check commit messages for data updates

**Manual Override:**
```bash
# Force update anytime
./update-trajectory.sh
```

## 🔍 Verification

**Check Data Freshness:**
```bash
# View last update timestamp
ls -la code_artifacts/3iatlas-flight-tracker/frontend/public/data/

# Check commit history
git log --oneline -10
```

**Expected Behavior:**
- ✅ Workflows run automatically
- ✅ Only commits when new data is available
- ✅ Maintains data accuracy for perihelion (Oct 29, 2025)
- ✅ No manual intervention required

## 🚨 Troubleshooting

**If workflows fail:**
1. Check GitHub Actions logs
2. Verify NASA Horizons API availability
3. Run manual script: `./update-trajectory.sh`
4. Check Python dependencies in workflow

**If no updates occur:**
- NASA data may be unchanged (normal)
- Check API rate limits
- Verify date range includes current date
