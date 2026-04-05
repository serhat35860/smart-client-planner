import type { MetadataRoute } from "next";

/** PWA: mobil ve masaüstü tarayıcıda “Uygulama yükle” / Ana ekrana ekle */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Smart Planner",
    short_name: "Smart Planner",
    description: "Yapışkan not mantığında müşteri etkileşim planlayıcısı ve mini CRM.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "browser"],
    orientation: "any",
    background_color: "#f7f7f5",
    theme_color: "#0f172a",
    categories: ["business", "productivity"],
    lang: "tr",
    dir: "ltr",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      }
    ]
  };
}
