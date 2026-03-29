import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, User, LogOut, LayoutDashboard, Bookmark } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import finalLogo1 from "@/assets/finalLogo1.png";
import finalLogo from "@/assets/logo.svg";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
export const Header = () => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setProfile(null);
        setUserRoles([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      if (profileData) {
        setProfile(profileData);
      }

      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      
      if (rolesData) {
        setUserRoles(rolesData.map(r => r.role));
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "تم تسجيل الخروج بنجاح",
    });
    navigate("/");
  };


  const handleProductsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.location.pathname === "/") {
      // Already on home page, just scroll
      const productsSection = document.getElementById("products-section");
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      // Navigate to home page first, then scroll
      navigate("/");
      setTimeout(() => {
        const productsSection = document.getElementById("products-section");
        if (productsSection) {
          productsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
  e.preventDefault();

  if (window.location.pathname === "/") {
    // إذا أصلاً في الهوم → بس scroll لفوق
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    // إذا مش في الهوم → روح عالهوم وبعدين اطلع لفوق
    navigate("/");

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  }
};

  const navItems = [
     { label: "الرئيسية ", href: "/" , onClick: handleLogoClick },
        { label: "الأعمدة ", href: "#products", onClick: handleProductsClick },
    { label: "خدماتنا", href: "/news" },
    { label: "المقالات", href: "/articles" },
    // { label: "المحفوظات", href: "/bookmarks" },
    { label: "المتجر", href: "/store" },
  ];

  return (
    <header style={{backgroundColor:'#f6f4ee'}} className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-8">
            <Link onClick={handleLogoClick}
              to="/" className="flex items-center gap-3">
              <img src={finalLogo} alt="منحنى" className="h-14 w-14 rounded-full object-cover" style={{width: '11rem'}} />
              
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                item.onClick ? (
                 <Link
  key={item.href}
  to={item.href}
  onClick={item.onClick}
  className="text-foreground transition-colors font-medium"
>
  {item.label}
</Link>

                ) : (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="text-foreground  transition-colors font-medium"
                  >
                    {item.label}
                  </Link>
                )
              ))}
            </nav>
          </div>

          
          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.photo_url} alt={profile?.name || user.email} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56" style={{textAlign:'right'}}>
                  <DropdownMenuLabel className="font-normal" style={{textAlign:'right'}}>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.name || "الحساب"}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {userRoles.includes("admin") && (
                    <DropdownMenuItem onClick={() => navigate("/admin")} style={{justifySelf:'right'}}>
                      <span>لوحة تحكم الأدمن</span>
                      <LayoutDashboard className="ml-2 h-4 w-4" />
                    </DropdownMenuItem>
                  )}
                  {userRoles.includes("writer") && (
                    <DropdownMenuItem onClick={() => navigate("/writer")} style={{justifySelf:'right'}}>
                      <span>لوحة تحكم الكاتب</span>
                      <LayoutDashboard className="ml-2 h-4 w-4" />
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleSignOut} style={{justifySelf:'right'}}>
                    <span>تسجيل الخروج</span>
                                        <LogOut className="ml-2 h-4 w-4" />

                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link to="/auth">تسجيل الدخول</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">سجل عبر</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => (
                  item.onClick ? (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => {
                        item.onClick(e);
                        setOpen(false);
                      }}
                      className="text-lg font-medium hover:text-primary transition-colors cursor-pointer"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setOpen(false)}
                      className="text-lg font-medium hover:text-primary transition-colors"
                    >
                      {item.label}
                    </Link>
                  )
                ))}
                <div className="flex flex-col gap-3 mt-4">
                  {user ? (
                    <>
                      <span className="text-sm text-muted-foreground px-3">{profile?.name || user.email}</span>
                      {userRoles.includes("admin") && (
                        <Button onClick={() => { navigate("/admin"); setOpen(false); }} variant="outline">
                          لوحة تحكم الأدمن
                        </Button>
                      )}
                      {userRoles.includes("writer") && (
                        <Button onClick={() => { navigate("/writer"); setOpen(false); }} variant="outline">
                          لوحة تحكم الكاتب
                        </Button>
                      )}
                      <Button onClick={() => { handleSignOut(); setOpen(false); }} variant="outline">
                        تسجيل الخروج
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button asChild variant="outline">
                        <Link to="/auth" onClick={() => setOpen(false)}>
                          تسجيل الدخول
                        </Link>
                      </Button>
                      <Button asChild>
                        <Link to="/register" onClick={() => setOpen(false)}>
                          اكتب معنا
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
