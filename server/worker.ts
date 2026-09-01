import { handleApiRequest } from "./api";

/** Cloudflare Worker-shaped entry. Not deployed in this goal; Pages can later route /api/* here. */
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) {
      return new Response("Not found", { status: 404 });
    }
    const result = handleApiRequest(request.url);
    return new Response(JSON.stringify(result.json), {
      status: result.status,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }
};
