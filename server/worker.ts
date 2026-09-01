/**
 * Optional Cloudflare Worker entry (not used by the assets-only wrangler.toml).
 * Kept for a future dynamic /api/search Worker that must NOT import Node fs corpus loaders.
 */
export default {
  async fetch(request: Request, env: { ASSETS?: { fetch: (request: Request) => Promise<Response> } }): Promise<Response> {
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("Not found", { status: 404 });
  }
};
