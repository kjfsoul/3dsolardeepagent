/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Tracker-Build', value: process.env.NEXT_PUBLIC_BUILD_TAG || 'timeline-fix-r1' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self' https://3iatlas.mysticarcana.com;" }
        ],
      },
    ];
  },
};
module.exports = nextConfig;
