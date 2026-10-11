import { useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { compressImage } from "@/lib/imageOptimizer";
import { FileText, ImagePlus, X, ArrowUp, ArrowDown } from "lucide-react";

export const MAX_GALLERY_IMAGES = 20;

interface Props {
  images: string[];
  onImagesChange: (urls: string[]) => void;
  title: string;
  onTitleChange: (t: string) => void;
  pdfUrl: string;
  onPdfUrlChange: (u: string) => void;
}

const uploadBlob = async (userId: string, blob: Blob, ext: string) => {
  const name = `${userId}/gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("images").upload(name, blob, { contentType: blob.type });
  if (error) throw error;
  return supabase.storage.from("images").getPublicUrl(name).data.publicUrl;
};

const pdfToImages = async (file: File, max: number, onProgress: (p: string) => void) => {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const count = Math.min(pdf.numPages, max);
  const blobs: Blob[] = [];
  for (let i = 1; i <= count; i++) {
    onProgress(`تحويل الصفحة ${i} من ${count}...`);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.6 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
    blobs.push(await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), "image/jpeg", 0.85)));
  }
  return blobs;
};

export const GalleryUpload = ({ images, onImagesChange, title, onTitleChange, pdfUrl, onPdfUrlChange }: Props) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string>("");

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error("يجب تسجيل الدخول أولاً");
    return data.user.id;
  };

  const remaining = MAX_GALLERY_IMAGES - images.length;

  const handleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    e.target.value = "";
    if (!files.length) return;
    if (files.length > remaining) {
      toast({ title: "تنبيه", description: `يمكن إضافة ${remaining} صور فقط (الحد ${MAX_GALLERY_IMAGES})` });
    }
    try {
      const uid = await getUser();
      const urls: string[] = [];
      const list = files.slice(0, remaining);
      for (let i = 0; i < list.length; i++) {
        if (list[i].size > 5 * 1024 * 1024) continue;
        setBusy(`رفع الصورة ${i + 1} من ${list.length}...`);
        const f = await compressImage(list[i]);
        urls.push(await uploadBlob(uid, f, f.name.split(".").pop() || "jpg"));
      }
      onImagesChange([...images, ...urls]);
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message || "فشل رفع الصور", variant: "destructive" });
    } finally {
      setBusy("");
    }
  };

  const handlePdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ title: "خطأ", description: "الرجاء اختيار ملف PDF", variant: "destructive" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "خطأ", description: "حجم الملف يجب أن يكون أقل من 20 ميجابايت", variant: "destructive" });
      return;
    }
    if (remaining <= 0) return;
    try {
      const uid = await getUser();
      setBusy("رفع الملف...");
      const fileUrl = await uploadBlob(uid, file, "pdf");
      const blobs = await pdfToImages(file, remaining, setBusy);
      const urls: string[] = [];
      for (let i = 0; i < blobs.length; i++) {
        setBusy(`رفع الصفحة ${i + 1} من ${blobs.length}...`);
        urls.push(await uploadBlob(uid, blobs[i], "jpg"));
      }
      onImagesChange([...images, ...urls]);
      onPdfUrlChange(fileUrl);
      toast({ title: "تم", description: `تمت إضافة ${urls.length} صفحة` });
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message || "فشل تحويل الملف", variant: "destructive" });
    } finally {
      setBusy("");
    }
  };

  const move = (i: number, d: number) => {
    const next = [...images];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onImagesChange(next);
  };

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div>
        <Label>معرض الصفحات (اختياري)</Label>
        <p className="text-xs text-muted-foreground mt-1">
          ارفع حتى {MAX_GALLERY_IMAGES} صورة، أو ملف PDF تتحول صفحاته إلى صور. لتصاميم Canva: صدّر التصميم كـ PDF أو صور ثم ارفعه هنا.
        </p>
      </div>
      <Input value={title} onChange={(e) => onTitleChange(e.target.value)} placeholder="عنوان المعرض، مثل: كيف تعمل في القطاع المالي؟" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border p-3 text-sm cursor-pointer hover:bg-muted">
          <ImagePlus className="h-4 w-4" /> رفع صور
          <input type="file" accept="image/*" multiple hidden onChange={handleImages} disabled={!!busy || remaining <= 0} />
        </label>
        <label className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border p-3 text-sm cursor-pointer hover:bg-muted">
          <FileText className="h-4 w-4" /> رفع ملف PDF / Canva
          <input type="file" accept="application/pdf" hidden onChange={handlePdf} disabled={!!busy || remaining <= 0} />
        </label>
      </div>
      {busy && <p className="text-sm text-muted-foreground">{busy}</p>}
      {pdfUrl && (
        <div className="flex items-center justify-between text-sm">
          <a href={pdfUrl} target="_blank" rel="noreferrer" className="text-primary underline">ملف PDF مرفق للتحميل</a>
          <Button type="button" size="sm" variant="ghost" onClick={() => onPdfUrlChange("")}>إزالة</Button>
        </div>
      )}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {images.map((url, i) => (
            <div key={url} className="relative group rounded-md overflow-hidden border border-border">
              <img src={url} alt={`صفحة ${i + 1}`} className="w-full aspect-[4/3] object-cover" />
              <span className="absolute top-1 right-1 rounded bg-background/90 px-1.5 text-xs">{i + 1}</span>
              <div className="absolute bottom-1 left-1 flex gap-1">
                <button type="button" onClick={() => move(i, -1)} className="rounded bg-background/90 p-0.5"><ArrowUp className="h-3 w-3" /></button>
                <button type="button" onClick={() => move(i, 1)} className="rounded bg-background/90 p-0.5"><ArrowDown className="h-3 w-3" /></button>
                <button type="button" onClick={() => onImagesChange(images.filter((_, k) => k !== i))} className="rounded bg-destructive p-0.5 text-destructive-foreground"><X className="h-3 w-3" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GalleryUpload;
