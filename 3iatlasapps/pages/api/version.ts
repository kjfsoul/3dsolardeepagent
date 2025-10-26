import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    app: '3I/ATLAS tracker',
    tag: process.env.NEXT_PUBLIC_BUILD_TAG || 'timeline-fix-r1',
    sha: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    date: new Date().toISOString(),
  });
}
