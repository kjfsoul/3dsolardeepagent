
/**
 * Main App Component
 */

import { Atlas3DTrackerEnhanced } from './components/Atlas3DTrackerEnhanced';
import './styles/globals.css';

function App() {
  // Read URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const autoPlay = urlParams.get('autoPlay') !== 'false';
  const initialSpeed = parseInt(urlParams.get('speed') || '10', 10);
  const initialViewMode = (urlParams.get('view') as /* 'explorer' | */ 'true-scale' | 'ride-atlas') || 'ride-atlas'; // Explorer commented out

  return (
    <div className="layout-container">
      <main className="main-content">
        <Atlas3DTrackerEnhanced
          autoPlay={autoPlay}
          initialSpeed={initialSpeed}
          initialViewMode={initialViewMode}
        />
      </main>
    </div>
  );
}

export default App;
