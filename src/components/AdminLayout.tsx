import { ReactNode, useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Menu, X, LayoutDashboard, FileText, Newspaper, Users, Package, LogOut, UserCog, Settings, Home, ShoppingBag, ClipboardList, Tags, Sparkles, MessageCircleQuestion, GitBranch, Quote, Hash, AudioLines } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminLayoutProps {
  children: ReactNode;
}


export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
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
        .eq("role", "admin")
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

      setIsAdmin(true);
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
    { path: "/admin", icon: LayoutDashboard, label: "لوحة التحكم" },
    { path: "/admin/articles", icon: FileText, label: "المقالات" },
    { path: "/admin/news", icon: Newspaper, label: "خدماتنا" },
    { path: "/admin/service-requests", icon: ClipboardList, label: "طلبات الخدمات" },
    { path: "/admin/categories", icon: Tags, label: "مربع المنحنى" },
    { path: "/admin/daily-stories", icon: Sparkles, label: "مقال اليوم" },
    { path: "/admin/questions", icon: MessageCircleQuestion, label: "أسئلة الجمهور" },
    { path: "/admin/timelines", icon: GitBranch, label: "خطوط المُنحنى" },
    { path: "/admin/numbers", icon: Hash, label: "الرقم" },
    { path: "/admin/audio", icon: AudioLines, label: "مسموع" },
    { path: "/admin/quotes", icon: Quote, label: "بطاقات الاقتباس" },

    { path: "/admin/products", icon: Package, label: "المنتجات" },
    { path: "/admin/store", icon: ShoppingBag, label: "المتجر" },
    { path: "/admin/store/requests", icon: ClipboardList, label: "طلبات المنتجات" },
    { path: "/admin/users", icon: UserCog, label: "المستخدمين" },
    { path: "/admin/settings", icon: Settings, label: "الإعدادات" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">جاري التحميل...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between gap-3 border-b bg-card px-4 py-3">
        <h2 className="text-lg font-bold text-primary">لوحة الإدارة</h2>
        <Button variant="ghost" size="icon" aria-label="القائمة" onClick={() => setMenuOpen(true)}>
          <Menu className="w-6 h-6" />
        </Button>
      </header>
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-foreground/40" onClick={() => setMenuOpen(false)} />
      )}
      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] overflow-y-auto bg-card border-l p-6 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:translate-x-0 ${menuOpen ? "translate-x-0" : "translate-x-full"}`}>
          <Button variant="ghost" size="icon" aria-label="إغلاق القائمة" className="lg:hidden absolute left-3 top-3" onClick={() => setMenuOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-primary">لوحة الإدارة</h2>
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
        <main className="dashboard-main flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
