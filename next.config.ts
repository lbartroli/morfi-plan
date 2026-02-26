import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Configuración para exportación estática (opcional, para hosting estático)
  // output: 'export',
  // distDir: 'dist',

  // Configuración de imágenes
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Configuración de trailing slash para rutas limpias
  trailingSlash: true,
};

export default nextConfig;
