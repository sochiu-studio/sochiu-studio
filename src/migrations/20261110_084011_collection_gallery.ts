import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "product_collections_rels" ADD COLUMN "media_id" integer;
  ALTER TABLE "product_collections_rels" ADD CONSTRAINT "product_collections_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "product_collections_rels_media_id_idx" ON "product_collections_rels" USING btree ("media_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "product_collections_rels" DROP CONSTRAINT "product_collections_rels_media_fk";
  
  DROP INDEX "product_collections_rels_media_id_idx";
  ALTER TABLE "product_collections_rels" DROP COLUMN "media_id";`)
}
