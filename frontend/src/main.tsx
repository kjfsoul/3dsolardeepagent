import React from "react";
import { createRoot } from "react-dom/client";

const TRACKER_URL =
  (import.meta as any).env?.VITE_TRACKER_URL ||
  "https://tracker.3iatlas.mysticarcana.com";

function App() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "black",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
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
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
