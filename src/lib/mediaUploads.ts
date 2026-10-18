import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "./imageOptimizer";
import { validateMediaUpload } from "../../supabase/functions/_shared/mediaValidation";
import { mediaCapabilities } from "./mediaMutations";

let activeUploads = 0;
export const mediaUploadInProgress = () => activeUploads > 0;
export async function uploadMedia(file: File, purpose: "image" | "gallery-pdf" | "attachment", progress?: (percent: number) => void): Promise<string> {
  activeUploads++;
  try {
    if (purpose !== "attachment") validateMediaUpload({ size: file.size, type: file.type, purpose });
    const optimized = purpose === "image" ? await compressImage(file) : file;
    if (!(await mediaCapabilities())) {
      // Existing preview remains usable until the separately approved deployment.
      // Never deletes old files and never enables cleanup on this legacy path.
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) throw new Error("يجب تسجيل الدخول أولًا");
      const bucket = purpose === "attachment" ? "store-files" : "images";
      const extension = optimized.name.split(".").pop() || "bin";
      const path = `${session.user.id}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from(bucket).upload(path, optimized, { upsert: false, contentType: optimized.type });
      if (error) throw new Error("فشل رفع الملف");
      progress?.(100);
      return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    }
    const { data: ticket, error } = await supabase.functions.invoke("media-lifecycle", { body: { action: "sign", type: optimized.type || "application/octet-stream", size: optimized.size, purpose } });
    if (error || !ticket?.token || !ticket?.path || !ticket?.bucket || !ticket?.id) throw new Error("الرفع الآمن ينتظر تفعيل الخدمة؛ لم تُغيّر الملفات القديمة.");
    const { error: uploadError } = await supabase.storage.from(ticket.bucket).uploadToSignedUrl(ticket.path, ticket.token, optimized, { contentType: optimized.type, upsert: false });
    if (uploadError) throw new Error("فشل رفع الملف الجديد");
    progress?.(90);
    const { data: verified, error: verifyError } = await supabase.functions.invoke("media-lifecycle", { body: { action: "verify", id: ticket.id } });
    if (verifyError || !verified?.url) throw new Error("تعذّر التحقق من الرفع؛ لا تحفظ حتى ينجح التحقق.");
    progress?.(100);
    return verified.url;
  } finally { activeUploads--; }
}