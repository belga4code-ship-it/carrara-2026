import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const env = { ...process.env };
delete env.ADMIN_PASSWORD;
delete env.ADMIN_SESSION_SECRET;

const nextCli = resolve("node_modules/next/dist/bin/next");
const result = spawnSync(process.execPath, [nextCli, "build"], {
  env,
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
