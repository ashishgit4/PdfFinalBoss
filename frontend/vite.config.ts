  import path from "path"
  import tailwindcss from "@tailwindcss/vite"
  import react from "@vitejs/plugin-react"
  import { defineConfig } from "vite"

  // https://vite.dev/config/
  export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      target: "esnext",
      minify: "esbuild",
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/react-router-dom")) {
              return "vendor-react";
            }
            if (id.includes("node_modules/framer-motion") || id.includes("node_modules/lucide-react") || id.includes("node_modules/sonner")) {
              return "vendor-ui";
            }
          },
        },
      },
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
  })
