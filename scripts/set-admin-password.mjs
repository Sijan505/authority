// Sets the admin panel username and password on Vercel (production).
// Usage:  node scripts/set-admin-password.mjs <username> <password>
//   or:   npm run admin:password -- <username> <password>
// Only a scrypt hash of the password is sent to Vercel. Redeploy afterwards (npm run ship).
import { randomBytes, scryptSync } from "node:crypto";
import { spawnSync } from "node:child_process";

const [username, password] = process.argv.slice(2);
if (!username || !password) {
  console.error("Usage: npm run admin:password -- <username> <password>");
  process.exit(1);
}
if (password.length < 12) {
  console.error("Use a password of at least 12 characters.");
  process.exit(1);
}

const salt = randomBytes(16);
const hash = `scrypt$${salt.toString("hex")}$${scryptSync(password, salt, 64).toString("hex")}`;

function setEnv(name, value) {
  const r = spawnSync("vercel", ["env", "add", name, "--environment", "production", "--force", "--yes"], {
    input: value, // stdin, no trailing newline or BOM
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (r.status !== 0) {
    console.error(`Failed to set ${name}:\n${r.stderr || r.stdout}`);
    process.exit(1);
  }
  console.log(`Set ${name} on Vercel (production).`);
}

setEnv("ADMIN_USERNAME", username.trim().toLowerCase());
setEnv("ADMIN_PASSWORD_HASH", hash);
console.log("Done. Redeploy with: npm run ship   (or: vercel deploy --prod)");
