import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["nodemailer"],
  async headers() {
    return [
      {
        source: '/((?!_next/static|_next/image|sounds/|badges/).*)',
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
