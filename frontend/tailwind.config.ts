import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["IBM Plex Sans", "Segoe UI", "Tahoma", "sans-serif"],
        mono: ["IBM Plex Mono", "Consolas", "monospace"],
      },
      colors: {
        medical: {
          50: "#f6f9fc",
          100: "#ecf2f8",
          200: "#d7e3ef",
          300: "#b2c9de",
          400: "#86a7c8",
          500: "#5e86af",
          600: "#426b95",
          700: "#32557a",
          800: "#2c4865",
          900: "#263d53",
        },
        accent: {
          500: "#0057b8",
          600: "#004a9c",
          700: "#003e82",
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
