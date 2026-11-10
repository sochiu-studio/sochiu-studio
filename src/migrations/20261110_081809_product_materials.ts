import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_materials" AS ENUM('fabric', 'leather', 'wood');
  CREATE TYPE "public"."enum__products_v_version_materials" AS ENUM('fabric', 'leather', 'wood');
  CREATE TABLE "products_materials" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_products_materials",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_products_v_version_materials" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__products_v_version_materials",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "products_materials" ADD CONSTRAINT "products_materials_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_materials" ADD CONSTRAINT "_products_v_version_materials_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_materials_order_idx" ON "products_materials" USING btree ("order");
  CREATE INDEX "products_materials_parent_idx" ON "products_materials" USING btree ("parent_id");
  CREATE INDEX "_products_v_version_materials_order_idx" ON "_products_v_version_materials" USING btree ("order");
  CREATE INDEX "_products_v_version_materials_parent_idx" ON "_products_v_version_materials" USING btree ("parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "products_materials" CASCADE;
  DROP TABLE "_products_v_version_materials" CASCADE;
  DROP TYPE "public"."enum_products_materials";
  DROP TYPE "public"."enum__products_v_version_materials";`)
}
