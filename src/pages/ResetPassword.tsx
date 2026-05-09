import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button as O2Button } from "@/components/o2/Button";
import { O2Logo } from "@/components/o2/Logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [linkInvalid, setLinkInvalid] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        if (!cancelled) {
          setReady(true);
          setLinkInvalid(false);
        }
      }
    });

    const init = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const errorDesc = url.searchParams.get("error_description") || url.hash.includes("error");
      const hash = window.location.hash;
      const isRecoveryHash = hash.includes("type=recovery") && hash.includes("access_token");

      if (errorDesc && !code) {
        if (!cancelled) setLinkInvalid(true);
        return;
      }

      // Fluxo PKCE: ?code=...
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (error) {
          setLinkInvalid(true);
        } else {
          setReady(true);
          // Limpa a query string da URL
          window.history.replaceState({}, "", url.pathname);
        }
        return;
      }

      // Fluxo implícito antigo: #access_token=...&type=recovery
      if (isRecoveryHash) {
        // O SDK processa automaticamente; aguarda o evento via onAuthStateChange.
        // Como fallback, checa sessão após pequeno delay.
        setTimeout(async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!cancelled && session) setReady(true);
          else if (!cancelled && !session) setLinkInvalid(true);
        }, 1500);
        return;
      }

      // Sessão pré-existente
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) setReady(true);
      else setLinkInvalid(true);
    };

    init();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast({
        title: "Senha muito curta",
        description: "A senha precisa ter pelo menos 8 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirm) {
      toast({
        title: "Senhas não coincidem",
        description: "Confirme a nova senha corretamente.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast({
          title: "Erro ao redefinir senha",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Senha redefinida!",
        description: "Faça login com sua nova senha.",
      });

      await supabase.auth.signOut();
      navigate("/auth", { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex animate-fade-in">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `
            linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-accent-glow p-2.5">
              <O2Logo variant="icon" forceTheme="dark" className="h-full w-full" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold text-white">Oxy People</h1>
              <p className="text-white/70">by O2 Inc</p>
            </div>
          </div>

          <h2 className="text-4xl lg:text-5xl font-heading font-bold text-white leading-tight mb-6">
            Defina sua <span className="text-primary">nova senha</span>
          </h2>

          <p className="text-lg text-white/80 max-w-md">
            Use uma senha forte e única para proteger sua conta.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-accent-glow p-2">
              <O2Logo variant="icon" forceTheme="dark" className="h-full w-full" />
            </div>
            <span className="text-2xl font-heading font-bold">Oxy People</span>
          </div>

          <Card className="border-0 shadow-xl animate-slide-up">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-heading">Nova senha</CardTitle>
              <CardDescription>
                {linkInvalid
                  ? "Link inválido ou expirado. Solicite um novo link de recuperação."
                  : "Escolha uma nova senha de pelo menos 8 caracteres."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {linkInvalid ? (
                <O2Button
                  type="button"
                  variant="primary"
                  onClick={() => navigate("/auth/reset")}
                >
                  Pedir novo link
                </O2Button>
              ) : !ready ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Validando link...
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Nova senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                        required
                        minLength={8}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirmar senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="confirm"
                        type="password"
                        placeholder="••••••••"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                        required
                        minLength={8}
                      />
                    </div>
                  </div>

                  <O2Button type="submit" variant="primary" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Redefinir senha
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </O2Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
