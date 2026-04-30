import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: mode !== "production",
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@sentry")) return "vendor-sentry";
          if (id.includes("posthog-js")) return "vendor-posthog";
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("@tanstack/react-query")) return "vendor-query";
          if (id.includes("react-router")) return "vendor-router";
          if (id.includes("@radix-ui")) return "vendor-radix";
          if (id.includes("reactflow") || id.includes("@reactflow")) return "vendor-reactflow";
          if (id.includes("html-to-image")) return "vendor-html-to-image";
          if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
          if (id.includes("@dnd-kit")) return "vendor-dnd";
          if (id.includes("date-fns") || id.includes("react-day-picker")) return "vendor-dates";
          if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("zod")) {
            return "vendor-forms";
          }
          if (id.includes("lucide-react")) return "vendor-icons";
          if (id.includes("react-dom")) return "vendor-react-dom";
          if (
            id.includes("/react/") ||
            id.endsWith("/react/index.js") ||
            id.includes("scheduler") ||
            id.includes("react-is")
          ) {
            return "vendor-react";
          }
          return "vendor-misc";
        },
      },
    },
  },
}));
