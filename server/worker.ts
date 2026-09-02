import { handleDonateFetch, type DonateEnv } from "./donate";

type Env = DonateEnv & { ASSETS?: { fetch: (request: Request) => Promise<Response> } };

/**
 * Cloudflare Worker: Stripe donate POST, then static assets.
 * Must not import Node fs corpus loaders.
 */
export default {
  async fetch(request: Request, env: Env = {}): Promise<Response> {
    const donate = await handleDonateFetch(request, env);
    if (donate) return donate;
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("Not found", { status: 404 });
  }
};
