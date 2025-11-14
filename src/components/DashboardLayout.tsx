import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, CheckSquare, CalendarDays, LogOut, Shield, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: "events" | "approvals" | "calendar";
}

const DashboardLayout = ({ children, activeTab }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          navigate("/auth");
          return;
        }
        setUser(JSON.parse(userStr));
      } catch {
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = async () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
    navigate("/auth");
  };

  const NavButton = ({
    icon: Icon,
    label,
    value,
    onClick
  }: {
    icon: any;
    label: string;
    value: "events" | "approvals" | "calendar";
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all w-full text-left",
        activeTab === value
          ? "bg-primary text-primary-foreground shadow-md"
          : "hover:bg-secondary text-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Sistema de Eventos</h1>
              <p className="text-sm text-muted-foreground">Gestão de Calendário</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-12 w-12 rounded-full">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-2">
                  <p className="text-sm font-medium">{user.full_name || "Usuário"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {user.role === "supervisor" || user.role === "admin" ? (
                      <div className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        <Shield className="h-3 w-3" />
                        {user.role === "admin" ? "Admin" : "Supervisor"}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                        <User className="h-3 w-3" />
                        Coordenador
                      </div>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 flex gap-6">
        <aside className="w-64 flex-shrink-0">
          <nav className="bg-card rounded-lg border border-border p-4 space-y-2 sticky top-24 shadow-sm">
            <NavButton
              icon={Calendar}
              label="Meus Eventos"
              value="events"
              onClick={() => navigate("/dashboard")}
            />
            {(user.role === "supervisor" || user.role === "admin") && (
              <NavButton
                icon={CheckSquare}
                label="Aprovações Pendentes"
                value="approvals"
                onClick={() => navigate("/dashboard/approvals")}
              />
            )}
            <NavButton
              icon={CalendarDays}
              label="Visualizar Calendário"
              value="calendar"
              onClick={() => navigate("/dashboard/calendar")}
            />
          </nav>
        </aside>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
