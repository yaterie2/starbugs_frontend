import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      // Adjust the path if necessary
      "@three": "three/examples/jsm",
    },
  },
});
