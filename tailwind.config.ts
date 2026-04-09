import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/pages/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      /**
       * Tipografi ölçeği: okunabilirlik için line-height hafif gevşetildi; h3 kart başlıkları bir kademe büyütüldü.
       */
      fontSize: {
        h1: ["1.5rem", { lineHeight: "1.25", letterSpacing: "-0.022em" }],
        h2: ["1.25rem", { lineHeight: "1.28", letterSpacing: "-0.02em" }],
        h3: ["1.1875rem", { lineHeight: "1.35", letterSpacing: "-0.016em" }],
        "body-lg": ["1rem", { lineHeight: "1.55", letterSpacing: "-0.007em" }],
        body: ["0.875rem", { lineHeight: "1.55", letterSpacing: "-0.003em" }],
        "body-sm": ["0.8125rem", { lineHeight: "1.5", letterSpacing: "0" }],
        label: ["0.8125rem", { lineHeight: "1.4", letterSpacing: "0.01em" }],
        caption: ["0.75rem", { lineHeight: "1.42", letterSpacing: "0.01em" }],
        button: ["0.875rem", { lineHeight: "1.3", letterSpacing: "-0.004em" }]
      },
      backgroundColor: {
        "theme-subtle": "color-mix(in srgb, var(--color-text) 5%, var(--color-bg))",
        "theme-subtle-hover": "color-mix(in srgb, var(--color-text) 9%, var(--color-bg))",
        "theme-danger-soft": "color-mix(in srgb, var(--color-error) 14%, var(--color-card))",
        "theme-success-soft": "color-mix(in srgb, var(--color-success) 14%, var(--color-card))",
        "theme-warning-soft": "color-mix(in srgb, var(--color-warning) 18%, var(--color-card))"
      },
      boxShadow: {
        "card-lift":
          "0 1px 2px color-mix(in srgb, var(--color-text) 8%, transparent), 0 6px 16px -8px color-mix(in srgb, var(--color-text) 12%, transparent)",
        "card-lift-dark":
          "0 2px 0 0 color-mix(in srgb, var(--color-text) 12%, transparent), 0 7px 16px -5px color-mix(in srgb, var(--color-text) 18%, transparent)",
        "nav-bar-lift":
          "0 -4px 20px color-mix(in srgb, var(--color-text) 6%, transparent)"
      },
      ringColor: {
        "theme-border": "var(--color-border)",
        "theme-primary": "var(--color-primary)",
        "theme-on-primary": "var(--color-on-primary)"
      },
      colors: {
        /** Not kartı yüzey renkleri (içerik vurgusu; tema dışı) */
        board: "#f7f7f5",
        noteYellow: "#fff9c4",
        noteBlue: "#dbeafe",
        noteGreen: "#dcfce7",
        /** Semantik tema — yalnızca CSS değişkenleri */
        theme: {
          bg: "var(--color-bg)",
          card: "var(--color-card)",
          primary: "var(--color-primary)",
          "primary-hover": "var(--color-primary-hover)",
          text: "var(--color-text)",
          /** İkincil metin: arka plana hafif karıştırılarak daha silik */
          muted: "color-mix(in srgb, var(--color-text-secondary) 72%, var(--color-bg))",
          border: "var(--color-border)",
          success: "var(--color-success)",
          warning: "var(--color-warning)",
          error: "var(--color-error)",
          "on-primary": "var(--color-on-primary)"
        }
      }
    }
  },
  plugins: []
};

export default config;
