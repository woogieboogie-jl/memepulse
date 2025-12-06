/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Empty turbopack config to silence dev mode warning
  turbopack: {},
  // Webpack config for production build (web3 packages need this)
  webpack: (config) => {
    config.resolve.fallback = { 
      fs: false, 
      net: false, 
      tls: false,
      crypto: false,
    };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
  // Transpile web3 packages
  transpilePackages: [
    '@web3-onboard/core',
    '@web3-onboard/react',
    '@web3-onboard/injected-wallets',
    '@web3-onboard/walletconnect',
  ],
}

export default nextConfig
