#!/bin/bash
# Auto-update trajectory data script
# Usage: ./update-trajectory.sh

set -e  # Exit on any error

echo "🚀 3I/ATLAS Trajectory Data Auto-Update"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "code_artifacts/3iatlas-flight-tracker/backend/generate_atlas_trajectory.py" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   Expected: /Users/kfitz/3dsolardeepagent/"
    exit 1
fi

# Navigate to backend directory
cd code_artifacts/3iatlas-flight-tracker/backend

echo "📡 Fetching latest NASA Horizons data..."
echo "   Objects: 3I/ATLAS, Earth, Mars, Jupiter, Mercury, Venus, Saturn, Uranus, Neptune, Pluto, Ceres, Vesta, Pallas"
echo "   Date range: July 1, 2025 → March 31, 2026"
echo ""

# Run the trajectory update
python3 generate_atlas_trajectory.py --force

echo ""
echo "✅ Trajectory data updated successfully!"
echo ""

# Check if there are changes to commit
if git diff --quiet; then
    echo "ℹ️  No changes detected - data is already current"
else
    echo "📊 New trajectory data detected"
    echo ""
    echo "🔄 Committing changes..."
    
    # Add the updated data files
    git add ../frontend/public/data/
    
    # Commit with timestamp
    git commit -m "🤖 Auto-update trajectory data from NASA Horizons

- Updated 3I/ATLAS ephemeris data
- Refreshed planetary positions  
- Generated on: $(date -u +'%Y-%m-%d %H:%M:%S UTC')
- Source: NASA JPL Horizons System"
    
    echo "🚀 Pushing to repository..."
    git push
    
    echo ""
    echo "✅ Changes committed and pushed successfully!"
fi

echo ""
echo "🎯 Next steps:"
echo "   1. Check GitHub Actions tab for workflow status"
echo "   2. Verify data in frontend/public/data/"
echo "   3. Test visualization at http://localhost:5173"
echo ""
echo "📅 Last update: $(date)"
