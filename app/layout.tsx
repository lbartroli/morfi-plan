import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { Navigation } from '@/components/Navigation';
import { TooltipProvider } from '@/components/ui/tooltip';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Morfi-Plan - Planificación Semanal de Comidas',
  description: 'Planifica tus comidas semanales, gestiona menús y recibe listas de compras',
  keywords: ['comidas', 'planificación', 'menú semanal', 'lista de compras'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#16a34a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen`}
      >
        <Navigation />
        <TooltipProvider>
          <main className="pt-16 pb-20 md:pb-8">{children}</main>
        </TooltipProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
