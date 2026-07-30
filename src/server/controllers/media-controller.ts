"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/rbac";
import { presignUpload } from "@/lib/storage/client";
import { MediaRepository } from "@/server/repositories/media-repository";
import { MEDIA_ENTITY_TYPES, type MediaEntityType } from "@/lib/db/schema";

const entityTypeSchema = z.enum(MEDIA_ENTITY_TYPES);

// One key per (entityType, entityId) — a re-upload overwrites the same
// storage object, no orphaned files pile up, matches the DB's unique
// constraint "replace, don't accumulate" semantics.
function keyFor(entityType: MediaEntityType, entityId: string) {
  return `media/${entityType}/${entityId}`;
}

export async function requestUploadUrlAction(entityType: MediaEntityType, entityId: string, contentType: string) {
  await requireRole(["admin"]);
  const parsedType = entityTypeSchema.parse(entityType);
  if (!contentType.startsWith("image/")) throw new Error("File harus berupa gambar");

  const key = keyFor(parsedType, entityId);
  const uploadUrl = await presignUpload(key, contentType);
  return { uploadUrl, key };
}

export async function confirmUploadAction(
  entityType: MediaEntityType,
  entityId: string,
  key: string,
  contentType: string,
  revalidateTarget: string,
) {
  await requireRole(["admin"]);
  const parsedType = entityTypeSchema.parse(entityType);

  await MediaRepository.upsert(parsedType, entityId, { storageKey: key, contentType });
  revalidatePath(revalidateTarget);
  return { ok: true };
}
