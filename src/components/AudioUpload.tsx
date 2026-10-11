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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("audio/")) {
        toast({ title: "خطأ", description: "الرجاء اختيار ملف صوتي", variant: "destructive" });
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast({ title: "خطأ", description: "حجم الملف يجب أن يكون أقل من 50 ميجابايت", variant: "destructive" });
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast({ title: "خطأ", description: "يجب تسجيل الدخول أولاً", variant: "destructive" });
        return;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `audio/${userData.user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("images").upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(fileName);
      onChange(publicUrl);
      toast({ title: "تم الرفع بنجاح", description: "تم رفع الملف الصوتي" });
    } catch (error) {
      console.error("Error uploading audio:", error);
      toast({ title: "خطأ", description: "فشل رفع الملف الصوتي", variant: "destructive" });
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
          {uploading && <p className="text-xs text-muted-foreground">جاري الرفع...</p>}
        </div>
      )}

      {value && !uploading && <audio src={value} controls className="w-full h-9" />}
    </div>
  );
};

export default AudioUpload;
