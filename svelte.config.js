import preprocess from "svelte-preprocess";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";


export default {
  preprocess: [
    vitePreprocess(),
    preprocess({
      typescript: true,
    }),
  ],
};