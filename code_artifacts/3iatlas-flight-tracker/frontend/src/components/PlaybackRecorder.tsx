/**
 * PlaybackRecorder Component
 * =============================
 * Records the 3D scene for AI analysis and review
 */

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PlaybackRecorderProps {
  enabled?: boolean;
  duration?: number; // seconds
  onComplete?: (frames: string[]) => void;
}

export function PlaybackRecorder({ 
  enabled = false, 
  duration = 10, 
  onComplete 
}: PlaybackRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [frames, setFrames] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = () => {
    setIsRecording(true);
    setFrames([]);
    startTimeRef.current = Date.now();
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (onComplete) {
      onComplete(frames);
    }
  };

  useFrame((state) => {
    if (!isRecording || !enabled) return;

    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    if (elapsed >= duration) {
      stopRecording();
      return;
    }

    // Capture frame every 100ms
    if (Math.floor(elapsed * 10) % 1 === 0) {
      const canvas = state.gl.domElement;
      const frameData = canvas.toDataURL('image/png');
      setFrames(prev => [...prev, frameData]);
    }
  });

  return (
    <div className="absolute top-4 right-4 z-20">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-4 py-2 rounded ${
          isRecording 
            ? 'bg-red-500 text-white' 
            : 'bg-blue-500 text-white'
        }`}
      >
        {isRecording ? 'Stop Recording' : 'Record Playback'}
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
      suggestions: []
    };

    // Basic analysis - can be enhanced with computer vision
    if (frame.includes('data:image/png')) {
      // Frame captured successfully
      analysis.issues.push('Frame captured');
    }

    analyses.push(analysis);
  });

  return analyses;
}
