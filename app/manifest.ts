import type { MetadataRoute } from "next";
import { copy } from "@/content/copy";

/**
 * Makes the site installable as an app ("Install app" in Chrome on Android, "Add to
 * Home Screen" on iPhone). It opens full screen, without the browser bar. The same
 * manifest is what a Play Store wrapper (Trusted Web Activity) reads later.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Authority",
    short_name: "Authority",
    description: copy.meta.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fcfbf0",
    theme_color: "#fcfbf0",
    categories: ["lifestyle", "news", "social"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // The star sits well inside the safe zone, so Android can crop to any shape.
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "My field", url: "/dashboard" },
      { name: "Articles", url: "/articles" },
      { name: "Register your interest", url: "/#inquire" },
    ],
  };
}
