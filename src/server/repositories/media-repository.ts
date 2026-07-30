import { and, eq, inArray, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { media, type MediaEntityType } from "@/lib/db/schema";

export const MediaRepository = {
  async upsert(entityType: MediaEntityType, entityId: string, input: { storageKey: string; contentType: string }) {
    const db = getDb();
    const [row] = await db
      .insert(media)
      .values({ entityType, entityId, storageKey: input.storageKey, contentType: input.contentType })
      .onConflictDoUpdate({
        target: [media.entityType, media.entityId],
        set: {
          storageKey: sql`excluded.storage_key`,
          contentType: sql`excluded.content_type`,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row;
  },

  async findForEntity(entityType: MediaEntityType, entityId: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(media)
      .where(and(eq(media.entityType, entityType), eq(media.entityId, entityId)))
      .limit(1);
    return row ?? null;
  },

  async findManyForEntities(entityType: MediaEntityType, entityIds: string[]) {
    if (entityIds.length === 0) return [];
    const db = getDb();
    return db
      .select()
      .from(media)
      .where(and(eq(media.entityType, entityType), inArray(media.entityId, entityIds)));
  },
};
