const url =
  (import.meta as any).env?.VITE_TRACKER_URL ||
  "https://tracker.3iatlas.mysticarcana.com"\;
window.location.replace(url);
