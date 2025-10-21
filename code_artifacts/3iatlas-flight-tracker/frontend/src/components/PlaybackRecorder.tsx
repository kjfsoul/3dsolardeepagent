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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = () => {
    setIsRecording(true);
    setFrames([]);
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
    if (onComplete) {
      onComplete(frames);
    }
  };

  // Auto-stop after duration
  if (isRecording && Date.now() - startTimeRef.current >= duration * 1000) {
    stopRecording();
  }

  return (
    <div className="absolute top-4 right-4 z-20">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-4 py-2 rounded ${
          isRecording ? "bg-red-500 text-white" : "bg-blue-500 text-white"
        }`}
      >
        {isRecording ? "Stop Recording" : "Record Playback"}
      </button>
      {isRecording && (
        <div className="text-white text-sm mt-2">
          Recording... {Math.floor((Date.now() - startTimeRef.current) / 1000)}s
        </div>
      )}
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
