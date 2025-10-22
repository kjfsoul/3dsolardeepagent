
/**
 * TimelinePanel Component
 * =============================
 * Interactive timeline with milestone buttons and educational content
 */

import { TimelineEvent } from '@/types/trajectory';
import { useState } from "react";
import ReactMarkdown from 'react-markdown';

type TimelinePanelVariant = 'overlay' | 'inline';

interface TimelinePanelProps {
  events: TimelineEvent[];
  onEventClick: (event: TimelineEvent) => void;
  className?: string;
  variant?: TimelinePanelVariant;
}

export function TimelinePanel({
  events,
  onEventClick,
  className = '',
  variant = 'overlay',
}: TimelinePanelProps) {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
    setIsPanelOpen(true);
    onEventClick(event);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
  };

  if (variant === 'inline') {
    return (
      <div
        className={`bg-black/60 border border-emerald-500/20 rounded-xl p-4 text-white shadow-lg backdrop-blur ${className}`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wide text-emerald-300">
            Mission Timeline
          </h3>
          {selectedEvent && (
            <button
              onClick={closePanel}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3 lg:h-[260px]">
          <div className="space-y-2 overflow-y-auto pr-1">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => handleEventClick(event)}
                className={`w-full px-3 py-2 rounded-lg transition-all text-left border ${
                  selectedEvent?.id === event.id
                    ? 'bg-emerald-600/70 border-emerald-400'
                    : event.type === 'milestone'
                      ? 'bg-emerald-700/40 border-emerald-500/40 hover:bg-emerald-600/40'
                      : 'bg-sky-700/30 border-sky-500/30 hover:bg-sky-600/30'
                }`}
                title={event.description}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-xs tracking-wide uppercase">
                    {event.name}
                  </span>
                  <span className="text-xs text-gray-300">
                    {new Date(event.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex-1 rounded-lg border border-emerald-500/20 bg-black/50 p-3 text-sm overflow-y-auto">
            {selectedEvent ? (
              <div className="space-y-2">
                <div className="text-lg font-semibold text-emerald-200">
                  {selectedEvent.name}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">
                  {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <div className="flex flex-wrap gap-3 text-xs">
                  {selectedEvent.distance_au && (
                    <span className="text-emerald-300">
                      Distance: {selectedEvent.distance_au} AU
                    </span>
                  )}
                  {selectedEvent.max_velocity_kms && (
                    <span className="text-amber-300">
                      Velocity: {selectedEvent.max_velocity_kms} km/s
                    </span>
                  )}
                </div>
                <div className="prose prose-invert prose-sm max-w-none">
                  {selectedEvent.educational_content ? (
                    <ReactMarkdown>
                      {selectedEvent.educational_content}
                    </ReactMarkdown>
                  ) : (
                    <p>{selectedEvent.description}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-gray-400 text-xs">
                Select a milestone to view mission details.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Timeline Buttons */}
      <div
        className={`fixed left-4 top-20 space-y-2 z-10 ${className}`}
      >
        {events.map((event) => (
          <button
            key={event.id}
            onClick={() => handleEventClick(event)}
            className={`block w-full px-3 py-2 rounded-lg transition-all ${
              event.type === 'milestone'
                ? 'bg-green-600/80 hover:bg-green-500'
                : 'bg-blue-600/80 hover:bg-blue-500'
            } text-white text-left backdrop-blur-md`}
            style={{
              minWidth: '250px',
              border: `2px solid ${
                event.type === 'milestone' ? '#00ff88' : '#00aaff'
              }`,
            }}
            title={event.description}
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-xs">{event.name}</span>
              <span className="text-xs opacity-80">
                {new Date(event.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Educational Content Panel (Slide-in from bottom) */}
      {isPanelOpen && selectedEvent && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-20"
            onClick={closePanel}
          />

          {/* Panel */}
          <div
            className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-6 rounded-t-2xl shadow-2xl z-30 max-h-[60vh] overflow-y-auto"
            style={{
              border: '2px solid #00ff88',
              animation: 'slideUp 0.3s ease-out',
            }}
          >
            {/* Close Button */}
            <button
              onClick={closePanel}
              className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-white transition-colors"
              title="Close"
            >
              ✕
            </button>

            {/* Content */}
            <h2 className="text-2xl font-bold text-green-400 mb-2">
              {selectedEvent.name}
            </h2>

            <div className="text-sm text-gray-400 mb-4">
              {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>

            {selectedEvent.distance_au && (
              <div className="text-blue-300 mb-2">
                Distance: {selectedEvent.distance_au} AU
              </div>
            )}

            {selectedEvent.max_velocity_kms && (
              <div className="text-yellow-300 mb-4">
                Max Velocity: {selectedEvent.max_velocity_kms} km/s
              </div>
            )}

            <div className="prose prose-invert prose-sm max-w-none">
              {selectedEvent.educational_content ? (
                <ReactMarkdown>
                  {selectedEvent.educational_content}
                </ReactMarkdown>
              ) : (
                <p>{selectedEvent.description}</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
