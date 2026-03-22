import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./popup.html", "./inspector.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101828",
        slate: "#475467",
        line: "#d0d5dd",
        panel: "#ffffff",
        accent: "#0f766e",
        accentSoft: "#ccfbf1"
      },
      boxShadow: {
        card: "0 18px 40px -24px rgba(16, 24, 40, 0.35)"
      },
      fontFamily: {
        sans: ["Segoe UI", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
