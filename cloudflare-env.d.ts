// Merges the wrangler-generated `Env` (worker-configuration.d.ts, from our
// wrangler.jsonc bindings: DB, CONTENT_BUCKET, ASSETS) into `CloudflareEnv`
// (declared by @opennextjs/cloudflare), which is what getCloudflareContext()
// returns. Also declares secrets set via `wrangler secret put` / .dev.vars
// that aren't Worker bindings, so they're typed at every call site.
declare global {
  interface CloudflareEnv extends Env {
    R2_ACCOUNT_ID: string;
    R2_BUCKET_NAME: string;
  }
}

export {};
