import type { Config } from "tailwindcss";

/**
 * Design tokens are transcribed verbatim from the Stitch design system export
 * so the React build renders identically to the approved screens.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        outline: "#71787d",
        "surface-container-lowest": "#ffffff",
        "on-secondary-fixed-variant": "#574500",
        error: "#ba1a1a",
        "on-surface-variant": "#40484c",
        "primary-fixed": "#bfe8ff",
        "tertiary-container": "#663924",
        surface: "#f8f9ff",
        "primary-fixed-dim": "#96ceeb",
        "on-primary-container": "#83bad6",
        "status-failed": "#ef4444",
        "surface-dim": "#cbdbf5",
        "surface-container-low": "#eff4ff",
        background: "#f8f9ff",
        "status-passed": "#10b981",
        "on-tertiary-container": "#e3a489",
        "on-secondary-fixed": "#241a00",
        tertiary: "#4b2310",
        "surface-container-highest": "#d3e4fe",
        "secondary-fixed": "#ffe088",
        "surface-container-high": "#dce9ff",
        "inverse-surface": "#213145",
        "outline-variant": "#c0c7cd",
        "primary-container": "#004b63",
        "tertiary-fixed-dim": "#fab79b",
        "on-tertiary-fixed": "#341102",
        "inverse-on-surface": "#eaf1ff",
        "surface-container": "#e5eeff",
        secondary: "#735c00",
        "surface-tint": "#2a657e",
        "on-secondary": "#ffffff",
        "surface-subtle": "#f8fafc",
        "surface-bright": "#f8f9ff",
        "on-primary": "#ffffff",
        "on-error": "#ffffff",
        "inverse-primary": "#96ceeb",
        "tertiary-fixed": "#ffdbcd",
        "flag-fraud": "#991b1b",
        "secondary-container": "#fed65b",
        "on-tertiary-fixed-variant": "#693b26",
        "flag-clean": "#065f46",
        "error-container": "#ffdad6",
        "on-background": "#0b1c30",
        "on-tertiary": "#ffffff",
        "on-primary-fixed-variant": "#044d65",
        "on-surface": "#0b1c30",
        "secondary-fixed-dim": "#e9c349",
        "surface-variant": "#d3e4fe",
        "status-review": "#f59e0b",
        "on-error-container": "#93000a",
        "on-secondary-container": "#745c00",
        "on-primary-fixed": "#001f2b",
        primary: "#003345",
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        // Larger radii for the marketing surface, where softer corners read as
        // current. Product screens stay on `xl` so they keep their denser feel.
        "2xl": "0.75rem",
        "3xl": "1rem",
        "4xl": "1.5rem",
        // Stitch exported this as 0.75rem, which turned every `rounded-full`
        // badge into a rounded rectangle and every avatar into a squircle.
        full: "9999px",
      },
      boxShadow: {
        soft: "0 1px 2px rgb(11 28 48 / 0.04), 0 1px 3px rgb(11 28 48 / 0.06)",
        card: "0 2px 4px rgb(11 28 48 / 0.04), 0 12px 24px -12px rgb(11 28 48 / 0.12)",
        lifted: "0 4px 8px rgb(11 28 48 / 0.06), 0 24px 48px -20px rgb(11 28 48 / 0.24)",
        "inner-line": "inset 0 1px 0 0 rgb(255 255 255 / 0.08)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
      spacing: {
        "stack-sm": "8px",
        "stack-lg": "32px",
        "margin-mobile": "16px",
        gutter: "24px",
        "container-max": "1280px",
        base: "4px",
        "stack-md": "16px",
      },
      maxWidth: {
        "container-max": "1280px",
      },
      fontFamily: {
        "title-sm": ["Inter", "sans-serif"],
        "body-sm": ["Inter", "sans-serif"],
        "label-caps": ["JetBrains Mono", "monospace"],
        "headline-md": ["Hanken Grotesk", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "status-badge": ["Inter", "sans-serif"],
        "display-lg-mobile": ["Hanken Grotesk", "sans-serif"],
        "display-lg": ["Hanken Grotesk", "sans-serif"],
        "display-xl": ["Hanken Grotesk", "sans-serif"],
        "headline-lg": ["Hanken Grotesk", "sans-serif"],
      },
      fontSize: {
        "title-sm": ["18px", { lineHeight: "24px", fontWeight: "600" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "label-caps": [
          "12px",
          { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" },
        ],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "26px", fontWeight: "400" }],
        "status-badge": ["12px", { lineHeight: "12px", fontWeight: "700" }],
        "display-lg-mobile": [
          "32px",
          { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        "display-lg": [
          "40px",
          { lineHeight: "48px", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        // Added for the marketing hero, where 40px reads undersized on desktop.
        "display-xl": [
          "56px",
          { lineHeight: "60px", letterSpacing: "-0.03em", fontWeight: "700" },
        ],
        "headline-lg": [
          "32px",
          { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "600" },
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
