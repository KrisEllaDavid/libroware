import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  loadEnv(mode, process.cwd());
  const isElectron = mode === "electron";
  const isProd = mode === "production" || mode === "electron";

  return {
    plugins: [react()],
    css: {
      postcss: {
        plugins: [
          tailwindcss(),
          autoprefixer(),
          ...(isProd ? [cssnano({ preset: "default" })] : []),
        ],
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    base: isElectron ? "./" : "/",
    define: {
      "import.meta.env.VITE_ELECTRON": JSON.stringify(String(isElectron)),
    },
    build: {
      outDir: "dist",
    },
    server: {
      port: 3000,
      proxy:
        mode === "development"
          ? {
              "/api/graphql": {
                target: "http://localhost:4000",
                rewrite: (p) => p.replace(/^\/api\/graphql/, "/graphql"),
                changeOrigin: true,
              },
            }
          : undefined,
    },
  };
});
