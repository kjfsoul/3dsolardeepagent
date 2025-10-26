import React from "react";
import { createRoot } from "react-dom/client";

const TRACKER_URL =
  (import.meta as any).env?.VITE_TRACKER_URL ||
  "https://tracker.3iatlas.mysticarcana.com"; // fallback runtime endpoint

function App() {
  return (
    <div style={{ position: "fixed", inset: 0, background: "black" }}>
      <iframe
        src={TRACKER_URL}
        title="3I/ATLAS Tracker"
        style={{
          width: "100%",
          height: "100%",
          border: "0",
          display: "block",
          background: "black"
        }}
        allow="accelerometer; gyroscope; fullscreen"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
