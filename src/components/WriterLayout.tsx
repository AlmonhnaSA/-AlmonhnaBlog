import { ReactNode, useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LayoutDashboard, FileText, Newspaper, User, LogOut, Settings, Home, Quote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WriterLayoutProps {
  children: ReactNode;
}

export const WriterLayout = ({ children }: WriterLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isWriter, setIsWriter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ name: string; photo_url?: string } | null>(null);

  useEffect(() => {
    checkWriter();
  }, []);

  const checkWriter = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "writer")
        .single();

      if (!roles) {
        toast({
          title: "غير مصرح",
          description: "ليس لديك صلاحيات الوصول لهذه الصفحة",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("name, photo_url")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setProfile({ name: profileData.name, photo_url: profileData.photo_url || undefined });
      }

      setIsWriter(true);
    } catch (error) {
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const menuItems = [
    { path: "/writer", icon: LayoutDashboard, label: "لوحة التحكم" },
    { path: "/writer/articles", icon: FileText, label: "مقالاتي" },
    { path: "/writer/news", icon: Newspaper, label: "خدماتي" },
    { path: "/writer/quotes", icon: Quote, label: "بطاقة اقتباس" },
    { path: "/writer/profile", icon: User, label: "الملف الشخصي" },
    { path: "/writer/settings", icon: Settings, label: "الإعدادات" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">جاري التحميل...</div>
      </div>
    );
  }

  if (!isWriter) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-l min-h-screen p-6">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b">
              <Avatar className="h-12 w-12">
                <AvatarImage src={profile?.photo_url} alt={profile?.name} />
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{profile?.name || "الكاتب"}</h3>
                <p className="text-xs text-muted-foreground">كاتب</p>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-primary">لوحة الكاتب</h2>
          </div>

          <nav className="space-y-2">
  <Button
              variant="ghost"
              className="w-full justify-start mt-4"
              onClick={() => navigate("/")}
            >
              <Home className="w-5 h-5 ml-3" />
              العودة للرئيسية
            </Button>
            
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className="w-full justify-start"
                  >
                    <Icon className="w-5 h-5 ml-3" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}

          

            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 ml-3" />
              تسجيل الخروج
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
};

export default WriterLayout;
