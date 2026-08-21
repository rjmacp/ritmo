import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";

// package.json sets "type": "module", so this config is ESM and has no `__dirname`;
// derive it from import.meta.url instead.
const envFile = resolve(dirname(fileURLToPath(import.meta.url)), ".env.local");
if (existsSync(envFile)) process.loadEnvFile(envFile); // Node >= 20.12

export default defineConfig({
  testDir: "e2e",
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/signin",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
