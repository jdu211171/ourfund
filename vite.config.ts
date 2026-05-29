// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

const basepath = "/ourfund";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  cloudflare: false,
  vite: {
    base: `${basepath}/`,
    plugins: [
      VitePWA({
        injectRegister: null,
        registerType: "autoUpdate",
        manifestFilename: "manifest.webmanifest",
        includeAssets: ["pwa-192.png", "pwa-512.png"],
        manifest: {
          name: "OurFund",
          short_name: "OurFund",
          description: "Family budget management",
          start_url: `${basepath}/`,
          scope: `${basepath}/`,
          display: "standalone",
          background_color: "#ffffff",
          theme_color: "#4f46e5",
          icons: [
            {
              src: "pwa-192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "pwa-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          navigateFallback: `${basepath}/index.html`,
        },
      }),
    ],
  },
  tanstackStart: {
    server: { entry: "server" },
    router: { basepath },
  },
});
