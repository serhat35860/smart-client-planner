import { Inter } from "next/font/google";

/** Tek aile: tüm UI. Ölçek `tailwind.config.ts` + `globals.css` ile hizalı. */
export const fontSans = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"]
});
