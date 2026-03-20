import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mariko Organics",
    short_name: "Mariko",
    description: "グルテンフリー料理教室 - Orange County, CA",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF6F0",
    theme_color: "#7A5F4C",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
