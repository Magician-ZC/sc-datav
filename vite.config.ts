import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 修改base路径以适配主项目的静态文件服务
  base: "/static/datav/",
  resolve: {
    alias: {
      "@": resolve("src"),
    },
  },
  build: {
    // 输出到主项目的static目录
    outDir: "../static/datav",
    emptyOutDir: true,
  },
});
