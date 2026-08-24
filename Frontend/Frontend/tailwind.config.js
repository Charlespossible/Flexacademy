/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // ── Fonts ──────────────────────────────────────────────────────────────
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },

      // ── Type scale below Tailwind's `xs` ──────────────────────────────────
      // Defined in rem so they scale with the root size like every other step.
      // These replace hardcoded `text-[9px]` / `[10px]` / `[11px]`, which were
      // pinned to pixels and so stayed tiny while the rest of the UI grew.
      // At the 18px root: 3xs ≈ 10px, 2xs ≈ 12px.
      fontSize: {
        '3xs': ['0.5625rem', { lineHeight: '0.9rem' }],
        '2xs': ['0.6875rem', { lineHeight: '1.05rem' }],
      },

      // ── Colours — ALL reference CSS variables so both themes work ──────────
      colors: {
        base: {
          DEFAULT: 'var(--bg-base)',
          surface:  'var(--bg-surface)',
          elevated: 'var(--bg-elevated)',
          subtle:   'var(--bg-subtle)',
        },
        accent: {
          DEFAULT: 'var(--accent-primary)',
          hover:   'var(--accent-hover)',
          muted:   'var(--accent-muted)',
          // Note: accent/10 etc. use Tailwind's opacity modifier against this value
        },
        brand: {
          xp:      'var(--color-xp)',
          danger:  'var(--color-danger)',
          warning: 'var(--color-warning)',
          success: 'var(--color-success)',
          info:    'var(--color-info)',
        },
        text: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     'var(--text-muted)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          active: 'var(--border-active)',
        },
      },

      // ── Shadows — CSS vars switch with theme ───────────────────────────────
      boxShadow: {
        card:      'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        glow:      'var(--shadow-glow)',
        'glow-sm': 'var(--shadow-glow-sm)',
      },

      // ── Background ────────────────────────────────────────────────────────
      backgroundColor: {
        input: 'var(--input-bg)',
      },

      // ── Border colour ─────────────────────────────────────────────────────
      borderColor: {
        subtle: 'var(--border-subtle)',
        active: 'var(--border-active)',
      },

      // ── Animation ─────────────────────────────────────────────────────────
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        shimmer:      'shimmer 2s linear infinite',
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'bounce-in':  'bounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        bounceIn: {
          '0%':   { transform: 'scale(0.8)', opacity: '0' },
          '60%':  { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
      },

      // ── Backgrounds ───────────────────────────────────────────────────────
      backgroundImage: {
        'grid-pattern':     'radial-gradient(circle, rgba(110,231,183,0.04) 1px, transparent 1px)',
        'gradient-radial':  'radial-gradient(var(--tw-gradient-stops))',
      },
      backgroundSize: {
        grid: '32px 32px',
      },
    },
  },
  plugins: [],
};
