/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Aquí autorizamos los dominios desde los cuales se cargarán las imágenes.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'winkscrubs.com', // Dominio que causa el error.
        port: '',
        pathname: '/cdn/shop/files/**', // Puedes hacerlo más o menos específico.
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
