import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import type { MediaStorageProvider } from "../_shared/mediaCleanup.ts";

/** R2 can implement this contract later; audio is not handled here. */
export function cloudImageProvider(client: SupabaseClient): MediaStorageProvider {
  return {
    async removeAndVerify(claim) {
      if (!["images", "store-files"].includes(claim.bucket)) throw new Error("bucket_not_allowed");
      const storage = client.storage.from(claim.bucket);
      const { error } = await storage.remove([claim.object_key]);
      if (error) throw new Error("storage_delete_failed");
      const { data, error: infoError } = await storage.info(claim.object_key);
      // Network/permission failures are not proof of absence.
      const status = String((infoError as { status?: unknown; statusCode?: unknown } | null)?.statusCode ?? (infoError as { status?: unknown } | null)?.status ?? "");
      const message = String((infoError as { message?: unknown } | null)?.message ?? "");
      if (data || !infoError || !["404", "NotFound"].includes(status) || !/^(object not found|the resource was not found)$/i.test(message)) throw new Error("absence_unconfirmed");
      // Confirm the bucket/path endpoint still works; a missing route/bucket
      // must not masquerade as an absent object.
      const slash = claim.object_key.lastIndexOf("/");
      const folder = slash < 0 ? "" : claim.object_key.slice(0, slash);
      const name = claim.object_key.slice(slash + 1);
      const { data: listed, error: listError } = await storage.list(folder, { search: name, limit: 100 });
      if (listError || !listed || listed.some(object => object.name === name)) throw new Error("absence_unconfirmed");
    },
  };
}