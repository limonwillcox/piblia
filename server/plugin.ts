import type { IncomingMessage, ServerResponse } from "http";
import type { Plugin } from "vite";
import { handleApiRequest } from "./api";

function apiMiddleware(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const url = req.url || "";
  if (!url.startsWith("/api/")) return next();
  try {
    const result = handleApiRequest(url);
    res.statusCode = result.status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(result.json));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
  }
}

export function fathersApiPlugin(): Plugin {
  return {
    name: "fathers-api",
    configureServer(server) {
      server.middlewares.use(apiMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(apiMiddleware);
    }
  };
}
