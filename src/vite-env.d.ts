/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY?: string;
  /** Production: URL of Cloudflare Worker (or other HTTPS proxy) that forwards to OpenAI */
  readonly VITE_TUTOR_API_URL?: string;
}
