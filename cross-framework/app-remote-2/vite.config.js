import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import { federation } from "@module-federation/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    federation({
      name: "app-remote-2",
      filename: "remoteEntry.js",
      exposes: {
        "./VueApp": "./src/components/App.vue",
      },
      shared: ["vue"],
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5174,
  },
  base: "http://localhost:5174/",
  preview: {
    port: 5174,
  },
});
