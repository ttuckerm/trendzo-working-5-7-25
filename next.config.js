/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['placehold.co', 'startup-template-sage.vercel.app', 'randomuser.me'],
  },
  webpack: (config, { isServer }) => {
    // Enhanced error logging for module resolution
    config.infrastructureLogging = {
      level: 'error',
    };
    
    // Add source maps for better debugging
    if (!isServer) {
    }

    // Add memory configuration to handle large assets
    config.performance = {
      hints: false,
    };
    
    return config;
  },
};

module.exports = nextConfig; 