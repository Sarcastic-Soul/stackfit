// Local only: serves the Hono app on :8787. Vite proxies /api here.
import { app } from "./app";

const server = Bun.serve({ port: 8787, fetch: app.fetch, idleTimeout: 255 });
console.log(`API on http://localhost:${server.port}`);
