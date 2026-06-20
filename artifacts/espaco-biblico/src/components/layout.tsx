import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { removeToken } from "@/lib/auth";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  Building2, 
  History, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/presenca", label: "Presença", icon: CheckSquare },
  { href: "/criancas", label: "Crianças", icon: Users },
  { href: "/congregacoes", label: "Congregações", icon: Building2 },
  { href: "/historico", label: "Histórico", icon: History },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: user, error, isError } = useGetMe({ 
    query: { 
      retry: false 
    } 
  });

  useEffect(() => {
    if (isError) {
      removeToken();
      setLocation("/login");
    }
  }, [isError, setLocation]);

  const handleLogout = () => {
    removeToken();
    setLocation("/login");
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-20">
        <div className="flex items-center gap-2 text-primary font-bold text-lg">
          <BookOpen className="w-6 h-6" />
          <span>EBI Check-in</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out
        md:translate-x-0 md:static md:block
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 hidden md:flex items-center gap-3 text-primary font-bold text-xl">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <BookOpen className="w-6 h-6" />
            </div>
            <span>EBI</span>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = location === item.href || location.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href}>
                  <a 
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                      active 
                        ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </a>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            <div className="px-3 py-2 mb-2">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <Button 
              variant="outline" 
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 md:hidden" 
          onClick={closeMobileMenu}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden min-h-[100dvh]">
        <div className="p-4 md:p-8 max-w-6xl mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
