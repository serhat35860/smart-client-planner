import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/pages/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      boxShadow: {
        "card-lift":
          "0 1px 0 0 rgba(15, 23, 42, 0.045), 0 5px 14px -4px rgba(15, 23, 42, 0.06)",
        "card-lift-dark":
          "0 2px 0 0 rgba(0, 0, 0, 0.1), 0 7px 16px -5px rgba(15, 23, 42, 0.22)"
      },
      colors: {
        board: "#f7f7f5",
        noteYellow: "#fff9c4",
        noteBlue: "#dbeafe",
        noteGreen: "#dcfce7"
      }
    }
  },
  plugins: []
};

export default config;
