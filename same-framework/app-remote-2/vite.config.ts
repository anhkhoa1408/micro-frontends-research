import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "app_remote_2",
      filename: "remoteEntry.js",
      exposes: {
        "./App2": "./src/App.tsx",
      },
      shared: ["react", "react-dom"],
    }),
  ],
  server: {
    port: 6003,
    origin: "http://localhost:6003",
  },
  base: "http://localhost:6003/",
  preview: {
    port: 6003,
  },
});
