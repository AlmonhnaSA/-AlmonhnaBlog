import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import { AuthVisual } from "@/components/auth/AuthVisual";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) setReady(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "خطأ", description: "كلمتا المرور غير متطابقتين", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "تم تحديث كلمة المرور", description: "يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة" });
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      <main className="auth-page-shell">
        <AuthVisual mode="login" />
        <section className="auth-form-pane">
          <Card className="auth-form-card w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">تعيين كلمة مرور جديدة</CardTitle>
              <CardDescription>
                {ready ? "أدخل كلمة المرور الجديدة لحسابك" : "افتح هذه الصفحة من الرابط المرسل إلى بريدك الإلكتروني"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ready ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                    <Input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                    <Input id="confirm-password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "جاري التحديث..." : "حفظ كلمة المرور"}
                  </Button>
                </form>
              ) : (
                <Button className="w-full" variant="outline" onClick={() => navigate("/auth")}>
                  العودة لتسجيل الدخول
                </Button>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default ResetPassword;
