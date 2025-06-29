/** @type {import('next').NextConfig} */

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' }
];

const nextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  images: {
    // Aquí autorizamos los dominios desde los cuales se cargarán las imágenes.
    remotePatterns: [
      // https://www.winkscrubs.com
      {
        protocol: 'https',
        hostname: 'winkscrubs.com', // Dominio que causa el error.
        port: '',
        pathname: '/**', // Puedes hacerlo más o menos específico.
      },
      // https://bacomade.com
      {
        protocol: 'https',
        hostname: 'barcomade.com',
        port: '',
        pathname: '/cdn/shop/files/**',
      },
      
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      // https://via.placeholder.com
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      
      // https://images.barcodelookup.com
      {
        protocol: 'https',
        hostname: 'images.barcodelookup.com',
        port: '',
        pathname: '/**',
      },
      // Puedes añadir más dominios aquí en el futuro.
      // Ejemplo:
      // {
      //   protocol: 'https',
      //   hostname: 'otro-dominio.com',
      // },
    ],
  },
};

export default nextConfig;
