import { ReactNode, useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, Newspaper, Users, Package, LogOut, UserCog, Settings, Home, ShoppingBag, ClipboardList } from "lucide-react";
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
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-l min-h-screen p-6">
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
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
