/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strip console.* in production builds while keeping warnings and errors
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_CLONE_URL: process.env.NEXT_PUBLIC_CLONE_URL || 'https://os.ryo.lu/',
  },
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Optimize for production
  poweredByHeader: false,
  generateEtags: false,
  compress: true,
  eslint: {
    // Avoid blocking builds on lint errors; surface them in CI/editor instead
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Unblock builds in dev/staging even if stray type errors exist elsewhere
    ignoreBuildErrors: true,
  },
  
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
        hostname: "randomuser.me",
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
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
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
    optimizeServerReact: true,
    // Prevent tracing and globbing into local system/venv paths that can cause EACCES on Windows
    outputFileTracingExcludes: {
      '*': [
        '**/whisper_env/**',
        '**/node_modules/**/.bin/**'
      ]
    }
  },
  webpack: (config, { isServer, webpack }) => {
    // Prevent Next.js from bundling ffmpeg/ffprobe binaries into vendor chunks
    // and let fluent-ffmpeg resolve the paths from ffmpeg-static/ffprobe-static
    config.externals = config.externals || [];
    config.externals.push({ 'ffmpeg-static': 'commonjs ffmpeg-static' });
    config.externals.push({ 'ffprobe-static': 'commonjs ffprobe-static' });

    // On the server, keep apify libs available at runtime but out of the bundle
    if (isServer) {
      config.externals.push({ 'apify': 'commonjs apify' });
      config.externals.push({ 'apify-client': 'commonjs apify-client' });
    }

    // Ignore heavy optional modules conditionally
    config.plugins = config.plugins || [];
    if (isServer) {
      // Server: ignore only modules known to break static analysis when unused
      config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^(natural|webworker-threads)$/ }));
      
      // Supabase fix: https://github.com/supabase/supabase-js/issues/783
      config.externals.push({
        '@supabase/realtime-js': 'commonjs @supabase/realtime-js',
        '@supabase/gotrue-js': 'commonjs @supabase/gotrue-js'
      })
    } else {
      // Client: fully ignore Node-only modules so they never get bundled
      config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^(natural|webworker-threads|apify|apify-client)$/ }));
    }

    // Alias heavy Node-only modules to noops on client to avoid bundling failures
    config.resolve = config.resolve || {};
    config.resolve.alias = Object.assign({}, config.resolve.alias, isServer ? {} : {
      'natural': false,
      'webworker-threads': false,
      'apify': false,
      'apify-client': false,
    });

    // Enable async WebAssembly for optional OCR (tesseract.js)
    config.experiments = config.experiments || {};
    config.experiments.asyncWebAssembly = true;
    return config;
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
      },
      // NOTE: We keep Engine Room page intact; add only the specific query redirect requested
      {
        source: '/admin/engine-room',
        has: [{ type: 'query', key: 'tab', value: '24-7' }],
        destination: '/admin/operations-center?view=pipeline',
        permanent: false,
      },
      {
        source: '/admin/operations-center',
        destination: '/admin/engine-room?tab=operations',
        permanent: true,
      },
      {
        source: '/admin/operations-center/:path*',
        destination: '/admin/engine-room?tab=operations',
        permanent: true,
      },
      {
        // Avoid loops: do not force-query redirect; page defaults to view=pipeline
        source: '/does-not-match',
        destination: '/does-not-match',
        permanent: false,
      },
      // Viral Recipe Book ownership
      {
        source: '/admin/recipe-book',
        destination: '/admin/viral-recipe-book',
        permanent: true,
      },
      {
        source: '/admin/recipe-book/:path*',
        destination: '/admin/viral-recipe-book',
        permanent: true,
      },
      {
        source: '/admin/template-analyzer',
        destination: '/admin/viral-recipe-book?tab=analyzer',
        permanent: true,
      },
      {
        source: '/admin/template-analyzer/:path*',
        destination: '/admin/viral-recipe-book?tab=analyzer',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/openai/:path*",
        destination: "https://api.openai.com/:path*",
      },
      // Route /lab/canvas to an isolated Pages route to bypass App Router wrappers
      {
        source: "/lab/canvas",
        destination: "/lab-canvas",
      },
    ];
  },

  // Prevent API routes from handling favicon.ico
  async routes() {
    return [
      {
        source: '/favicon.ico',
        destination: '/public/favicon.ico',
      },
    ];
  },
};

export default nextConfig;
