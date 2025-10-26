// Minimal redirect with loop guard. No React. No TSX.
const TARGET =
  (import.meta as any).env?.VITE_TRACKER_URL ||
  "https://3iatlas-nvjlgm9oy-kjfsouls-projects.vercel.app/tracker";

try {
  const here = new URL(window.location.href);
  const goal = new URL(TARGET);
  // If we're already on the goal (same host+path), do nothing.
  if (here.origin === goal.origin && here.pathname === goal.pathname) {
    /* no-op */
  } else {
    window.location.replace(TARGET);
  }
} catch {
  window.location.href = TARGET;
}
