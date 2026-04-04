import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Segoe UI", "Tahoma", "sans-serif"],
        mono: ["IBM Plex Mono", "Consolas", "monospace"],
      },
      colors: {
        medical: {
          50: "#f0f7f7",
          100: "#e0f0f0",
          200: "#b3d9d9",
          300: "#80c2c2",
          400: "#4daaaa",
          500: "#008080",
          600: "#006666",
          700: "#004d4d",
          800: "#003333",
          900: "#001a1a",
        },
        accent: {
          500: "#008080",
          600: "#006666",
          700: "#004d4d",
        },
      },
      boxShadow: {
        panel: "0 8px 24px rgba(17, 40, 74, 0.08)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 420ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
