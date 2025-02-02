/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        solana: {
          purple: "#9945FF",
          green: "#14F195"
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'neon-pulse': 'neonPulse 2s ease-in-out infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        glow: {
          '0%': {
            filter: 'drop-shadow(0 0 2px #9945FF) drop-shadow(0 0 4px #9945FF)',
          },
          '100%': {
            filter: 'drop-shadow(0 0 10px #14F195) drop-shadow(0 0 20px #14F195)',
          }
        },
        neonPulse: {
          '0%, 100%': {
            textShadow: '0 0 4px #9945FF, 0 0 11px #9945FF, 0 0 19px #9945FF',
          },
          '50%': {
            textShadow: '0 0 4px #14F195, 0 0 11px #14F195, 0 0 19px #14F195',
          }
        }
      }
    },
  },
  plugins: [],
};
