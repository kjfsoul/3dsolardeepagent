/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // handy breadcrumb to confirm which build is live
          {
            key: "X-Tracker-Build",
            value: process.env.NEXT_PUBLIC_BUILD_TAG || "timeline-fix-r1",
          },

          // allow embedding only from your main site
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://3iatlas.mysticarcana.com;",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
