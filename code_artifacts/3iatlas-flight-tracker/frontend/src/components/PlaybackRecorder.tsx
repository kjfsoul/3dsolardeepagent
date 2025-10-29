/**
 * PlaybackRecorder Component
 * =============================
 * Records the 3D scene as video (MP4/WebM) and frame data
 */

import { useRef, useState } from "react";

interface PlaybackRecorderProps {
  enabled?: boolean;
  duration?: number; // seconds
  onComplete?: (frames: string[]) => void;
}

export function PlaybackRecorder({
  enabled: _enabled = false, // for future use
  duration = 10,
  onComplete,
}: PlaybackRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [frames, setFrames] = useState<string[]>([]);
  const [recordedFrames, setRecordedFrames] = useState<string[]>([]);
  const [showPlayback, setShowPlayback] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = async () => {
    setIsRecording(true);
    setFrames([]);
    setShowPlayback(false);
    setVideoBlob(null);
    startTimeRef.current = Date.now();

    try {
      // Get the canvas element
      const canvas = document.querySelector("canvas") as HTMLCanvasElement;
      if (!canvas) {
        console.error("Canvas not found");
        return;
      }

      // Capture canvas as video stream
      const stream = canvas.captureStream(10); // 10 FPS for smooth video

      // Determine supported codec
      let mimeType = "";
      if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
        mimeType = "video/webm;codecs=vp9";
      } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
        mimeType = "video/webm;codecs=vp8";
      } else if (MediaRecorder.isTypeSupported("video/webm")) {
        mimeType = "video/webm";
      } else if (MediaRecorder.isTypeSupported("video/mp4")) {
        mimeType = "video/mp4";
      } else {
        throw new Error("No supported video codec found");
      }

      console.log(`Using codec: ${mimeType}`);

      // Create MediaRecorder for video
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps for good quality
      });

      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: mimeType });
        setVideoBlob(videoBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second

      // Also capture individual frames for analysis
      intervalRef.current = setInterval(() => {
        const frameData = canvas.toDataURL("image/png");
        setFrames((prev) => [...prev, frameData]);
      }, 100);
    } catch (error) {
      console.error("Error starting video recording:", error);
      setIsRecording(false);

      // Fallback to frame-only recording
      console.log("Falling back to frame-only recording...");
      intervalRef.current = setInterval(() => {
        const canvas = document.querySelector("canvas") as HTMLCanvasElement;
        if (canvas) {
          const frameData = canvas.toDataURL("image/png");
          setFrames((prev) => [...prev, frameData]);
        }
      }, 100);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);

    // Stop video recording
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }

    // Stop frame capture
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

  const downloadVideo = () => {
    if (!videoBlob) return;

    const url = URL.createObjectURL(videoBlob);
    const link = document.createElement("a");
    link.href = url;

    // Determine file extension based on blob type
    let extension = "webm";
    if (videoBlob.type.includes("mp4")) {
      extension = "mp4";
    } else if (videoBlob.type.includes("webm")) {
      extension = "webm";
    }

    link.download = `atlas-recording-${new Date()
      .toISOString()
      .slice(0, 19)}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadFrames = () => {
    if (recordedFrames.length === 0) return;

    // Create a zip-like structure (simplified - just download first frame as example)
    const firstFrame = recordedFrames[0];
    const link = document.createElement("a");
    link.href = firstFrame;
    link.download = `atlas-recording-${new Date()
      .toISOString()
      .slice(0, 19)}.png`;
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
      frames: recordedFrames,
    };

    const blob = new Blob([JSON.stringify(frameData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `atlas-recording-${new Date()
      .toISOString()
      .slice(0, 19)}.json`;
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
      <div className="bg-black/70 backdrop-blur-sm text-white p-3 rounded-lg max-w-xs">
        <div className="font-bold text-cyan-400 mb-2">🎥 Video Recording</div>

        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`px-4 py-2 rounded mb-2 w-full ${
            isRecording ? "bg-red-500 text-white" : "bg-blue-500 text-white"
          }`}
        >
          {isRecording ? "Stop Recording" : "Record Video"}
        </button>

        {isRecording && (
          <div className="text-white text-sm mb-2">
            Recording...{" "}
            {Math.floor((Date.now() - startTimeRef.current) / 1000)}s
          </div>
        )}

        {showPlayback && (
          <div className="mt-2 pt-2">
            <div className="text-green-400 text-sm mb-2">
              ✅ Recording Complete
            </div>
            <div className="space-y-1">
              {videoBlob && (
                <button
                  onClick={downloadVideo}
                  className="w-full px-2 py-1 bg-red-600 hover:bg-red-500 rounded text-xs"
                >
                  📹 Download Video (WebM)
                </button>
              )}
              <button
                onClick={downloadFrames}
                className="w-full px-2 py-1 bg-green-600 hover:bg-green-500 rounded text-xs"
              >
                🖼️ Sample Frame (PNG)
              </button>
              <button
                onClick={downloadAllFrames}
                className="w-full px-2 py-1 bg-purple-600 hover:bg-purple-500 rounded text-xs"
              >
                📊 All Data (JSON)
              </button>
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Video:{" "}
              {videoBlob
                ? `${(videoBlob.size / 1024 / 1024).toFixed(1)}MB (${
                    videoBlob.type.split("/")[1]
                  })`
                : "Processing..."}
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
