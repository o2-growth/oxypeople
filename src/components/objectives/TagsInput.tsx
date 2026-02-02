import { useState, KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { X, Plus, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagsInputProps {
  value: string[];
  onValueChange: (tags: string[]) => void;
  placeholder?: string;
}

const PRESET_TAGS = [
  "Aspiracional",
  "Compromissada",
  "Estratégico",
  "Tático",
  "Operacional",
];

export function TagsInput({
  value,
  onValueChange,
  placeholder = "Adicionar etiqueta",
}: TagsInputProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleAddTag = (tag: string) => {
    const normalizedTag = tag.trim();
    if (normalizedTag && !value.includes(normalizedTag)) {
      onValueChange([...value, normalizedTag]);
    }
    setInputValue("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onValueChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag(inputValue);
    }
  };

  const availablePresets = PRESET_TAGS.filter((tag) => !value.includes(tag));

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1"
            >
              <Tag className="h-3.5 w-3.5" />
              <span>{placeholder}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nova etiqueta..."
                  className="h-8 text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-8"
                  onClick={() => handleAddTag(inputValue)}
                  disabled={!inputValue.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {availablePresets.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Sugestões:</p>
                  <div className="flex flex-wrap gap-1">
                    {availablePresets.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent text-xs"
                        onClick={() => {
                          handleAddTag(tag);
                          setOpen(false);
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="flex items-center gap-1 pr-1"
            >
              <span className="text-xs">{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
