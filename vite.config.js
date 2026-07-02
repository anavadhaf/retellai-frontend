import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2020",
    cssCodeSplit: true,
    modulePreload: {
      polyfill: true,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            const packagePath = id.split("node_modules/")[1];

            if (!packagePath) {
              return "vendor";
            }

            const segments = packagePath.split("/");
            const packageName = segments[0].startsWith("@")
              ? `${segments[0]}-${segments[1]}`
              : segments[0];

            return `npm-${packageName.replace("@", "").replace(/[\\/]/g, "-")}`;
          }
        },
      },
    },
  },
});
