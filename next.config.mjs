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
  // Enable standalone output ONLY for production builds (Docker deployment).
  // In dev, standalone output adds heavy file-tracing overhead that slows compiles.
  ...(process.env.NODE_ENV === 'production' ? { output: 'standalone' } : {}),
  
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
    // TEMPORARILY disabled 2026-04-21 — src/instrumentation.ts pulls the entire
    // scheduler chain (node-cron → fluent-ffmpeg → fresh-video-scanner) into
    // webpack's bundle target, which can't resolve Node built-ins (fs, path)
    // in the instrumentation context. Dev server returns 500 on every route.
    // Auto-start convenience is lost (kick the scheduler manually via
    // /api/admin/integration/status on boot). Re-enable after the
    // instrumentation chain is refactored to use runtime require() so webpack
    // doesn't statically analyze it.
    instrumentationHook: false,
    optimizeServerReact: true,
    // jsdom ships a CSS asset (default-stylesheet.css) loaded via require.resolve;
    // webpack can't trace it, so the build fails at /api/admin/api-keys.
    // isomorphic-dompurify depends on jsdom — keep them together.
    serverComponentsExternalPackages: ['jsdom', 'isomorphic-dompurify'],
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'd3',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-slider',
      '@radix-ui/react-switch',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-radio-group',
      'date-fns',
      'chart.js',
      'react-chartjs-2',
    ],
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

    // On the server, keep heavy/optional libs available at runtime but out of the bundle
    if (isServer) {
      config.externals.push({ 'apify': 'commonjs apify' });
      config.externals.push({ 'apify-client': 'commonjs apify-client' });
      config.externals.push({ 'ioredis': 'commonjs ioredis' });
      config.externals.push({ 'pg': 'commonjs pg' });
      // fluent-ffmpeg requires Node's 'fs' which webpack can't resolve when bundling
      // the instrumentation hook chain (scheduler → fresh-video-scanner → kai-orchestrator
      // → audio-analyzer). Load at runtime instead.
      config.externals.push({ 'fluent-ffmpeg': 'commonjs fluent-ffmpeg' });
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
      // Stop /favicon.ico from triggering a 500 + full _error page recompile in dev.
      // Browsers auto-request /favicon.ico; we redirect to the SVG we actually ship.
      {
        source: '/favicon.ico',
        destination: '/favicon.svg',
        permanent: false,
      },
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

};

export default nextConfig;
