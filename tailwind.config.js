/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // La Fenêtre — a salle de projection. Near-black, projector warmth, brass slate.
        screen: {
          DEFAULT: "#0a0a0c", // the dark room
          deep: "#060608",
          panel: "#121216",
          line: "#1e1e25",
        },
        bone: {
          DEFAULT: "#ece4d6", // warm off-white — the projected text
          dim: "#b7af9f",
          faint: "#7c7568",
        },
        // the single warm accent — projector lamp / brass
        brass: {
          DEFAULT: "#c8a25a",
          bright: "#e6c479",
          deep: "#9a7838",
        },
        glow: "#e8b86a",
      },
      fontFamily: {
        slate: ['"Fraunces"', "Georgia", "serif"],
        title: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      letterSpacing: {
        slate: "0.42em",
        wide2: "0.22em",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.55" },
          "50%": { transform: "scale(1.32)", opacity: "1" },
        },
        flicker: {
          "0%, 100%": { opacity: "0.92" },
          "48%": { opacity: "1" },
          "50%": { opacity: "0.86" },
          "52%": { opacity: "1" },
        },
        slowZoom: {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.07)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.9s ease-out both",
        fadeIn: "fadeIn 1.2s ease-out both",
        breathe: "breathe var(--breath, 8s) ease-in-out infinite",
        flicker: "flicker 6s ease-in-out infinite",
        slowZoom: "slowZoom 180s ease-out both",
      },
    },
  },
  plugins: [],
};
