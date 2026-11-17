import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#183431",
        paper: "#f7f8f3",
        mint: "#dcebe1",
        lime: "#d7f078",
      },
    },
  },
  plugins: [],
};

export default config;
