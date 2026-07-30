import { pgTable, text, unique } from "drizzle-orm/pg-core";

import { id, schoolId, timestamps } from "./_shared";

// Polymorphic: one row per (entityType, entityId) — re-uploading replaces
// the existing row rather than accumulating history. Storage-agnostic:
// storageKey resolves through /api/uploads/[key], same code path whether
// the object lives in local MinIO or R2/S3 in prod (see RFC 0002).
export const MEDIA_ENTITY_TYPES = ["student", "teacher", "guardian", "class"] as const;
export type MediaEntityType = (typeof MEDIA_ENTITY_TYPES)[number];

export const media = pgTable(
  "media",
  {
    id: id(),
    entityType: text("entity_type").notNull().$type<MediaEntityType>(),
    entityId: text("entity_id").notNull(),
    storageKey: text("storage_key").notNull(),
    contentType: text("content_type").notNull(),
    schoolId: schoolId(),
    ...timestamps,
  },
  (t) => [unique().on(t.entityType, t.entityId)],
);
