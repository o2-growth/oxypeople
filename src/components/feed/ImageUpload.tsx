import { Button } from "@/components/ui/button";
import { Image, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function ImageUploadButton({ 
  onUpload, 
  disabled,
}: { 
  onUpload: (urls: string[]) => void;
  disabled?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files).slice(0, 4)) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} não é uma imagem válida`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} é muito grande (máximo 5MB)`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('post-attachments')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Erro ao enviar ${file.name}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('post-attachments')
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      if (uploadedUrls.length > 0) {
        onUpload(uploadedUrls);
        toast.success(`${uploadedUrls.length} imagem(ns) adicionada(s)`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao fazer upload das imagens');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        disabled={isUploading || disabled}
      />
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-9 w-9 text-muted-foreground hover:text-primary"
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading || disabled}
      >
        {isUploading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Image className="h-5 w-5" />
        )}
      </Button>
    </>
  );
}
