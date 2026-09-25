import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        black: "#0E0E0E",
        ink: "#161616",
        gold: {
          DEFAULT: "#C9A24A",
          deep: "#9A7B2F",
          light: "#E8D29A",
        },
        cream: "#F7F4EE",
        white: "#FFFFFF",
        muted: "#6B6B6B",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "10px",
        btn: "6px",
      },
      letterSpacing: {
        section: "0.3em",
        ui: "0.08em",
      },
      boxShadow: {
        soft: "0 18px 50px -24px rgba(14, 14, 14, 0.35)",
      },
      maxWidth: {
        site: "1280px",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.8s ease both",
      },
    },
  },
  plugins: [],
};

export default config;
