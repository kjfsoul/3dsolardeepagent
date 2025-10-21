
/**
 * Main App Component
 */

import { Atlas3DTrackerEnhanced } from './components/Atlas3DTrackerEnhanced';
import './styles/globals.css';

function App() {
  return (
    <div className="App">
      <Atlas3DTrackerEnhanced
        autoPlay={true}
        initialSpeed={2}
        initialViewMode="ride-atlas"
      />
    </div>
  );
}

export default App;
