/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "scan": {
          '0%': { transform: 'translateY(-100%)' },
          '50%': { transform: 'translateY(100%)' },
          '50.1%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(-100%)' }
        },
        "scanline": {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '49.9%': { transform: 'translateY(calc(100vh - 3px))', opacity: '1' },
          '50%': { transform: 'translateY(calc(100vh - 3px))', opacity: '0' },
          '50.1%': { transform: 'translateY(calc(100vh - 3px))', opacity: '0' },
          '50.2%': { transform: 'translateY(calc(100vh - 3px))', opacity: '1' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        "progress": {
          '0%': { width: '0%' },
          '50%': { width: '70%' },
          '100%': { width: '100%' }
        },
        "flash": {
          '0%': { opacity: '0.3' },
          '50%': { opacity: '0.1' },
          '100%': { opacity: '0' }
        },
        "capture-border": {
          '0%': { borderColor: 'rgba(255, 255, 255, 0.8)', transform: 'scale(1)' },
          '100%': { borderColor: 'rgba(255, 255, 255, 0)', transform: 'scale(1.1)' }
        },
        "typing-dot": {
          '0%': { transform: 'translateY(0px)', opacity: '0.2' },
          '50%': { transform: 'translateY(-2px)', opacity: '0.8' },
          '100%': { transform: 'translateY(0px)', opacity: '0.2' }
        }
      },
      animation: {
        "scan": 'scan 4s linear infinite',
        "scanline": 'scanline 4s linear infinite',
        "progress": 'progress 3s ease-in-out infinite',
        "flash": 'flash 0.5s ease-out forwards',
        "capture-border": 'capture-border 0.5s ease-out forwards',
        "typing-dot": 'typing-dot 1.4s infinite ease-in-out'
      },
      extend: {
        transitionDelay: {
          '400': '400ms',
          '200': '200ms',
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}


