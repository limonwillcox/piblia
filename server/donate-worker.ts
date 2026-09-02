import { handleDonateFetch, type DonateEnv } from "./donate";

/** Slim Cloudflare Worker: Stripe checkout only. Does not bundle the corpus. */
export default {
  async fetch(request: Request, env: DonateEnv): Promise<Response> {
    const donate = await handleDonateFetch(request, env);
    if (donate) return donate;
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }
};
