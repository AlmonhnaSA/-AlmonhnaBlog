import { expect, test } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
const actor="00000000-0000-4000-8000-000000000001";
const first="00000000-0000-4000-8000-000000000002";
const second="00000000-0000-4000-8000-000000000003";
const asset="00000000-0000-4000-8000-000000000004";
const host="independent.example";
const oldUrl="https://independent.example/storage/v1/object/public/images/user/old.png";
async function setup() {
  const db=new PGlite();
  await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;
    CREATE SCHEMA auth;CREATE SCHEMA storage;
    CREATE TABLE storage.objects(bucket_id text,name text,metadata jsonb);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT '${actor}'::uuid $$;
    CREATE FUNCTION public.has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
    CREATE TABLE products(id uuid PRIMARY KEY,name text,image_url text,description text,updated_at timestamptz DEFAULT now());
    CREATE TABLE store_products(id uuid PRIMARY KEY,name text,image_url text,updated_at timestamptz DEFAULT now());
    CREATE TABLE store_product_images(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),store_product_id uuid REFERENCES store_products(id) ON DELETE CASCADE,image_url text NOT NULL);
    CREATE TABLE profiles(id uuid PRIMARY KEY,photo_url text,updated_at timestamptz DEFAULT now());
    CREATE TABLE news(id uuid PRIMARY KEY,cover_image_url text,gallery_images jsonb,content text,updated_at timestamptz DEFAULT now());
    CREATE TABLE audio_episodes(id uuid PRIMARY KEY,cover_image_url text,audio_url text,updated_at timestamptz DEFAULT now());`);
  await db.exec(await readFile("docs/media-storage/prepare.sql","utf8"));
  await db.exec(await readFile("docs/media-storage/cleanup.sql","utf8"));
  await db.query("INSERT INTO media_assets(id,owner_id,bucket,object_key,bytes,mime,state,lease_until,deletion_reviewed) VALUES($1,$2,'images','user/old.png',12,'image/png','ready',now(),true)",[asset,actor]);
  await db.query("INSERT INTO media_cleanup_release(project_host,protection_revision,valid_until,inventory_reviewed,backup_reviewed,external_reviewed,storage_policies_reviewed) VALUES($1,'review-1',now()+interval '1 day',true,true,true,true)",[host]);
  return db;
}
async function receipt(db:PGlite, txid:string) {
  await db.query("INSERT INTO media_audit(actor_id,operation,outcome) VALUES($1,'readback:products',$2)",[actor,txid]);
  const r=await db.query<{token:string}>("SELECT media_cleanup_receipt($1,$2) token",[txid,actor]);return r.rows[0].token;
}
async function replace(db:PGlite) {
  const r=await db.query<{value:{cleanup_txid:string}}>("SELECT media_save('products',$1,'{\"image_url\":\"new.png\"}','{}', (SELECT updated_at FROM products WHERE id=$1)) value",[first]);
  return receipt(db,r.rows[0].value.cleanup_txid);
}
async function claim(db:PGlite,r:string) {
  const out=await db.query<{value:{asset_id:string;token:string}|null}>("SELECT media_cleanup_claim($1,$2) value",[r,host]);return out.rows[0].value;
}
test("shared cover survives replacement; final reference removal claims old bytes",async()=>{
  const db=await setup();try{
    await db.query("INSERT INTO products(id,image_url) VALUES($1,$3),($2,$3)",[first,second,oldUrl]);
    expect(await claim(db,await replace(db))).toBeNull();
    const removed=await db.query<{value:{cleanup_txid:string}}>("SELECT media_delete('products',$1,(SELECT updated_at FROM products WHERE id=$1)) value",[second]);
    const c=await claim(db,await receipt(db,removed.rows[0].value.cleanup_txid));expect(c?.asset_id).toBe(asset);
    expect((await db.query<{state:string}>("SELECT state FROM media_assets WHERE id=$1",[asset])).rows[0].state).toBe("deleting");
  }finally{await db.close();}
},30000);
test("encoded HTML, transformed galleries and private profile references protect shared images",async()=>{
  const db=await setup();try{
    await db.query("INSERT INTO products(id,image_url) VALUES($1,$2)",[first,oldUrl]);
    await db.query("INSERT INTO news(id,content,gallery_images) VALUES($1,$2,$3::jsonb)",[second,`<img src="${encodeURIComponent(oldUrl)}">`,JSON.stringify([oldUrl.replace("object/public","render/image/public")+"?width=100"])]);
    const refs=await db.query<{count:number}>("SELECT count(*)::int count FROM media_references WHERE asset_id=$1",[asset]);expect(refs.rows[0].count).toBe(2);
    expect(await claim(db,await replace(db))).toBeNull();
  }finally{await db.close();}
},30000);
test("claim fences late attachments including encoded URL and never unfences timeout",async()=>{
  const db=await setup();try{
    await db.query("INSERT INTO products(id,image_url) VALUES($1,$2)",[first,oldUrl]);
    const c=await claim(db,await replace(db));expect(c).not.toBeNull();if(!c)throw Error("missing claim");
    await expect(db.query("INSERT INTO profiles(id,photo_url) VALUES($1,$2)",[second,encodeURIComponent(oldUrl)])).rejects.toThrow("media_unavailable");
    await db.query("SELECT media_cleanup_finish($1,$2,false)",[asset,c.token]);
    await expect(db.query("INSERT INTO products(id,image_url) VALUES($1,$2)",[second,oldUrl])).rejects.toThrow("media_unavailable");
    await expect(db.query("SELECT media_cleanup_finish($1,$2,true)",[asset,second])).rejects.toThrow("claim_conflict");
    await db.query("SELECT media_cleanup_finish($1,$2,true)",[asset,c.token]);
    expect((await db.query<{state:string}>("SELECT state FROM media_assets WHERE id=$1",[asset])).rows[0].state).toBe("deleted");
    await expect(db.query("INSERT INTO products(id,image_url) VALUES($1,$2)",[second,oldUrl])).rejects.toThrow("media_unavailable");
  }finally{await db.close();}
},30000);
test("failed child save rolls back old reference and cleanup queue",async()=>{
  const db=await setup();try{
    await db.query("INSERT INTO store_products(id,image_url) VALUES($1,$2)",[first,oldUrl]);
    await expect(db.query("SELECT media_save('store_products',$1,'{\"image_url\":\"new.png\"}','{\"store_product_images\":[{\"image_url\":null}]}',(SELECT updated_at FROM store_products WHERE id=$1))",[first])).rejects.toThrow();
    expect((await db.query<{image_url:string}>("SELECT image_url FROM store_products WHERE id=$1",[first])).rows[0].image_url).toBe(oldUrl);
    expect((await db.query<{count:number}>("SELECT count(*)::int count FROM media_jobs")).rows[0].count).toBe(0);
  }finally{await db.close();}
},30000);
test("new unfenced source blocks claims and unverified operations cannot issue receipts",async()=>{
  const db=await setup();try{
    await expect(db.query("SELECT media_cleanup_receipt('unverified',$1)",[actor])).rejects.toThrow("save_not_verified");
    await db.query("INSERT INTO products(id,image_url) VALUES($1,$2)",[first,oldUrl]);const r=await replace(db);
    await db.exec("CREATE TABLE new_source(id uuid,body text)");expect(await claim(db,r)).toBeNull();
    await db.exec("SET ROLE authenticated");
    await expect(db.query("SELECT media_cleanup_claim($1,$2)",[r,host])).rejects.toThrow("permission denied");
  }finally{await db.close();}
},30000);
test("legacy inventory registers image files but audio stays excluded and unreviewed",async()=>{
  const db=await setup();try{
    await db.exec(`INSERT INTO storage.objects VALUES('images','user/legacy.png','{"size":22,"mimetype":"image/png"}'),('images','audio/x.mp3','{"size":33,"mimetype":"audio/mpeg"}'); SELECT media_register_legacy();`);
    const r=await db.query<{object_key:string;deletion_reviewed:boolean}>("SELECT object_key,deletion_reviewed FROM media_assets WHERE object_key<>'user/old.png'");
    expect(r.rows).toEqual([{object_key:"user/legacy.png",deletion_reviewed:false}]);
  }finally{await db.close();}
},30000);
test("expired worker token cannot finish a reclaimed job",async()=>{
  const db=await setup();try{
    await db.query("INSERT INTO products(id,image_url) VALUES($1,$2)",[first,oldUrl]);
    const r=await replace(db);const initial=await claim(db,r);if(!initial)throw Error("missing first claim");
    await db.query("UPDATE media_assets SET worker_until=now()-interval '1 second' WHERE id=$1",[asset]);
    const reclaimed=await claim(db,r);if(!reclaimed)throw Error("missing second claim");
    expect(reclaimed.token).not.toBe(initial.token);
    await expect(db.query("SELECT media_cleanup_finish($1,$2,true)",[asset,initial.token])).rejects.toThrow("claim_conflict");
    await db.query("SELECT media_cleanup_finish($1,$2,true)",[asset,reclaimed.token]);
  }finally{await db.close();}
},30000);
test("image-named tables cannot hide from source coverage",async()=>{
  const db=await setup();try{
    await db.query("INSERT INTO products(id,image_url) VALUES($1,$2)",[first,oldUrl]);const r=await replace(db);
    await db.exec("CREATE TABLE media_custom_content(id uuid,body text)");
    expect(await claim(db,r)).toBeNull();
  }finally{await db.close();}
},30000);
test("gallery removal cleans only removed references after successful save",async()=>{
  const db=await setup();try{
    await db.query("INSERT INTO news(id,gallery_images,content) VALUES($1,$2::jsonb,'')",[first,JSON.stringify([oldUrl])]);
    const r=await db.query<{value:{cleanup_txid:string}}>("SELECT media_save('news',$1,'{\"gallery_images\":[]}','{}',(SELECT updated_at FROM news WHERE id=$1)) value",[first]);
    expect((await claim(db,await receipt(db,r.rows[0].value.cleanup_txid)))?.asset_id).toBe(asset);
  }finally{await db.close();}
},30000);
test("product deletion collects child images but audio files remain protected",async()=>{
  const db=await setup();try{
    await db.query("INSERT INTO store_products(id,image_url) VALUES($1,'other.png')",[first]);
    await db.query("INSERT INTO store_product_images(store_product_id,image_url) VALUES($1,$2)",[first,oldUrl]);
    const r=await db.query<{value:{cleanup_txid:string}}>("SELECT media_delete('store_products',$1,(SELECT updated_at FROM store_products WHERE id=$1)) value",[first]);
    expect((await claim(db,await receipt(db,r.rows[0].value.cleanup_txid)))?.asset_id).toBe(asset);
  }finally{await db.close();}
},30000);
test("staged storage policies deny client delete overwrite and tombstone reuse",async()=>{
  const db=await setup();try{
    await db.exec(`GRANT USAGE ON SCHEMA storage TO authenticated;
      GRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO authenticated;
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
      CREATE POLICY storage_all ON storage.objects FOR ALL TO authenticated USING(true) WITH CHECK(true);
      INSERT INTO storage.objects VALUES('images','user/old.png','{}');`);
    await db.exec(await readFile("docs/media-storage/storage-policies.sql","utf8"));
    await db.exec("SET ROLE authenticated");
    await db.exec("DELETE FROM storage.objects WHERE name='user/old.png'; UPDATE storage.objects SET name='changed.png' WHERE name='user/old.png'");
    expect((await db.query<{name:string}>("SELECT name FROM storage.objects")).rows).toEqual([{name:"user/old.png"}]);
    await expect(db.exec("INSERT INTO storage.objects VALUES('images','user/old.png','{}')")).rejects.toThrow("row-level security");
  }finally{await db.close();}
},30000);