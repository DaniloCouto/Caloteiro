import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  base: "/Caloteiro/",
  plugins: [
    tsconfigPaths(),
    tanstackStart({
      app: {
        router: {
          base: "/Caloteiro/"
        }
      },
      prerender: {
        enabled: true
      }
    }),
    viteReact(),
  ]
});