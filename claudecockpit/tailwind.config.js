/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cyberpunk palette - deep space blacks with neon accents
        'void': '#0a0a0f',
        'deep': '#12121a',
        'surface': '#1a1a24',
        'border': '#2a2a3a',
        'muted': '#4a4a5a',
        'text': '#e0e0e0',
        // Neon accent colors
        'neon-cyan': '#00ffcc',
        'neon-magenta': '#ff00aa',
        'neon-yellow': '#ffcc00',
        'neon-red': '#ff3366',
        'neon-blue': '#00aaff',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        'display': ['Orbitron', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 10px #00ffcc, 0 0 20px #00ffcc33',
        'neon-magenta': '0 0 10px #ff00aa, 0 0 20px #ff00aa33',
        'neon-yellow': '0 0 10px #ffcc00, 0 0 20px #ffcc0033',
        'glow-sm': '0 0 5px currentColor',
        'glow-md': '0 0 10px currentColor, 0 0 20px currentColor',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scan': 'scan 8s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #00ffcc, 0 0 10px #00ffcc33' },
          '100%': { boxShadow: '0 0 15px #00ffcc, 0 0 30px #00ffcc55' },
        },
        scan: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '0% 100%' },
        },
      },
      backgroundImage: {
        'grid-pattern': `
          linear-gradient(rgba(0, 255, 204, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 204, 0.03) 1px, transparent 1px)
        `,
        'scanline': 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 204, 0.03) 2px, rgba(0, 255, 204, 0.03) 4px)',
      },
      backgroundSize: {
        'grid': '20px 20px',
      },
    },
  },
  plugins: [],
};
