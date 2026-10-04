import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        clave: {
          green: '#1e3d2f',        // Verde Bosque Institucional
          'green-light': '#2c5442',  // Verde Medio
          'green-dark': '#13271e',   // Verde Oscuro Profundo
          'green-soft': '#eef4f0',   // Fondo verde soporte
          gold: '#c29320',          // Dorado Clave Consultora
          'gold-light': '#fefcf5',  // Crema Dorado para alertas
          'gold-border': '#eedaa2', // Borde dorado suave
          'gold-dark': '#9a7416',   // Dorado oscuro
          navy: '#081433',          // Azul Noche Profundo
          border: '#cbd5e1',        // Borde gris elegante
          'border-light': '#e2e8f0',// Borde suave
          muted: '#64748b',         // Gris medio formal
          'bg-light': '#f8fafc',    // Fondo blanco humo suave
          text: '#1e293b',          // Texto principal carbón
          platinum: '#f1f5f9',      // Fondo platino corporativo
        },
        semantic: {
          success: '#059669',
          danger: '#e11d48',
          warning: '#d97706',
        },
      },
      fontFamily: {
        heading: ['Montserrat', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        body: ['Open Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['Fira Code', 'Courier New', 'monospace'],
      },
      aspectRatio: {
        '16/9': '16 / 9',
      },
      boxShadow: {
        'clave-card': '0 4px 16px rgba(19, 39, 30, 0.08)',
        'clave-elevated': '0 12px 32px rgba(8, 20, 51, 0.12)',
        'clave-gold': '0 4px 14px rgba(194, 147, 32, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
