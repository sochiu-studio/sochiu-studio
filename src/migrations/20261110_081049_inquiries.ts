import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_inquiries_type" AS ENUM('consult', 'visit');
  CREATE TYPE "public"."enum_inquiries_status" AS ENUM('new', 'contacted', 'done');
  CREATE TABLE "inquiries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum_inquiries_type" DEFAULT 'consult' NOT NULL,
  	"status" "enum_inquiries_status" DEFAULT 'new',
  	"name" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"visit_date" timestamp(3) with time zone,
  	"visit_time" varchar,
  	"note" varchar,
  	"product_id" integer,
  	"page" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "inquiries_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "site_settings_product_info_tabs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "site_settings_product_info_tabs_locales" (
  	"title" varchar NOT NULL,
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "inquiries_id" integer;
  ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "inquiries_texts" ADD CONSTRAINT "inquiries_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."inquiries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_product_info_tabs" ADD CONSTRAINT "site_settings_product_info_tabs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_product_info_tabs_locales" ADD CONSTRAINT "site_settings_product_info_tabs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_product_info_tabs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "inquiries_product_idx" ON "inquiries" USING btree ("product_id");
  CREATE INDEX "inquiries_updated_at_idx" ON "inquiries" USING btree ("updated_at");
  CREATE INDEX "inquiries_created_at_idx" ON "inquiries" USING btree ("created_at");
  CREATE INDEX "inquiries_texts_order_parent" ON "inquiries_texts" USING btree ("order","parent_id");
  CREATE INDEX "site_settings_product_info_tabs_order_idx" ON "site_settings_product_info_tabs" USING btree ("_order");
  CREATE INDEX "site_settings_product_info_tabs_parent_id_idx" ON "site_settings_product_info_tabs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_product_info_tabs_locales_locale_parent_id_uni" ON "site_settings_product_info_tabs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_product_info_tabs_locales_parent_id_idx" ON "site_settings_product_info_tabs_locales" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_inquiries_fk" FOREIGN KEY ("inquiries_id") REFERENCES "public"."inquiries"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_inquiries_id_idx" ON "payload_locked_documents_rels" USING btree ("inquiries_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "inquiries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "inquiries_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_product_info_tabs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_product_info_tabs_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "inquiries" CASCADE;
  DROP TABLE "inquiries_texts" CASCADE;
  DROP TABLE "site_settings_product_info_tabs" CASCADE;
  DROP TABLE "site_settings_product_info_tabs_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_inquiries_fk";
  
  DROP INDEX "payload_locked_documents_rels_inquiries_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "inquiries_id";
  DROP TYPE "public"."enum_inquiries_type";
  DROP TYPE "public"."enum_inquiries_status";`)
}
