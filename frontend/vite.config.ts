import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd());

  // Use the loaded environment variables
  const apiUrl = env.VITE_API_URL;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 3000,
      // Only use proxy in development local mode
      proxy:
        mode === "development"
          ? {
              "/graphql": {
                target: "http://localhost:4000",
                changeOrigin: true,
              },
            }
          : undefined,
    },
  };
}); 