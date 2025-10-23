/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#6366F1",
        primaryDark: "#4F46E5",
        primaryLight: "#818CF8",
        secondary: "#EC4899",
        secondaryDark: "#DB2777",
        accent: "#10B981",
        background: "#FFFFFF",
        backgroundDark: "#F9FAFB",
        text: "#111827",
        textMuted: "#6B7280",
        darkBg: "#1F2937",
        darkCard: "#374151",
        darkText: "#F9FAFB",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
