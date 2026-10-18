import { test, expect } from 'bun:test';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
test('writer cannot use media_save to approve own content or change profile privilege',async()=>{
  const db=new PGlite();
  try {
    await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA auth;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT '00000000-0000-4000-8000-000000000001'::uuid $$;
      CREATE FUNCTION public.has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
      CREATE TABLE profiles(id uuid PRIMARY KEY,user_id uuid,photo_url text,status text,updated_at timestamptz default now());
      CREATE TABLE articles(id uuid PRIMARY KEY default gen_random_uuid(),status text,author_id uuid,content text,updated_at timestamptz default now());`);
    await db.exec(await readFile('docs/media-storage/prepare.sql','utf8'));
    await expect(db.query(`SELECT media_save('articles',NULL,'{"status":"approved"}','{}',NULL)`)).rejects.toThrow('writer_status_required');
    await db.exec(`INSERT INTO profiles(id,user_id,status) VALUES('00000000-0000-4000-8000-000000000002',auth.uid(),'pending');`);
    await expect(db.query(`SELECT media_save('profiles','00000000-0000-4000-8000-000000000002','{"status":"approved"}','{}',(SELECT updated_at FROM profiles LIMIT 1))`)).rejects.toThrow('protected_profile_field');
    const row=await db.query<{status:string}>(`SELECT status FROM profiles`);expect(row.rows[0].status).toBe('pending');
  } finally {await db.close();}
},30000);