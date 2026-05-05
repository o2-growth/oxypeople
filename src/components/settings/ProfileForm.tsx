import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Loader2, Save } from "lucide-react";
import { useUpdateUser, useUser } from "@/hooks/useUser";
import { useToast } from "@/hooks/use-toast";

interface ProfileFormProps {
  user?: {
    name: string;
    email: string;
    avatar: string;
    initials: string;
    bio: string;
    phone: string;
    department: string;
    position: string;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const { profile } = useUser();
  const updateUser = useUpdateUser();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    bio: user?.bio ?? "",
    phone: user?.phone ?? "",
    department: user?.department ?? "",
    position: user?.position ?? "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        bio: user.bio,
        phone: user.phone,
        department: user.department,
        position: user.position,
      });
    }
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!profile?.id) {
      toast({
        title: "Erro",
        description: "Perfil não carregado.",
        variant: "destructive",
      });
      return;
    }

    const existingMetadata = (profile.metadata as Record<string, unknown> | null) ?? {};
    try {
      await updateUser.mutateAsync({
        full_name: formData.name.trim() || null,
        metadata: {
          ...existingMetadata,
          phone: formData.phone || null,
          department: formData.department || null,
          position: formData.position || null,
          bio: formData.bio || null,
        },
      });
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações do Perfil</CardTitle>
        <CardDescription>
          Atualize suas informações pessoais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-24 w-24 ring-4 ring-primary/20">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {user?.initials || "U"}
              </AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              variant="secondary"
              className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
              type="button"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <p className="font-medium text-foreground">{formData.name || "Sem nome"}</p>
            <p className="text-sm text-muted-foreground">{formData.email}</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Departamento</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => handleChange("department", e.target.value)}
              placeholder="Ex: Tecnologia"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="position">Cargo</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => handleChange("position", e.target.value)}
              placeholder="Ex: Desenvolvedor Senior"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              placeholder="Conte um pouco sobre você..."
              className="min-h-[100px]"
            />
          </div>
        </div>

        <Button
          className="gap-2"
          type="button"
          onClick={handleSave}
          disabled={updateUser.isPending}
        >
          {updateUser.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {updateUser.isPending ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </CardContent>
    </Card>
  );
}
