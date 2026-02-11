import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CheckinAttachment {
  id: string;
  checkin_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string | null;
  created_at: string;
}

export function useCheckinAttachments(checkinId?: string) {
  return useQuery({
    queryKey: ["checkin-attachments", checkinId],
    queryFn: async (): Promise<CheckinAttachment[]> => {
      if (!checkinId) return [];

      const { data, error } = await supabase
        .from("checkin_attachments")
        .select("*")
        .eq("checkin_id", checkinId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as CheckinAttachment[];
    },
    enabled: !!checkinId,
  });
}

export function useUploadCheckinAttachments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      checkinId,
      files,
    }: {
      checkinId: string;
      files: File[];
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const results: CheckinAttachment[] = [];

      for (const file of files) {
        // Validate size: 10MB for files, 5MB for images
        const maxSize = file.type.startsWith("image/") ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
          throw new Error(
            `Arquivo "${file.name}" excede o limite de ${file.type.startsWith("image/") ? "5MB" : "10MB"}`
          );
        }

        const ext = file.name.split(".").pop() || "bin";
        const path = `${user.id}/${checkinId}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("checkin-attachments")
          .upload(path, file, { contentType: file.type });

        if (uploadError) throw uploadError;

        const { data: attachment, error: insertError } = await supabase
          .from("checkin_attachments")
          .insert({
            checkin_id: checkinId,
            file_path: path,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type || null,
          } as any)
          .select()
          .single();

        if (insertError) throw insertError;
        results.push(attachment as CheckinAttachment);
      }

      return results;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["checkin-attachments", variables.checkinId],
      });
    },
  });
}

export function getAttachmentUrl(filePath: string): string {
  const { data } = supabase.storage
    .from("checkin-attachments")
    .getPublicUrl(filePath);
  return data.publicUrl;
}

export async function getSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("checkin-attachments")
    .createSignedUrl(filePath, 3600);

  if (error) throw error;
  return data.signedUrl;
}
