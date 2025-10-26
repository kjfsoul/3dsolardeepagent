const fs = require('fs');
const path = require('path');

const payload = {
  app: '3I/ATLAS tracker (vite)',
  tag: process.env.NEXT_PUBLIC_BUILD_TAG || 'timeline-fix-r1',
  sha: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
  date: new Date().toISOString()
};

const dist = path.join(__dirname, '..', 'dist');
const apiDir = path.join(dist, 'api', 'version');

fs.mkdirSync(dist, { recursive: true });
fs.mkdirSync(apiDir, { recursive: true });

// 1) JSON at /version.json
fs.writeFileSync(path.join(dist, 'version.json'), JSON.stringify(payload, null, 2));

// 2) JSON-visible HTML at /api/version (no routing required)
const html = `<!doctype html><meta charset="utf-8"><pre>${JSON.stringify(payload, null, 2)}</pre>`;
fs.writeFileSync(path.join(apiDir, 'index.html'), html);

console.log('[write-version] wrote dist/version.json and dist/api/version/index.html');
