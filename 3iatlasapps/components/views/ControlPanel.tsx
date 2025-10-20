'use client';

/**
 * Control Panel Component - Shared UI Controls for 3I/ATLAS Views
 * Consistent control panel design across all views
 * Loading states and error handling
 * Responsive design for mobile/desktop
 */

import React from 'react';
// Using inline SVG icons instead of lucide-react to avoid dependency
const Loader2 = ({ className }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const AlertCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Play = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Pause = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RotateCcw = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const Settings = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

interface ControlPanelProps {
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onReset?: () => void;
  onSettings?: () => void;
  loading?: boolean;
  error?: string | null;
  className?: string;
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
}

interface StatProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
}

const Stat: React.FC<StatProps> = ({ label, value, unit = '', color = 'text-white' }) => (
  <div className="text-center">
    <div className="text-white/60 text-xs uppercase tracking-wide">{label}</div>
    <div className={`${color} font-mono font-bold text-lg`}>
      {value}
      {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
    </div>
  </div>
);

const ControlPanel: React.FC<ControlPanelProps> = ({
  isPlaying = false,
  onPlayPause,
  onReset,
  onSettings,
  loading = false,
  error = null,
  className = '',
  children,
  title,
  subtitle
}) => {
  return (
    <div className={`bg-black/80 backdrop-blur-sm rounded-lg border border-white/20 ${className}`}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="p-4 border-b border-white/10">
          {title && (
            <div className="text-white font-semibold text-sm">{title}</div>
          )}
          {subtitle && (
            <div className="text-white/60 text-xs mt-1">{subtitle}</div>
          )}
        </div>
      )}

      {/* Status Section */}
      {(loading || error) && (
        <div className="p-4 border-b border-white/10">
          {loading && (
            <div className="flex items-center gap-3 text-blue-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading data...</span>
            </div>
          )}
          
          {error && (
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Main Controls */}
      <div className="p-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          {onPlayPause && (
            <button
              onClick={onPlayPause}
              disabled={loading || !!error}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                ${loading || error
                  ? 'bg-white/10 text-white/50 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                }
              `}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Play</span>
                </>
              )}
            </button>
          )}

          {onReset && (
            <button
              onClick={onReset}
              disabled={loading || !!error}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200
                ${loading || error
                  ? 'bg-white/10 text-white/50 cursor-not-allowed'
                  : 'bg-white/10 hover:bg-white/20 text-white'
                }
              `}
              aria-label="Reset"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          {onSettings && (
            <button
              onClick={onSettings}
              disabled={loading || !!error}
              className={`
                p-2 rounded-lg transition-all duration-200
                ${loading || error
                  ? 'bg-white/10 text-white/50 cursor-not-allowed'
                  : 'bg-white/10 hover:bg-white/20 text-white'
                }
              `}
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Children Content */}
        {children && (
          <div className="space-y-4">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;
export { Stat };
