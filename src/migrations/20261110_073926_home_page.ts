import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "home_page_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"mobile_image_id" integer,
  	"url" varchar
  );
  
  CREATE TABLE "home_page_slides_locales" (
  	"alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"catalogue_image_id" integer,
  	"catalogue_button_url" varchar,
  	"fabric_image_id" integer,
  	"fabric_button_url" varchar,
  	"inspiration_button_url" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "home_page_locales" (
  	"products_title" varchar,
  	"catalogue_eyebrow" varchar,
  	"catalogue_title" varchar,
  	"catalogue_button_label" varchar,
  	"library_title" varchar,
  	"fabric_title" varchar,
  	"fabric_text" varchar,
  	"fabric_button_label" varchar,
  	"inspiration_title" varchar,
  	"inspiration_text" varchar,
  	"inspiration_button_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "home_page_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"product_categories_id" integer,
  	"post_categories_id" integer
  );
  
  ALTER TABLE "post_categories" ADD COLUMN "image_id" integer;
  ALTER TABLE "home_page_slides" ADD CONSTRAINT "home_page_slides_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page_slides" ADD CONSTRAINT "home_page_slides_mobile_image_id_media_id_fk" FOREIGN KEY ("mobile_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page_slides" ADD CONSTRAINT "home_page_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_slides_locales" ADD CONSTRAINT "home_page_slides_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_slides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_catalogue_image_id_media_id_fk" FOREIGN KEY ("catalogue_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_fabric_image_id_media_id_fk" FOREIGN KEY ("fabric_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page_locales" ADD CONSTRAINT "home_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_rels" ADD CONSTRAINT "home_page_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_rels" ADD CONSTRAINT "home_page_rels_product_categories_fk" FOREIGN KEY ("product_categories_id") REFERENCES "public"."product_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_rels" ADD CONSTRAINT "home_page_rels_post_categories_fk" FOREIGN KEY ("post_categories_id") REFERENCES "public"."post_categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "home_page_slides_order_idx" ON "home_page_slides" USING btree ("_order");
  CREATE INDEX "home_page_slides_parent_id_idx" ON "home_page_slides" USING btree ("_parent_id");
  CREATE INDEX "home_page_slides_image_idx" ON "home_page_slides" USING btree ("image_id");
  CREATE INDEX "home_page_slides_mobile_image_idx" ON "home_page_slides" USING btree ("mobile_image_id");
  CREATE UNIQUE INDEX "home_page_slides_locales_locale_parent_id_unique" ON "home_page_slides_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_page_slides_locales_parent_id_idx" ON "home_page_slides_locales" USING btree ("_parent_id");
  CREATE INDEX "home_page_catalogue_image_idx" ON "home_page" USING btree ("catalogue_image_id");
  CREATE INDEX "home_page_fabric_image_idx" ON "home_page" USING btree ("fabric_image_id");
  CREATE UNIQUE INDEX "home_page_locales_locale_parent_id_unique" ON "home_page_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_page_locales_parent_id_idx" ON "home_page_locales" USING btree ("_parent_id");
  CREATE INDEX "home_page_rels_order_idx" ON "home_page_rels" USING btree ("order");
  CREATE INDEX "home_page_rels_parent_idx" ON "home_page_rels" USING btree ("parent_id");
  CREATE INDEX "home_page_rels_path_idx" ON "home_page_rels" USING btree ("path");
  CREATE INDEX "home_page_rels_product_categories_id_idx" ON "home_page_rels" USING btree ("product_categories_id");
  CREATE INDEX "home_page_rels_post_categories_id_idx" ON "home_page_rels" USING btree ("post_categories_id");
  ALTER TABLE "post_categories" ADD CONSTRAINT "post_categories_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "post_categories_image_idx" ON "post_categories" USING btree ("image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page_slides" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_slides_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "home_page_slides" CASCADE;
  DROP TABLE "home_page_slides_locales" CASCADE;
  DROP TABLE "home_page" CASCADE;
  DROP TABLE "home_page_locales" CASCADE;
  DROP TABLE "home_page_rels" CASCADE;
  ALTER TABLE "post_categories" DROP CONSTRAINT "post_categories_image_id_media_id_fk";
  
  DROP INDEX "post_categories_image_idx";
  ALTER TABLE "post_categories" DROP COLUMN "image_id";`)
}
