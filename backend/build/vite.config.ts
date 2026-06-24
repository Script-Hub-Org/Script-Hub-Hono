import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "./surge.js",
      name: "Script_Hub",
      formats: ["iife"],
      fileName: () => "Script.Hub.js",
    },
    outDir: path.resolve(import.meta.dirname, "../../assets/release/script"),
    emptyOutDir: true,
  },
});
