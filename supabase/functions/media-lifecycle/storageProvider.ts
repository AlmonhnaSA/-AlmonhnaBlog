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
      if (data || !infoError || !["404", "NotFound"].includes(status)) throw new Error("absence_unconfirmed");
    },
  };
}