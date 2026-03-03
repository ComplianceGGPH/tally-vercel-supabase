/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@sparticuz/chromium-min'],
  },
  webpack: (config) => {
    // Critical for @sparticuz/chromium-min to work
    config.externals = [...(config.externals || []), '@sparticuz/chromium-min'];
    
    // Disable file system caching to ensure fresh builds
    config.cache = false;
    
    return config;
  },
};

export default nextConfig;
