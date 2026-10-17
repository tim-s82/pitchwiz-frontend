import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { execSync } from "child_process";
import fs from "fs";

const packageJson = JSON.parse(
  fs.readFileSync(new URL("./package.json", import.meta.url), "utf-8")
);

let gitDate = "";
try {
  gitDate = execSync("git log -1 --format=%cs").toString().trim();
} catch {
  // If git is unavailable, fallback gracefully
}

const buildDate =
  process.env.VITE_BUILD_DATE || gitDate || new Date().toISOString().split("T")[0];
const appVersion =
  process.env.VITE_APP_VERSION || packageJson.version || "1.0.0";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
    "import.meta.env.VITE_BUILD_DATE": JSON.stringify(buildDate),
  },
  test: {
    globals: true,
    environment: "jsdom",
  },
});
