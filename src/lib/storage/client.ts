import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * S3-compatible object storage — MinIO locally, R2 or real S3 in prod, same
 * code either way (R2 exposes an S3-compatible API, see RFC 0002). Never
 * proxy file bytes through the app server: the browser uploads directly to
 * a presigned URL.
 */
function getClient() {
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

export function contentObjectUrl(key: string) {
  return `/api/uploads/${encodeURIComponent(key)}`;
}
