import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ImageUpload";

export const WriterProfile = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    photo_url: "",
    linkedin_url: "",
    twitter_url: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        photo_url: profile.photo_url || "",
        linkedin_url: profile.linkedin_url || "",
        twitter_url: profile.twitter_url || "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate bio length
    if (formData.bio && formData.bio.length > 300) {
      toast({
        title: "خطأ",
        description: "النبذة يجب ألا تتعدى 300 حرف",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        name: formData.name,
        phone: formData.phone,
        bio: formData.bio,
        photo_url: formData.photo_url,
        linkedin_url: formData.linkedin_url,
        twitter_url: formData.twitter_url,
      })
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث البيانات",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم التحديث",
        description: "تم تحديث بياناتك بنجاح",
      });
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">الملف الشخصي</h1>

      <Card>
        <CardHeader>
          <CardTitle>تعديل البيانات الشخصية</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>الاسم الكامل</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="الاسم الكامل"
                required
              />
            </div>

            <div>
              <Label>البريد الإلكتروني</Label>
              <Input
                value={formData.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                لا يمكن تعديل البريد الإلكتروني
              </p>
            </div>

            <div>
              <Label>رقم الهاتف</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="رقم الهاتف"
                type="tel"
              />
            </div>

            <div>
              <Label>نبذة عنك (حد أقصى 300 حرف)</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="نبذة مختصرة عنك"
                rows={3}
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.bio.length} / 300 حرف
              </p>
            </div>

            <ImageUpload
              value={formData.photo_url}
              onChange={(url) => setFormData({ ...formData, photo_url: url })}
              label="الصورة الشخصية"
            />

            <div>
              <Label>رابط حساب LinkedIn</Label>
              <Input
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/username"
                type="url"
              />
            </div>

            <div>
              <Label>رابط حساب Twitter</Label>
              <Input
                value={formData.twitter_url}
                onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                placeholder="https://twitter.com/username"
                type="url"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "جاري الحفظ..." : "حفظ التعديلات"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default WriterProfile;
