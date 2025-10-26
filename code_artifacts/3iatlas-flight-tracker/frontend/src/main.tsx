import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const TRACKER_URL =
  (import.meta as any).env?.VITE_TRACKER_URL ||
  "https://tracker.3iatlas.mysticarcana.com"\;

function App() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "radial-gradient(ellipse at center, #000010, #000000)",
        color: "#0ff",
        fontFamily: "monospace",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {loaded ? (
        <iframe
          src={TRACKER_URL}
          title="3I/ATLAS Tracker"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            backgroundColor: "black",
          }}
          sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups allow-forms allow-downloads"
          allowFullScreen
        />
      ) : (
        <div>🚀 Initializing 3I/ATLAS Tracker…</div>
      )}
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
