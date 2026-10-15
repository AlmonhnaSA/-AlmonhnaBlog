import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Upload, Link } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AudioUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export const AudioUpload = ({ value, onChange, label = "ملف الصوت" }: AudioUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [useUrl, setUseUrl] = useState(true);
  const { toast } = useToast();

  const [progress, setProgress] = useState(0);

  const call = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("r2-audio-upload", { body });
    if (error) {
      const ctx: any = (error as any).context;
      const details = ctx?.json ? await ctx.json().catch(() => null) : null;
      throw new Error(details?.error || error.message);
    }
    return data;
  };

  const putWithProgress = (url: string, file: File, contentType: string) =>
    new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", contentType);
      xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`upload_${xhr.status}`)));
      xhr.onerror = () => reject(new Error("upload_network"));
      xhr.send(file);
    });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      toast({ title: "خطأ", description: "الرجاء اختيار ملف صوتي", variant: "destructive" });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "خطأ", description: "حجم الملف يجب أن يكون أقل من 50 ميجابايت", variant: "destructive" });
      return;
    }
    let key = "";
    try {
      setUploading(true);
      setProgress(0);
      const signed = await call({ action: "sign", contentType: file.type, size: file.size });
      key = signed.key;
      await putWithProgress(signed.uploadUrl, file, signed.contentType);
      const verified = await call({ action: "verify", key });
      // Replace an earlier, never-saved upload so it does not occupy storage.
      const previous = value && value !== verified.publicUrl ? value : "";
      onChange(verified.publicUrl);
      if (previous.startsWith("https://audio.almonhna.sa/episodes/uploads/")) {
        call({ action: "discard", key: previous.slice("https://audio.almonhna.sa/".length) }).catch(() => {});
      }
      toast({ title: "تم الرفع بنجاح", description: "اضغطي «حفظ» لربط الملف بالحلقة" });
    } catch (error) {
      console.error("Error uploading audio:", error);
      if (key) call({ action: "discard", key }).catch(() => {});
      const msg = (error as Error).message;
      const description =
        msg === "forbidden" ? "الرفع متاح للإدارة فقط" :
        msg === "too_large" ? "حجم الملف يجب أن يكون أقل من 50 ميجابايت" :
        msg === "unsupported_type" ? "نوع الملف الصوتي غير مدعوم" :
        "فشل رفع الملف الصوتي";
      toast({ title: "خطأ", description, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium">{label}</label>
      <div className="flex gap-2">
        <Button type="button" variant={useUrl ? "default" : "outline"} size="sm" onClick={() => setUseUrl(true)} className="flex-1">
          <Link className="ml-2 h-4 w-4" /> رابط
        </Button>
        <Button type="button" variant={!useUrl ? "default" : "outline"} size="sm" onClick={() => setUseUrl(false)} className="flex-1">
          <Upload className="ml-2 h-4 w-4" /> رفع ملف
        </Button>
      </div>

      {useUrl ? (
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://example.com/audio.mp3" dir="ltr" className="h-9" />
      ) : (
        <div className="space-y-2">
          <Input type="file" accept="audio/*" onChange={handleFileUpload} disabled={uploading} className="cursor-pointer h-9" />
          {uploading && <p className="text-xs text-muted-foreground">جاري الرفع... {progress}%</p>}
        </div>
      )}

      {value && !uploading && <audio src={value} controls className="w-full h-9" />}
    </div>
  );
};

export default AudioUpload;
