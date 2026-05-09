import { useState } from "react";
import { Link } from "react-router-dom";
import { Button as O2Button } from "@/components/o2/Button";
import { O2Logo } from "@/components/o2/Logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      // Sempre mostrar sucesso para não permitir enumeração de usuários
      setSent(true);
      toast({
        title: "Verifique seu e-mail",
        description: "Se este e-mail existir, enviamos um link para redefinir a senha.",
      });
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
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />

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
            Esqueceu sua <span className="text-primary">senha</span>?
          </h2>

          <p className="text-lg text-white/80 max-w-md">
            Sem problema. Informe seu e-mail e enviaremos um link seguro para você criar uma nova senha.
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
              <CardTitle className="text-2xl font-heading">Recuperar senha</CardTitle>
              <CardDescription>
                {sent
                  ? "Enviamos um link de redefinição para o e-mail informado (se ele estiver cadastrado)."
                  : "Informe seu e-mail e enviaremos um link para redefinir sua senha."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!sent ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  <O2Button type="submit" variant="primary" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Enviar link
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </O2Button>
                </form>
              ) : (
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Confira sua caixa de entrada (e a pasta de spam).</p>
                  <p>O link expira em 1 hora.</p>
                </div>
              )}

              <div className="mt-6 text-center">
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Voltar ao login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
