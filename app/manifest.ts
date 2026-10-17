import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "استبيان معرض قرارة",
    short_name: "قرارة",
    description: "استبيان زوار شركة قرارة للرخام والجرانيت",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f3e8",
    theme_color: "#171613",
    lang: "ar",
    dir: "rtl",
    icons: [
      {
        src: "/carrara-pwa-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/carrara-pwa-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
