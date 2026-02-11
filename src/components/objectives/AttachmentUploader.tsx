import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Paperclip, X, FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttachmentUploaderProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  className?: string;
}

export function AttachmentUploader({
  files,
  onChange,
  maxFiles = 5,
  className,
}: AttachmentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    const combined = [...files, ...newFiles].slice(0, maxFiles);
    onChange(combined);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => inputRef.current?.click()}
          disabled={files.length >= maxFiles}
        >
          <Paperclip className="h-3 w-3" />
          Anexar ({files.length}/{maxFiles})
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleAdd}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
        />
      </div>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {files.map((file, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="gap-1 text-[10px] pr-1"
            >
              {file.type.startsWith("image/") ? (
                <ImageIcon className="h-3 w-3" />
              ) : (
                <FileText className="h-3 w-3" />
              )}
              <span className="max-w-[100px] truncate">{file.name}</span>
              <span className="text-muted-foreground">({formatSize(file.size)})</span>
              <button
                onClick={() => handleRemove(i)}
                className="ml-0.5 p-0.5 rounded-full hover:bg-destructive/20 transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
