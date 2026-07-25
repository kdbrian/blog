import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

// This is a *project* Pages site living under the kdbrian.github.io *user*
// site, served at kdbrian.github.io/blog — base must match the repo name.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon-32.png", "apple-touch-icon.png"],
      manifest: {
        name: "Brian Kidiga — Blog",
        short_name: "Brian Kidiga",
        description: "Writing, milestones, and project history from Brian Kidiga.",
        start_url: "/blog/",
        scope: "/blog/",
        display: "standalone",
        background_color: "#FAFAF9",
        theme_color: "#1C1917",
        icons: [
          { src: "/blog/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/blog/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/blog/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallbackDenylist: [/^\/blog\/404\.html$/],
      },
    }),
  ],
  base: "/blog/",
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
