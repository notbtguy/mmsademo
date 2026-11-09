import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

// STORAGE_S3_PUBLIC_URL (set only when STORAGE_DRIVER=s3 — see payload.config.ts)
// is the public base URL of the media bucket, e.g. an R2 "Public Development
// URL" (https://pub-xxxx.r2.dev) or a custom domain. next/image needs its
// hostname allow-listed to optimize images served from there.
let mediaBucketHost: { hostname: string; protocol: 'http' | 'https' } | null = null
if (process.env.STORAGE_S3_PUBLIC_URL) {
  const parsed = new URL(process.env.STORAGE_S3_PUBLIC_URL)
  mediaBucketHost = { hostname: parsed.hostname, protocol: parsed.protocol === 'http:' ? 'http' : 'https' }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      ...(mediaBucketHost ? [mediaBucketHost] : []),
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
