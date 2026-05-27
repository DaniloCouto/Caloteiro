import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  base: "/Caloteiro/",
  plugins: [
    tsconfigPaths(),
    tanstackStart({
      // This tells the native bundler to output purely static files 
      prerender: {
        enabled: true
      }
    }),
    viteReact(),
  ]
});