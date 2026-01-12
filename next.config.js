/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeORM'i bundling'den dışarıda bırak (Next.js 13)
  experimental: {
    instrumentationHook: true, // instrumentation.ts için gerekli (Next.js 13.2+)
    serverComponentsExternalPackages: ['typeorm', 'pg', 'reflect-metadata'],
  },
  
  webpack: (config, { isServer }) => {
    // i18next için webpack config
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    // TypeORM için server-side optimizasyonlar
    if (isServer) {
      // TypeORM'in bazı optional dependencies'lerini ignore et
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push({
          '@sap/hana-client': 'commonjs @sap/hana-client',
          'mysql': 'commonjs mysql',
          'mysql2': 'commonjs mysql2',
          'react-native-sqlite-storage': 'commonjs react-native-sqlite-storage',
          'better-sqlite3': 'commonjs better-sqlite3',
          'oracledb': 'commonjs oracledb',
          'sql.js': 'commonjs sql.js',
          'ioredis': 'commonjs ioredis',
          'redis': 'commonjs redis',
        });
      }
    }
    
    return config;
  },
};

module.exports = nextConfig;
