import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1450px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        'bg-1': 'var(--bg-1)',
        'bg-2': 'var(--bg-2)',
        'bg-3': 'var(--bg-3)',
        'bg-4': 'var(--bg-4)',
        'gray-1': 'var(--gray-1)',
        'gray-2': 'var(--gray-2)',
        'gray-3': 'var(--gray-3)',
        // Cores DOMUX DESIGN
        'domux-burgundy': 'var(--domux-burgundy)',
        'domux-burgundy-dark': 'var(--domux-burgundy-dark)',
        'domux-burgundy-light': 'var(--domux-burgundy-light)',
        'domux-gold': 'var(--domux-gold)',
        'domux-gold-dark': 'var(--domux-gold-dark)',
        'domux-gold-light': 'var(--domux-gold-light)',
        'domux-beige': 'var(--domux-beige)',
        'domux-beige-dark': 'var(--domux-beige-dark)',
        'domux-brown': 'var(--domux-brown)',
        'domux-brown-light': 'var(--domux-brown-light)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      spacing: {
        '15': 'var(--spacing-15)',
        '25': 'var(--spacing-25)',
      },
      fontSize: {
        'display': ['clamp(2.25rem, 1.3269rem + 4.1026vw, 6.25rem)', { lineHeight: '115%', fontWeight: '300' }],
        'h1': ['clamp(1.5rem, 1.2692rem + 1.0256vw, 2.5rem)', { lineHeight: '125%', fontWeight: '300' }],
      },
    },
  },
  plugins: [],
} satisfies Config;




