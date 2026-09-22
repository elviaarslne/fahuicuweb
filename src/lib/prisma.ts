import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// The mariadb driver's own connection-string parser assigns query params
// verbatim as object keys (e.g. `ssl-mode=REQUIRED` becomes the property
// `"ssl-mode"`), but it only ever reads a property literally named `ssl`.
// Passed straight through as a string, Aiven's recommended
// `?ssl-mode=REQUIRED` is silently dropped and the connection is attempted
// in plaintext -- which a TLS-only host can hang or reject on, surfacing
// as a generic pool-acquisition timeout rather than a clear TLS/auth
// error. Parsing the URL ourselves lets us translate that into an
// explicit `ssl` option, without touching local development, whose
// DATABASE_URL carries no ssl-mode param at all.
function shouldUseSsl(url: URL) {
  const sslMode = url.searchParams.get("ssl-mode") ?? url.searchParams.get("sslmode");
  if (sslMode) return !["disable", "disabled", "false"].includes(sslMode.toLowerCase());
  const ssl = url.searchParams.get("ssl");
  return ssl !== null && ssl.toLowerCase() !== "false";
}

// Aiven signs its MySQL server certificate with a per-project CA that
// isn't in Node's default trusted root store -- `ssl: true` alone fails
// with SELF_SIGNED_CERT_IN_CHAIN. This is Aiven's own public CA
// certificate (not a secret; safe to commit), trusted explicitly instead
// of disabling verification with `rejectUnauthorized: false`.
const AIVEN_CA_PATH = path.join(process.cwd(), "certs", "aiven-ca.pem");
let cachedAivenCa: string | undefined;
function getAivenCa() {
  if (cachedAivenCa === undefined) {
    cachedAivenCa = fs.readFileSync(AIVEN_CA_PATH, "utf8");
  }
  return cachedAivenCa;
}

function buildAdapter(databaseUrl: string | undefined) {
  if (!databaseUrl) return new PrismaMariaDb(databaseUrl ?? "");

  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    // Preserve the previous tolerant behavior for a malformed DATABASE_URL
    // (e.g. during a build step that doesn't need a live connection) --
    // defer the failure to first actual query instead of throwing at
    // module load time.
    return new PrismaMariaDb(databaseUrl);
  }

  // Deliberately outside the try/catch above: a missing/unreadable CA file
  // is a real deployment misconfiguration, not a malformed-URL situation,
  // and must not be silently swallowed into an insecure plaintext fallback.
  const ssl = shouldUseSsl(url) ? { ca: getAivenCa() } : undefined;

  return new PrismaMariaDb({
    host: url.hostname,
    port: url.port ? Number(url.port) : undefined,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    ssl,
    // Conservative, serverless-appropriate pool settings. A failure to
    // acquire a connection (e.g. a blocked/unreachable host) now times
    // out quickly instead of hanging for the default 10s per attempt.
    connectionLimit: 5,
    connectTimeout: 5000,
    acquireTimeout: 10000,
  });
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: buildAdapter(process.env.DATABASE_URL),
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
