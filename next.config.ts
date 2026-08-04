import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // postgres (drizzle-orm/postgres-js) ships a workerd-specific conditional
  // export — externalizing it stops Next from bundling it under Node's
  // module resolution instead, which would break it under Cloudflare
  // Workers. See docs/rfc/0004-cloudflare-production-deployment.md.
  serverExternalPackages: ["postgres"],
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
