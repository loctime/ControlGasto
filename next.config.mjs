/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ PRODUCCIÓN: Remover configuraciones de desarrollo
  // eslint: { ignoreDuringBuilds: true }, // ❌ REMOVIDO
  // typescript: { ignoreBuildErrors: true }, // ❌ REMOVIDO
  
  // ✅ OPTIMIZADO: Configuración de imágenes
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // ✅ OPTIMIZADO: Compresión y performance
  compress: true,
  poweredByHeader: false,
  
  // ✅ OPTIMIZADO: Optimizaciones avanzadas
  experimental: {
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-icons',
      'recharts',
      'date-fns'
    ],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    // optimizeCss: true, // ❌ DESHABILITADO - Causa errores de prerenderizado
    scrollRestoration: true,
  },
  // Configuración para PWA
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  // Configuración de rewrites para SPA
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },
}

export default nextConfig
