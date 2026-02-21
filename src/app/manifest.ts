import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Krutim - Multi-Model AI Chat",
    short_name: "Krutim",
    description:
      "Chat with multiple AI models, compare responses, and monitor model availability in real time.",
    start_url: "/chat",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#171717",
    orientation: "portrait-primary",
    categories: ["productivity", "utilities"],
    icons: [
      {
        src: "/pwa-icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon-maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
