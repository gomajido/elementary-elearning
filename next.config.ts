import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

// Enables local dev (`bun run dev`) to access Cloudflare bindings (D1, R2)
// via `getCloudflareContext()` without a full `wrangler dev` cycle.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
