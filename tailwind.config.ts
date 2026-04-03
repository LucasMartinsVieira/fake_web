import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/state/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        chrome: {
          950: "#0b1020",
          900: "#131a2b",
          800: "#1b2438",
          700: "#26324d",
          500: "#7f8db0",
          300: "#c7d1e3",
        },
        discord: {
          bg: "#313338",
          surface: "#2b2d31",
          panel: "#1e1f22",
          muted: "#949ba4",
          text: "#dbdee1",
          accent: "#5865f2",
        },
      },
      boxShadow: {
        panel: "0 24px 80px rgba(0, 0, 0, 0.35)",
      },
      fontFamily: {
        sans: ["gg sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
