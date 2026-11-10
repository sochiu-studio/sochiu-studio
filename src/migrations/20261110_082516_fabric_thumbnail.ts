import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "fabrics" ADD COLUMN "thumbnail_id" integer;
  ALTER TABLE "fabrics" ADD CONSTRAINT "fabrics_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "fabrics_thumbnail_idx" ON "fabrics" USING btree ("thumbnail_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "fabrics" DROP CONSTRAINT "fabrics_thumbnail_id_media_id_fk";
  
  DROP INDEX "fabrics_thumbnail_idx";
  ALTER TABLE "fabrics" DROP COLUMN "thumbnail_id";`)
}
