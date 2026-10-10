import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: "#002F64",
        "navy-dark": "#001F42",
        paper: "#ECF0F7",
        gold: "#FF8C42",
        "gold-light": "#FFE3CC",
        green: { status: "#3F7A5A", bg: "#E4EFE7" },
        amber: { status: "#B4741A", bg: "#FDECD4" },
        blue: { status: "#466CB4", bg: "#DDE7F4" },
      },
      fontFamily: {
        display: ["'Playfair Display'", "serif"],
        ui: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
