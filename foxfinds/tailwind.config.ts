import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#211E1A", soft: "#3B372F", muted: "#6B6459" },
        paper: { DEFAULT: "#FAF7F2", raised: "#FFFFFF", sunk: "#F1ECE3" },
        line: { DEFAULT: "#EBE4D8", strong: "#DCD3C3" },
        fox: { DEFAULT: "#E8A33D", deep: "#C77C1E", tint: "#FBF0DC" },
        ember: { DEFAULT: "#C2410C", tint: "#FBE7DC" },
        moss: { DEFAULT: "#3F7A34", tint: "#EAF3DE" },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: { xl2: "1.125rem" },
      boxShadow: {
        card: "0 1px 2px rgba(33,30,26,0.04), 0 8px 24px -12px rgba(33,30,26,0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
