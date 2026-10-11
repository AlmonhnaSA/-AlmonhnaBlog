import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { AuthVisual } from "@/components/auth/AuthVisual";
const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // التسجيل في النظام - الـ trigger سيضيف البيانات تلقائياً
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name,
            bio,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        toast({
          title: "تم التسجيل بنجاح",
          description: "سيتم مراجعة حسابك من قبل الإدارة",
        });

        navigate("/auth");
      }
    } catch (error: any) {
      toast({
        title: "خطأ في التسجيل",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="auth-page-shell">
        <AuthVisual mode="register" />
        <section className="auth-form-pane">
        <Card className="auth-form-card w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">سجّل في المُنحنى</CardTitle>
            <CardDescription className="text-center">
              سجّل ككاتب وابدأ بنشر مقالاتك وأخبارك
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم الكامل</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="أدخل اسمك الكامل"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">نبذة عنك (حد أقصى 150 حرف)</Label>
                <Textarea
                  id="bio"
                  placeholder="اكتب نبذة مختصرة عنك وعن خبراتك"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  maxLength={150}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {bio.length} / 150 حرف
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "جاري التسجيل..." : "تسجيل"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                لديك حساب بالفعل؟{" "}
                <Link to="/auth" className="text-primary hover:underline">
                  تسجيل الدخول
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
        </section>
      </main>
    </div>
  );
};

export default Register;
