import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "app-remote-1",
      filename: "remoteEntry.js",
      exposes: {
        "./App": "./src/App",
      },
      shared: ["react", "react-dom"],
    }),
  ],
  server: {
    port: 5175,
  },
  base: "http://localhost:5175/",
  preview: {
    port: 5175,
  },
});
