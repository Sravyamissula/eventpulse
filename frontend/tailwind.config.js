/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080c14",
        surface: "#0e1524",
        "surface-card": "#131b2e",
        "surface-border": "#1e293b",
        primary: {
          DEFAULT: "#38bdf8",
          hover: "#0284c7",
          glow: "rgba(56, 189, 248, 0.15)",
        },
        accent: {
          cyan: "#06b6d4",
          violet: "#a855f7",
          emerald: "#10b981",
          amber: "#f59e0b",
          rose: "#ef4444",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(56, 189, 248, 0.3)",
        "glow-purple": "0 0 25px -5px rgba(168, 85, 247, 0.3)",
        "glow-emerald": "0 0 25px -5px rgba(16, 185, 129, 0.3)",
        "glow-rose": "0 0 25px -5px rgba(239, 68, 68, 0.3)",
      },
    },
  },
  plugins: [],
};
