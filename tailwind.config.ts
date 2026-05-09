import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef8ff",
          100: "#d9ecff",
          600: "#0070d1",
          700: "#005aab",
          900: "#083661",
        },
      },
    },
  },
  plugins: [],
};

export default config;
