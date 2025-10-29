/**
 * Countdown Component
 * =============================
 * Real-time countdown to 3I/ATLAS perihelion
 */

import { useEffect, useState } from 'react';

export default function Countdown() {
  const target = new Date('2025-10-29T19:10:00Z').getTime();
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setRemaining('☀️ Perihelion Reached!');
        return;
      }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);

      setRemaining(`${days}d ${hours}h ${mins}m ${secs}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="countdown bg-black/70 backdrop-blur-sm text-white p-3 rounded-lg border border-cyan-500/30">
      <h3 className="text-lg font-bold text-cyan-400 mb-2">Perihelion Countdown</h3>
      <p className="text-sm font-mono">{remaining}</p>
    </div>
  );
}
