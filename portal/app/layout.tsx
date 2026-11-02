import './globals.css';
import type { Metadata, Viewport } from 'next';
import React from 'react';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ToastProvider } from '@/components/ui/ToastProvider';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
  // @ts-expect-error Next.js Google font options extension
  featureSettings: '"cv02", "cv03", "cv04", "cv11", "tnum" 1',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#081433',
};

export const metadata: Metadata = {
  title: 'ALMAR Rosario — Portal Operativo y Logístico',
  description: 'Plataforma de gestión de operaciones freight forwarding, trazabilidad de comprobantes y control fiscal para ALMAR Rosario',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ALMAR Rosario',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/icons/icon-192.png',
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased text-slate-900 bg-slate-50 selection:bg-[#0072BC]/20">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}

