import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SM Sterling Mart",
    short_name: "SterlingMart",
    description: "Modern heirlooms, beautifully chosen.",
    start_url: "/",
    display: "standalone",
    background_color: "#2f1b10",
    theme_color: "#2f1b10",
    icons: [
      { src: "/sterling-mart-mark.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
