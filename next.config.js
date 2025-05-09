/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['placehold.co'],
  },
  webpack: (config, { isServer }) => {
    // Enhanced error logging for module resolution
    config.infrastructureLogging = {
      level: 'error',
    };
    
    // Add source maps for better debugging
    if (!isServer) {
    }
    
    return config;
  },
};

module.exports = nextConfig; 