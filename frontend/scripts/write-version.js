const fs = require('fs')
const path = require('path')
const out = {
  app: '3I/ATLAS tracker',
  tag: process.env.NEXT_PUBLIC_BUILD_TAG || 'timeline-fix-r1',
  sha: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
  date: new Date().toISOString()
}
const dist = path.join(__dirname, '..', 'dist')
fs.mkdirSync(dist, { recursive: true })
fs.writeFileSync(path.join(dist, 'version.json'), JSON.stringify(out, null, 2))
console.log('[write-version] wrote', path.join(dist, 'version.json'))
