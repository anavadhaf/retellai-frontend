/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#09090B",
        surface: "rgba(255,255,255,0.06)",
        border: "rgba(255,255,255,0.08)",
        accent: "#E4AFFF",
        accentDeep: "#720ED9",
        danger: "#EF4444",
        muted: "#A1A1AA",
      },
      boxShadow: {
        glow: "0 0 60px rgba(228, 175, 255, 0.22)",
        card: "0 30px 80px rgba(0, 0, 0, 0.35)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at top, rgba(114,14,217,0.2), transparent 32%), radial-gradient(circle at bottom right, rgba(228,175,255,0.16), transparent 26%), radial-gradient(circle at left, rgba(255,255,255,0.05), transparent 24%)",
      },
      animation: {
        drift: "drift 16s ease-in-out infinite alternate",
      },
      keyframes: {
        drift: {
          "0%": { transform: "translate3d(-2%, 0%, 0) scale(1)" },
          "100%": { transform: "translate3d(2%, -4%, 0) scale(1.06)" },
        },
      },
    },
  },
  plugins: [],
};
