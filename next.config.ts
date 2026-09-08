import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["nodemailer"],
  async headers() {
    return [
      {
        // Excludes static, rarely-changing assets — icons and the PWA
        // manifest included. "no-store" on those breaks iOS's ability to
        // persist an Add to Home Screen icon: it needs to cache the icon
        // to keep it, and a no-store response can't be kept, so it silently
        // falls back to a plain letter tile.
        source:
          '/((?!_next/static|_next/image|sounds/|badges/|belts/|icon\\.svg|icon-192\\.png|icon-512\\.png|apple-touch-icon\\.png|apple-icon\\.png|favicon-32\\.png|manifest\\.json).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
