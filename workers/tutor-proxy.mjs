/**
 * Cloudflare Worker: forwards chat completions to OpenAI with the key on the server.
 * Deploy: npm i -g wrangler && wrangler secret put OPENAI_API_KEY && wrangler deploy
 * Set VITE_TUTOR_API_URL in GitHub repo Variables to https://<your-worker>.workers.dev
 */

function cors(origin) {
  const o = origin ?? "";
  const allow =
    o.includes("localhost") ||
    o.endsWith(".github.io") ||
    o === "null" ||
    o === "";
  const v = allow && o ? o : "*";
  return {
    "Access-Control-Allow-Origin": v,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const ch = cors(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: ch });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Use POST" }), {
        status: 405,
        headers: { ...ch, "Content-Type": "application/json" },
      });
    }

    const key = env.OPENAI_API_KEY;
    if (!key) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not set on worker" }), {
        status: 500,
        headers: { ...ch, "Content-Type": "application/json" },
      });
    }

    const body = await request.text();
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body,
    });

    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: {
        ...ch,
        "Content-Type": "application/json",
      },
    });
  },
};
