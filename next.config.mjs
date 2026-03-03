/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@sparticuz/chromium'],
  },
  webpack: (config) => {
    // Critical for @sparticuz/chromium to work
    config.externals = [...(config.externals || []), '@sparticuz/chromium'];
    
    // Disable file system caching to ensure fresh builds
    config.cache = false;
    
    return config;
  },
};

export default nextConfig;
