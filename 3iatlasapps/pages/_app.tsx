import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  if (typeof window !== 'undefined') {
    console.info(
      '3I/ATLAS tracker build:',
      process.env.NEXT_PUBLIC_BUILD_TAG ?? 'timeline-fix-r1',
      process.env.VERCEL_GIT_COMMIT_SHA ?? 'no-sha'
    );
  }
  return <Component {...pageProps} />;
}
