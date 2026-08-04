import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL("https://kingmun.org/_next/image?url=https://files.munnorthwest.org/image/kingmun/9b852e368aceaf885c8e672aa83c8a2ac7ef2500a81335c7356c6732d175beda/whiteSmallLogo.png&w=3840&q=75"),
      new URL("https://kingmun.org/_next/image?url=https://files.munnorthwest.org/image/kingmun/aded82f1ddfea876b3f348e95933b96fd2088183041b995520724d6cf199e23c/king_home_media_2026%20(1).jpg&w=3840&q=75"),
      {
        protocol: 'https',
        hostname: "files.munnorthwest.org"
      },
      {
        protocol: 'https',
        hostname: "kingmun.org"
      },
    ],
  }
};

export default nextConfig;