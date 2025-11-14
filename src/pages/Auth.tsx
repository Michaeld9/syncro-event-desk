import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/integrations/api";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("auth_token");
      if (token) {
        try {
          await authApi.verify();
          navigate("/dashboard");
        } catch {
          localStorage.removeItem("auth_token");
          setIsAuthenticating(false);
        }
      } else {
        setIsAuthenticating(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authApi.loginLocal(adminEmail, adminPassword);
      const { user, token } = response.data;

      localStorage.setItem("auth_token", token);
      localStorage.setItem("user", JSON.stringify(user));

      toast({
        title: "Bem-vindo",
        description: `Login realizado como ${user.email}`,
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: error.response?.data?.error || "Email ou senha inválidos",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = "openid email profile";
    const responseType = "code";

    if (!clientId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Google OAuth não configurado",
      });
      return;
    }

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.append("client_id", clientId);
    authUrl.searchParams.append("redirect_uri", redirectUri);
    authUrl.searchParams.append("response_type", responseType);
    authUrl.searchParams.append("scope", scope);
    authUrl.searchParams.append("access_type", "offline");
    authUrl.searchParams.append("prompt", "consent");

    window.location.href = authUrl.toString();
  };

  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Sistema de Eventos</CardTitle>
          <CardDescription className="text-base">
            Gerencie e aprove eventos do calendário institucional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="google" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="google">Google</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>

            <TabsContent value="google" className="space-y-4">
              <Button
                onClick={handleGoogleLogin}
                className="w-full h-12 text-base font-medium"
                size="lg"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Entrar com Google
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Ao fazer login, você concorda em conectar sua conta Google
              </p>
            </TabsContent>

            <TabsContent value="admin" className="space-y-4">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@app.local"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Senha</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Entrar como Admin"}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground text-center">
                Credenciais padrão: admin@app.local / admin123
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
