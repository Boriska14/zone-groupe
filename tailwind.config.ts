import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#03045F",
        cyan: { DEFAULT: "#00B6DA", dark: "#0098b8" },
        rose: "#FFCAD4",
        slate: { DEFAULT: "#8D9AAE" },
        mist: "#EAEAEA",
      },
      boxShadow: { card: "0 6px 24px -8px rgba(3,4,95,.18)" },
    },
  },
  plugins: [],
};
export default config;
