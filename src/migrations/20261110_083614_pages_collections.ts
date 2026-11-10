import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_sections_image_side" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum_pages_sections_background" AS ENUM('white', 'cream');
  CREATE TYPE "public"."enum__pages_v_version_sections_image_side" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum__pages_v_version_sections_background" AS ENUM('white', 'cream');
  CREATE TABLE "product_collections" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"cover_id" integer,
  	"order" numeric DEFAULT 0,
  	"meta_image_id" integer,
  	"slug" varchar,
  	"wp_id" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "product_collections_locales" (
  	"title" varchar NOT NULL,
  	"tagline" varchar,
  	"description" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "product_collections_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer
  );
  
  CREATE TABLE "pages_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"button_url" varchar,
  	"image_side" "enum_pages_sections_image_side" DEFAULT 'left',
  	"background" "enum_pages_sections_background" DEFAULT 'white'
  );
  
  CREATE TABLE "pages_sections_locales" (
  	"heading" varchar,
  	"body" varchar,
  	"button_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_pages_v_version_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"button_url" varchar,
  	"image_side" "enum__pages_v_version_sections_image_side" DEFAULT 'left',
  	"background" "enum__pages_v_version_sections_background" DEFAULT 'white',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_version_sections_locales" (
  	"heading" varchar,
  	"body" varchar,
  	"button_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "pages_faqs_locales" ALTER COLUMN "answer" SET DATA TYPE jsonb USING NULL;
  ALTER TABLE "_pages_v_version_faqs_locales" ALTER COLUMN "answer" SET DATA TYPE jsonb USING NULL;
  ALTER TABLE "pages_faqs_locales" ADD COLUMN "group" varchar;
  ALTER TABLE "pages" ADD COLUMN "pdf_id" integer;
  ALTER TABLE "_pages_v_version_faqs_locales" ADD COLUMN "group" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_pdf_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "product_collections_id" integer;
  ALTER TABLE "site_settings_showrooms" ADD COLUMN "map_embed" varchar;
  ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "product_collections_locales" ADD CONSTRAINT "product_collections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."product_collections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "product_collections_rels" ADD CONSTRAINT "product_collections_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."product_collections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "product_collections_rels" ADD CONSTRAINT "product_collections_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_sections" ADD CONSTRAINT "pages_sections_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_sections" ADD CONSTRAINT "pages_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_sections_locales" ADD CONSTRAINT "pages_sections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_sections" ADD CONSTRAINT "_pages_v_version_sections_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_version_sections" ADD CONSTRAINT "_pages_v_version_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_sections_locales" ADD CONSTRAINT "_pages_v_version_sections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "product_collections_cover_idx" ON "product_collections" USING btree ("cover_id");
  CREATE INDEX "product_collections_meta_meta_image_idx" ON "product_collections" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX "product_collections_slug_idx" ON "product_collections" USING btree ("slug");
  CREATE INDEX "product_collections_wp_id_idx" ON "product_collections" USING btree ("wp_id");
  CREATE INDEX "product_collections_updated_at_idx" ON "product_collections" USING btree ("updated_at");
  CREATE INDEX "product_collections_created_at_idx" ON "product_collections" USING btree ("created_at");
  CREATE UNIQUE INDEX "product_collections_locales_locale_parent_id_unique" ON "product_collections_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "product_collections_locales_parent_id_idx" ON "product_collections_locales" USING btree ("_parent_id");
  CREATE INDEX "product_collections_rels_order_idx" ON "product_collections_rels" USING btree ("order");
  CREATE INDEX "product_collections_rels_parent_idx" ON "product_collections_rels" USING btree ("parent_id");
  CREATE INDEX "product_collections_rels_path_idx" ON "product_collections_rels" USING btree ("path");
  CREATE INDEX "product_collections_rels_products_id_idx" ON "product_collections_rels" USING btree ("products_id");
  CREATE INDEX "pages_sections_order_idx" ON "pages_sections" USING btree ("_order");
  CREATE INDEX "pages_sections_parent_id_idx" ON "pages_sections" USING btree ("_parent_id");
  CREATE INDEX "pages_sections_image_idx" ON "pages_sections" USING btree ("image_id");
  CREATE UNIQUE INDEX "pages_sections_locales_locale_parent_id_unique" ON "pages_sections_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_sections_locales_parent_id_idx" ON "pages_sections_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_version_sections_order_idx" ON "_pages_v_version_sections" USING btree ("_order");
  CREATE INDEX "_pages_v_version_sections_parent_id_idx" ON "_pages_v_version_sections" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_version_sections_image_idx" ON "_pages_v_version_sections" USING btree ("image_id");
  CREATE UNIQUE INDEX "_pages_v_version_sections_locales_locale_parent_id_unique" ON "_pages_v_version_sections_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_version_sections_locales_parent_id_idx" ON "_pages_v_version_sections_locales" USING btree ("_parent_id");
  ALTER TABLE "pages" ADD CONSTRAINT "pages_pdf_id_media_id_fk" FOREIGN KEY ("pdf_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_pdf_id_media_id_fk" FOREIGN KEY ("version_pdf_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_product_collections_fk" FOREIGN KEY ("product_collections_id") REFERENCES "public"."product_collections"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_pdf_idx" ON "pages" USING btree ("pdf_id");
  CREATE INDEX "_pages_v_version_version_pdf_idx" ON "_pages_v" USING btree ("version_pdf_id");
  CREATE INDEX "payload_locked_documents_rels_product_collections_id_idx" ON "payload_locked_documents_rels" USING btree ("product_collections_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "product_collections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "product_collections_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "product_collections_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_sections_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_version_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_version_sections_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "product_collections" CASCADE;
  DROP TABLE "product_collections_locales" CASCADE;
  DROP TABLE "product_collections_rels" CASCADE;
  DROP TABLE "pages_sections" CASCADE;
  DROP TABLE "pages_sections_locales" CASCADE;
  DROP TABLE "_pages_v_version_sections" CASCADE;
  DROP TABLE "_pages_v_version_sections_locales" CASCADE;
  ALTER TABLE "pages" DROP CONSTRAINT "pages_pdf_id_media_id_fk";
  
  ALTER TABLE "_pages_v" DROP CONSTRAINT "_pages_v_version_pdf_id_media_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_product_collections_fk";
  
  DROP INDEX "pages_pdf_idx";
  DROP INDEX "_pages_v_version_version_pdf_idx";
  DROP INDEX "payload_locked_documents_rels_product_collections_id_idx";
  ALTER TABLE "pages_faqs_locales" ALTER COLUMN "answer" SET DATA TYPE varchar;
  ALTER TABLE "_pages_v_version_faqs_locales" ALTER COLUMN "answer" SET DATA TYPE varchar;
  ALTER TABLE "pages_faqs_locales" DROP COLUMN "group";
  ALTER TABLE "pages" DROP COLUMN "pdf_id";
  ALTER TABLE "_pages_v_version_faqs_locales" DROP COLUMN "group";
  ALTER TABLE "_pages_v" DROP COLUMN "version_pdf_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "product_collections_id";
  ALTER TABLE "site_settings_showrooms" DROP COLUMN "map_embed";
  DROP TYPE "public"."enum_pages_sections_image_side";
  DROP TYPE "public"."enum_pages_sections_background";
  DROP TYPE "public"."enum__pages_v_version_sections_image_side";
  DROP TYPE "public"."enum__pages_v_version_sections_background";`)
}
