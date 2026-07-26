import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface1: "var(--surface-1)",
        surface2: "var(--surface-2)",
        border: "var(--border)",
        borderStrong: "var(--border-strong)",
        textPrimary: "var(--text-primary)",
        textSecondary: "var(--text-secondary)",
        textMuted: "var(--text-muted)",
        greenDeep: "var(--green-deep)",
        greenMid: "var(--green-mid)",
        greenBright: "var(--green-bright)",
        amber: "var(--amber)",
        danger: "var(--danger)",
      },
      borderRadius: {
        md: "8px",
        lg: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
