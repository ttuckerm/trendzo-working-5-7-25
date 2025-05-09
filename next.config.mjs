/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "placekitten.com",
      },
      {
        protocol: "https",
        hostname: "replicate.com",
      },
      {
        protocol: "https",
        hostname: "replicate.delivery",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    optimizeServerReact: true
  },
  async redirects() {
    return [
      // Ensure all trend prediction routes are properly handled
      {
        source: '/trend-predictions',
        destination: '/dashboard-view/trend-predictions-dashboard',
        permanent: true,
      },
      {
        source: '/trend-predictions/:path*',
        destination: '/dashboard-view/trend-predictions-dashboard/:path*',
        permanent: true,
      },
      {
        source: '/(dashboard)/trend-predictions-dashboard',
        destination: '/dashboard-view/trend-predictions-dashboard',
        permanent: true,
      },
      {
        source: '/(dashboard)/trend-predictions-dashboard/:path*',
        destination: '/dashboard-view/trend-predictions-dashboard/:path*',
        permanent: true,
      }
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://api.openai.com/:path*",
      },
    ];
  },
};

export default nextConfig;
