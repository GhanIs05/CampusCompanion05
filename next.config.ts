import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Temporarily disable static export to support dynamic routes
  // output: 'export',
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  
  // Optimize images for static export
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Enable experimental features for better performance and prerendering
  experimental: {
    // Enable optimized loading
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    // Disable CSS optimization that requires critters
    // optimizeCss: true,
  },
  
  // Optimize webpack bundle
  webpack: (config, { isServer, dev }) => {
    // Reduce bundle size by excluding unused modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Add bundle analyzer in analyze mode
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: `${isServer ? 'server' : 'client'}.html`,
        })
      );
    }
    
    // Optimize for production
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
