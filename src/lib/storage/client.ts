import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * S3-compatible object storage — MinIO locally, R2 or real S3 in prod, same
 * code either way (R2 exposes an S3-compatible API, see RFC 0002). Never
 * proxy file bytes through the app server: the browser uploads directly to
 * a presigned URL.
 */
export function getClient() {
  return new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? "us-east-1",
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
}

export async function presignUpload(key: string, contentType: string) {
  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn: 600 });
}

/**
 * The storage key is stable per (entityType, entityId) — re-uploads
 * overwrite it (see media.ts) — so the URL must carry a cache-busting
 * version param, otherwise the browser's cached response for that exact
 * URL keeps showing the old photo after a re-upload.
 */
export function contentObjectUrl(key: string, version?: Date | string | number | null) {
  const base = `/api/uploads/${encodeURIComponent(key)}`;
  if (!version) return base;
  const v = version instanceof Date ? version.getTime() : version;
  return `${base}?v=${encodeURIComponent(v)}`;
}

export async function getObject(key: string) {
  const client = getClient();
  return client.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
}
