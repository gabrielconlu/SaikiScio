import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const scrypt = promisify(scryptCallback);
const port = Number(process.env.API_PORT ?? 3001);
const sessionCookieName = "saikiscio_session";
const sessionLifetimeSeconds = 60 * 60 * 24 * 7;
const maxBodyBytes = 128 * 1024;
const minPasswordCharacters = 6;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const deviceIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const secureCookie = process.env.NODE_ENV === "production";
const allowedOrigins = new Set(
  (process.env.SITE_ORIGINS ?? "http://127.0.0.1:5173,http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);
const pool = new Pool({
  host: process.env.PGHOST ?? "localhost",
  port: Number(process.env.PGPORT ?? 5432),
  database: process.env.PGDATABASE ?? "saikiscio",
  user: process.env.PGUSER ?? "saikiscio_app",
  password: process.env.PGPASSWORD,
  max: 5,
  connectionTimeoutMillis: 5000,
});
const schemaUrl = new URL("./schema.sql", import.meta.url);
const authAttempts = new Map();

function sendJson(response, status, data, headers = {}) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
    ...headers,
  });
  response.end(JSON.stringify(data));
}

function errorResponse(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function readJsonBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body, "utf8") > maxBodyBytes) {
      throw errorResponse(413, "Request body is too large.");
    }
  }
  try {
    return JSON.parse(body);
  } catch {
    throw errorResponse(400, "Request body must be valid JSON.");
  }
}

function readCookies(request) {
  const header = request.headers.cookie ?? "";
  return Object.fromEntries(header.split(";").map((part) => {
    const separator = part.indexOf("=");
    if (separator < 0) return ["", ""];
    return [part.slice(0, separator).trim(), part.slice(separator + 1).trim()];
  }).filter(([name]) => name));
}

function sessionCookie(value, maxAge) {
  return `${sessionCookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secureCookie ? "; Secure" : ""}`;
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function validateCredentials(email, password) {
  if (email.length > 254 || !emailPattern.test(email)) {
    throw errorResponse(400, "Enter a valid email address.");
  }
  if (
    typeof password !== "string" ||
    [...password].length < minPasswordCharacters ||
    Buffer.byteLength(password, "utf8") > 128
  ) {
    throw errorResponse(400, "Use a password with at least 6 characters and no more than 128 UTF-8 bytes.");
  }
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$32768$8$1$${salt.toString("base64url")}$${Buffer.from(derivedKey).toString("base64url")}`;
}

async function verifyPassword(password, storedHash) {
  const [algorithm, cost, blockSize, parallelism, saltText, keyText] = storedHash.split("$");
  if (algorithm !== "scrypt" || cost !== "32768" || blockSize !== "8" || parallelism !== "1" || !saltText || !keyText) {
    throw new Error("Stored password hash format is invalid.");
  }
  const expected = Buffer.from(keyText, "base64url");
  const actual = Buffer.from(await scrypt(
    password,
    Buffer.from(saltText, "base64url"),
    expected.length,
    { N: Number(cost), r: Number(blockSize), p: Number(parallelism), maxmem: 64 * 1024 * 1024 },
  ));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function checkAuthRateLimit(request) {
  const ip = request.socket.remoteAddress ?? "unknown";
  const now = Date.now();
  const current = authAttempts.get(ip);
  if (!current || current.resetAt <= now) {
    authAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return;
  }
  current.count += 1;
  if (current.count > 12) throw errorResponse(429, "Too many sign-in attempts. Wait 15 minutes and try again.");
}

function assertTrustedOrigin(request) {
  const origin = request.headers.origin;
  if (typeof origin !== "string" || !allowedOrigins.has(origin)) {
    throw errorResponse(403, "Request origin is not allowed.");
  }
}

async function createSession(userId, response) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  await pool.query(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')",
    [tokenHash, userId],
  );
  response.setHeader("set-cookie", sessionCookie(token, sessionLifetimeSeconds));
}

async function migrateLegacyProgress(userId, deviceId) {
  if (typeof deviceId !== "string" || !deviceIdPattern.test(deviceId)) return;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO account_progress (user_id, progress)
       SELECT $1, progress FROM learning_progress WHERE device_id = $2
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, deviceId],
    );
    await client.query("DELETE FROM learning_progress WHERE device_id = $1", [deviceId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getCurrentUser(request) {
  const token = readCookies(request)[sessionCookieName];
  if (!token || token.length > 128) return null;
  const result = await pool.query(
    `SELECT users.id, users.email
     FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = $1 AND sessions.expires_at > NOW()`,
    [hashToken(token)],
  );
  return result.rows[0] ?? null;
}

function requireUser(user) {
  if (!user) throw errorResponse(401, "Sign in to access your saved learning.");
  return user;
}

function validateProgress(progress) {
  if (typeof progress !== "object" || progress === null || Array.isArray(progress)) {
    throw errorResponse(400, "A progress object is required.");
  }
  if (JSON.stringify(progress).length > maxBodyBytes) {
    throw errorResponse(413, "Saved learning is too large.");
  }
}

async function handleRequest(request, response) {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  const method = request.method ?? "GET";

  if (method === "GET" && url.pathname === "/api/health") {
    await pool.query("SELECT 1");
    sendJson(response, 200, { status: "ok", database: "connected" });
    return;
  }

  if (method === "POST" || method === "PUT" || method === "DELETE") assertTrustedOrigin(request);

  if (method === "GET" && url.pathname === "/api/auth/me") {
    const user = await getCurrentUser(request);
    sendJson(response, 200, { user: user ? { id: user.id, email: user.email } : null });
    return;
  }

  if (method === "POST" && (url.pathname === "/api/auth/register" || url.pathname === "/api/auth/login")) {
    checkAuthRateLimit(request);
    const body = await readJsonBody(request);
    const email = normalizeEmail(body?.email);
    const password = body?.password;
    validateCredentials(email, password);

    if (url.pathname === "/api/auth/register") {
      const passwordHash = await hashPassword(password);
      let user;
      try {
        const result = await pool.query(
          "INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3) RETURNING id, email",
          [randomUUID(), email, passwordHash],
        );
        user = result.rows[0];
      } catch (error) {
        if (error.code === "23505") throw errorResponse(409, "An account with this email already exists. Sign in instead.");
        throw error;
      }
      await migrateLegacyProgress(user.id, body.legacyDeviceId);
      await createSession(user.id, response);
      sendJson(response, 201, { user });
      return;
    }

    const result = await pool.query("SELECT id, email, password_hash FROM users WHERE email = $1", [email]);
    const user = result.rows[0];
    const valid = user ? await verifyPassword(password, user.password_hash) : false;
    if (!valid) throw errorResponse(401, "Email or password is incorrect.");
    await migrateLegacyProgress(user.id, body.legacyDeviceId);
    await createSession(user.id, response);
    sendJson(response, 200, { user: { id: user.id, email: user.email } });
    return;
  }

  if (method === "POST" && url.pathname === "/api/auth/logout") {
    const token = readCookies(request)[sessionCookieName];
    if (token) await pool.query("DELETE FROM sessions WHERE token_hash = $1", [hashToken(token)]);
    sendJson(response, 200, { status: "signed-out" }, { "set-cookie": sessionCookie("", 0) });
    return;
  }

  if (url.pathname.startsWith("/api/auth/")) {
    const user = requireUser(await getCurrentUser(request));
    if (method === "POST" && url.pathname === "/api/auth/change-password") {
      const body = await readJsonBody(request);
      if (typeof body?.currentPassword !== "string" || typeof body?.newPassword !== "string") {
        throw errorResponse(400, "Enter your current password and a new password.");
      }
      const result = await pool.query("SELECT password_hash FROM users WHERE id = $1", [user.id]);
      if (!await verifyPassword(body.currentPassword, result.rows[0].password_hash)) {
        throw errorResponse(400, "Your current password is incorrect.");
      }
      validateCredentials(user.email, body.newPassword);
      const passwordHash = await hashPassword(body.newPassword);
      await pool.query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [passwordHash, user.id]);
      await pool.query("DELETE FROM sessions WHERE user_id = $1", [user.id]);
      await createSession(user.id, response);
      sendJson(response, 200, { user: { id: user.id, email: user.email }, status: "password-updated" });
      return;
    }

    if (method === "DELETE" && url.pathname === "/api/auth/account") {
      await pool.query("DELETE FROM users WHERE id = $1", [user.id]);
      sendJson(response, 200, { status: "account-deleted" }, { "set-cookie": sessionCookie("", 0) });
      return;
    }
  }

  if (method === "POST" && url.pathname === "/api/progress/migrate") {
    const user = requireUser(await getCurrentUser(request));
    const body = await readJsonBody(request);
    await migrateLegacyProgress(user.id, body?.legacyDeviceId);
    sendJson(response, 200, { status: "migrated" });
    return;
  }

  if (url.pathname === "/api/progress") {
    const user = requireUser(await getCurrentUser(request));
    if (method === "GET") {
      const result = await pool.query(
        "SELECT progress, updated_at FROM account_progress WHERE user_id = $1",
        [user.id],
      );
      sendJson(response, 200, {
        progress: result.rows[0]?.progress ?? null,
        updatedAt: result.rows[0]?.updated_at ?? null,
      });
      return;
    }

    if (method === "PUT") {
      const body = await readJsonBody(request);
      validateProgress(body?.progress);
      await pool.query(
        `INSERT INTO account_progress (user_id, progress, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (user_id) DO UPDATE
         SET progress = EXCLUDED.progress, updated_at = NOW()`,
        [user.id, JSON.stringify(body.progress)],
      );
      sendJson(response, 200, { status: "saved" });
      return;
    }

    if (method === "DELETE") {
      await pool.query("DELETE FROM account_progress WHERE user_id = $1", [user.id]);
      sendJson(response, 200, { status: "deleted" });
      return;
    }
  }

  sendJson(response, 404, { error: "API route not found." });
}

const server = createServer(async (request, response) => {
  try {
    await handleRequest(request, response);
  } catch (error) {
    const status = Number.isInteger(error.status) ? error.status : 500;
    if (status === 500) console.error("SaikiScio API request failed.", error);
    if (!response.headersSent) sendJson(response, status, { error: status === 500 ? "The API could not complete the request." : error.message });
    else response.destroy(error);
  }
});

async function start() {
  const schema = await readFile(fileURLToPath(schemaUrl), "utf8");
  await pool.query(schema);
  server.listen(port, "127.0.0.1", () => {
    console.log(`SaikiScio API listening on http://127.0.0.1:${port}`);
  });
}

server.on("close", () => pool.end());
process.on("SIGINT", () => server.close());
process.on("SIGTERM", () => server.close());

start().catch(async (error) => {
  console.error("Unable to start the SaikiScio API. Check PostgreSQL is running and .env has valid connection settings.", error);
  await pool.end();
  process.exitCode = 1;
});
