
/**
 * TimelinePanel Component
 * =============================
 * Interactive timeline with milestone buttons and educational content
 */

import { useState } from 'react';
import { TimelineEvent } from '@/types/trajectory';
import ReactMarkdown from 'react-markdown';

interface TimelinePanelProps {
  events: TimelineEvent[];
  onEventClick: (event: TimelineEvent) => void;
  className?: string;
}

export function TimelinePanel({
  events,
  onEventClick,
  className = '',
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
