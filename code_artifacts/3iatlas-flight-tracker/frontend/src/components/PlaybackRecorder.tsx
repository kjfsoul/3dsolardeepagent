/**
 * PlaybackRecorder Component
 * =============================
 * Simple recording component for capturing screenshots
 */

import { useRef, useState } from "react";

interface PlaybackRecorderProps {
  enabled?: boolean;
  duration?: number; // seconds
  onComplete?: (frames: string[]) => void;
}

export function PlaybackRecorder({
  enabled = false,
  duration = 10,
  onComplete,
}: PlaybackRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [frames, setFrames] = useState<string[]>([]);
  const [recordedFrames, setRecordedFrames] = useState<string[]>([]);
  const [showPlayback, setShowPlayback] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = () => {
    setIsRecording(true);
    setFrames([]);
    setShowPlayback(false);
    startTimeRef.current = Date.now();
    
    // Capture frames every 100ms
    intervalRef.current = setInterval(() => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const frameData = canvas.toDataURL("image/png");
        setFrames((prev) => [...prev, frameData]);
      }
    }, 100);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Store the recorded frames
    setRecordedFrames(frames);
    setShowPlayback(true);
    
    if (onComplete) {
      onComplete(frames);
    }
  };

  const downloadFrames = () => {
    if (recordedFrames.length === 0) return;
    
    // Create a zip-like structure (simplified - just download first frame as example)
    const firstFrame = recordedFrames[0];
    const link = document.createElement('a');
    link.href = firstFrame;
    link.download = `atlas-recording-${new Date().toISOString().slice(0, 19)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllFrames = () => {
    if (recordedFrames.length === 0) return;
    
    // Create a JSON file with all frame data
    const frameData = {
      timestamp: new Date().toISOString(),
      duration: duration,
      frameCount: recordedFrames.length,
      frames: recordedFrames
    };
    
    const blob = new Blob([JSON.stringify(frameData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `atlas-recording-${new Date().toISOString().slice(0, 19)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Auto-stop after duration
  if (isRecording && Date.now() - startTimeRef.current >= duration * 1000) {
    stopRecording();
  }

  return (
    <div className="absolute top-4 left-4 z-20">
      <div className="bg-black/70 backdrop-blur-sm text-white p-3 rounded-lg border border-cyan-500/30">
        <div className="font-bold text-cyan-400 mb-2">🎥 Recording</div>
        
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`px-4 py-2 rounded mb-2 ${
            isRecording ? "bg-red-500 text-white" : "bg-blue-500 text-white"
          }`}
        >
          {isRecording ? "Stop Recording" : "Record Playback"}
        </button>
        
        {isRecording && (
          <div className="text-white text-sm mb-2">
            Recording... {Math.floor((Date.now() - startTimeRef.current) / 1000)}s
          </div>
        )}
        
        {showPlayback && recordedFrames.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-600">
            <div className="text-green-400 text-sm mb-2">
              ✅ Recorded {recordedFrames.length} frames
            </div>
            <div className="space-y-1">
              <button
                onClick={downloadFrames}
                className="w-full px-2 py-1 bg-green-600 hover:bg-green-500 rounded text-xs"
              >
                Download Sample Frame
              </button>
              <button
                onClick={downloadAllFrames}
                className="w-full px-2 py-1 bg-purple-600 hover:bg-purple-500 rounded text-xs"
              >
                Download All Data (JSON)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Frame Analyzer - For AI Analysis
 * ================================
 * Analyzes recorded frames for issues
 */

interface FrameAnalysis {
  timestamp: number;
  issues: string[];
  suggestions: string[];
}

export function analyzeFrames(frames: string[]): FrameAnalysis[] {
  const analyses: FrameAnalysis[] = [];

  frames.forEach((frame, index) => {
    const analysis: FrameAnalysis = {
      timestamp: index * 0.1, // 100ms intervals
      issues: [],
      suggestions: [],
    };

    // Basic analysis - can be enhanced with computer vision
    if (frame.includes("data:image/png")) {
      // Frame captured successfully
      analysis.issues.push("Frame captured");
    }

    analyses.push(analysis);
  });

  return analyses;
}
