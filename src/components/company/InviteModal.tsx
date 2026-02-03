import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Upload, UserPlus, Calendar } from "lucide-react";

interface InviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite?: (emails: string[], role: string, newHireData?: {
    isNewHire: boolean;
    hireDate?: Date;
    employmentType?: string;
  }) => void;
}

export function InviteModal({ open, onOpenChange, onInvite }: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [bulkEmails, setBulkEmails] = useState("");
  const [role, setRole] = useState("member");
  
  // New hire fields
  const [isNewHire, setIsNewHire] = useState(false);
  const [hireDate, setHireDate] = useState("");
  const [employmentType, setEmploymentType] = useState<string>("");

  const resetForm = () => {
    setEmail("");
    setBulkEmails("");
    setRole("member");
    setIsNewHire(false);
    setHireDate("");
    setEmploymentType("");
  };

  const getNewHireData = () => {
    if (!isNewHire) return undefined;
    return {
      isNewHire: true,
      hireDate: hireDate ? new Date(hireDate) : new Date(),
      employmentType: employmentType || "colaborador",
    };
  };

  const handleSingleInvite = () => {
    if (email) {
      onInvite?.([email], role, getNewHireData());
      resetForm();
      onOpenChange(false);
    }
  };

  const handleBulkInvite = () => {
    const emails = bulkEmails
      .split(/[\n,;]/)
      .map((e) => e.trim())
      .filter((e) => e && e.includes("@"));
    
    if (emails.length > 0) {
      onInvite?.(emails, role, getNewHireData());
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Convidar Membros
          </DialogTitle>
          <DialogDescription>
            Convide novos membros para sua empresa
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single" className="gap-2">
              <Mail className="h-4 w-4" />
              Individual
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-2">
              <Upload className="h-4 w-4" />
              Em Massa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="colaborador@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="manager">Gestor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* New Hire Section */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-new-hire"
                  checked={isNewHire}
                  onCheckedChange={(checked) => setIsNewHire(!!checked)}
                />
                <Label htmlFor="is-new-hire" className="font-medium cursor-pointer">
                  Novo colaborador (receberá feedback de 30 dias)
                </Label>
              </div>

              {isNewHire && (
                <div className="space-y-3 ml-6">
                  <div className="space-y-2">
                    <Label htmlFor="hire-date" className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Data de início
                    </Label>
                    <Input
                      id="hire-date"
                      type="date"
                      value={hireDate}
                      onChange={(e) => setHireDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employment-type">Tipo de vínculo</Label>
                    <Select value={employmentType} onValueChange={setEmploymentType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="colaborador">Colaborador</SelectItem>
                        <SelectItem value="prestador">Prestador de Serviço</SelectItem>
                        <SelectItem value="estagiario">Estagiário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSingleInvite} disabled={!email}>
                Enviar Convite
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="emails">Emails (um por linha ou separados por vírgula)</Label>
              <Textarea
                id="emails"
                placeholder="email1@empresa.com&#10;email2@empresa.com&#10;email3@empresa.com"
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                {bulkEmails.split(/[\n,;]/).filter((e) => e.trim() && e.includes("@")).length} emails detectados
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-role">Função padrão</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="manager">Gestor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* New Hire Section for Bulk */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-new-hire-bulk"
                  checked={isNewHire}
                  onCheckedChange={(checked) => setIsNewHire(!!checked)}
                />
                <Label htmlFor="is-new-hire-bulk" className="font-medium cursor-pointer">
                  Novos colaboradores (receberão feedback de 30 dias)
                </Label>
              </div>

              {isNewHire && (
                <div className="space-y-3 ml-6">
                  <div className="space-y-2">
                    <Label htmlFor="hire-date-bulk" className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Data de início
                    </Label>
                    <Input
                      id="hire-date-bulk"
                      type="date"
                      value={hireDate}
                      onChange={(e) => setHireDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employment-type-bulk">Tipo de vínculo</Label>
                    <Select value={employmentType} onValueChange={setEmploymentType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="colaborador">Colaborador</SelectItem>
                        <SelectItem value="prestador">Prestador de Serviço</SelectItem>
                        <SelectItem value="estagiario">Estagiário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleBulkInvite} disabled={!bulkEmails.trim()}>
                Enviar Convites
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
