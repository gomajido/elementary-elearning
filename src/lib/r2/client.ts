import { AwsClient } from "aws4fetch";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Signs a presigned PUT URL so the browser can upload directly to R2,
 * bypassing the Worker entirely for the file bytes (Workers has request
 * body size / CPU time limits — see RFC 0001 "Key Risks / Gotchas").
 */
export async function presignUpload(key: string, contentType: string) {
  const { env } = getCloudflareContext();
  if (!env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    throw new Error("R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY not configured");
  }

  const client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  });

  const url = new URL(
    `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}/${key}`
  );
  url.searchParams.set("X-Amz-Expires", "600");

  const signed = await client.sign(
    new Request(url, { method: "PUT", headers: { "content-type": contentType } }),
    { aws: { signQuery: true } }
  );

  return signed.url;
}

export function contentObjectUrl(key: string) {
  return `/api/uploads/${encodeURIComponent(key)}`;
}
