import { expect, test } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
test("staged transactions retain old reference on failed children; safe saves commit", async () => {
  const db = new PGlite();
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT '00000000-0000-4000-8000-000000000001'::uuid $$;
    CREATE FUNCTION public.has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
    CREATE TABLE public.store_products(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, image_url text NOT NULL, updated_at timestamptz DEFAULT now());
    CREATE TABLE public.store_product_images(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),store_product_id uuid REFERENCES store_products(id) ON DELETE CASCADE,image_url text NOT NULL,display_order int);
    CREATE TABLE public.store_product_files(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),store_product_id uuid REFERENCES store_products(id), file_url text NOT NULL,file_name text NOT NULL,file_size bigint);
  `);
  await db.exec(await readFile("docs/media-storage/prepare.sql", "utf8"));
  const id = "00000000-0000-4000-8000-000000000002";
  await db.query("INSERT INTO store_products(id,name,image_url) VALUES($1,'old','old.png')", [id]);
  const revision = await db.query<{ updated_at: Date }>("SELECT updated_at FROM store_products WHERE id=$1", [id]);
  const args = [id, JSON.stringify({ name: "new", image_url: "new.png" }), revision.rows[0].updated_at.toISOString()];
  await expect(db.query("SELECT media_save('store_products',$1,$2::jsonb,'{\"store_product_images\":[{\"image_url\":null}]}'::jsonb,$3::timestamptz)", args)).rejects.toThrow();
  const retained = await db.query<{ image_url: string }>("SELECT image_url FROM store_products WHERE id=$1", [id]);
  expect(retained.rows[0].image_url).toBe("old.png");
  await db.query("SELECT media_save('store_products',$1,$2::jsonb,'{\"store_product_images\":[{\"image_url\":\"new.png\"}]}'::jsonb,$3::timestamptz)", args);
  const saved = await db.query<{ image_url: string }>("SELECT image_url FROM store_products WHERE id=$1", [id]);
  expect(saved.rows[0].image_url).toBe("new.png");
  await expect(db.query("SELECT media_save('store_products',$1,'{\"name\":\"stale\"}', '{}','2000-01-01')", [id])).rejects.toThrow();
  await db.close();
}, 30000);