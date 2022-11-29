import { defineConfig } from "vite";
import svgrPlugin from "vite-plugin-svgr";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: "build",
  },
  server: {
    // whilst we won't tend to do dev work via 'vite serve' - if we do then it mind
    // as well run on the same port
    port: 3000,
  },
  plugins: [
    react(),
    svgrPlugin({
      svgrOptions: {
        icon: true,
        // ...svgr options (https://react-svgr.com/docs/options/)
      },
    }),
  ],
});
