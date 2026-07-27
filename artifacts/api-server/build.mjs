import { build } from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");
const apiZodDir = path.resolve(rootDir, "lib/api-zod");
const dbDir = path.resolve(rootDir, "lib/db");

const workspacePlugin = {
  name: "workspace-resolve",
  setup(build) {
    build.onResolve({ filter: /^@workspace\/api-zod$/ }, () => ({
      path: path.join(apiZodDir, "src", "index.ts"),
    }));
    build.onResolve({ filter: /^@workspace\/db$/ }, () => ({
      path: path.join(dbDir, "src", "index.ts"),
    }));
  },
};

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "dist/index.mjs",
  plugins: [workspacePlugin],
  banner: {
    js: [
      `import { createRequire as __createRequire } from "node:module";`,
      `import { fileURLToPath as __fileURLToPath } from "node:url";`,
      `import { dirname as __dirnameFn } from "node:path";`,
      `const require = __createRequire(import.meta.url);`,
      `const __filename = __fileURLToPath(import.meta.url);`,
      `const __dirname = __dirnameFn(__filename);`,
    ].join("\n"),
  },
  external: [
    "bcrypt",
    "zod",
    "express-rate-limit",
    "@google-cloud/*",
    "google-auth-library",
    "drizzle-orm",
    "pino",
    "pino-pretty",
    "thread-stream",
  ],
});
