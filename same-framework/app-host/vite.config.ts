import { federation } from "@module-federation/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "app-host",
      remotes: {
        app_remote_1: {
          type: "module",
          name: "app_remote_1",
          entry: "http://localhost:6002/remoteEntry.js",
        },
        app_remote_2: {
          type: "module",
          name: "app_remote_2",
          entry: "http://localhost:6003/remoteEntry.js",
        },
      },
      shared: ["react", "react-dom"],
    }),
  ],
  server: {
    port: 5173,
  },
  preview: {
    port: 5173,
  },
});
