import { useState } from "react";
import { Check, ChevronsUpDown, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface PickableUser {
  id: string;
  full_name: string | null;
  avatar_url?: string | null;
}

interface UserPickerProps {
  users: PickableUser[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  excludeIds?: string[];
}

function initialsOf(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UserPicker({
  users,
  value,
  onChange,
  placeholder = "Selecione uma pessoa",
  disabled,
  excludeIds = [],
}: UserPickerProps) {
  const [open, setOpen] = useState(false);
  const filtered = users.filter((u) => !excludeIds.includes(u.id));
  const selected = users.find((u) => u.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          {selected ? (
            <span className="flex items-center gap-2 truncate">
              <Avatar className="h-5 w-5">
                <AvatarImage src={selected.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {initialsOf(selected.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{selected.full_name || "Sem nome"}</span>
            </span>
          ) : (
            <span className="flex items-center gap-2 text-muted-foreground">
              <UserIcon className="h-4 w-4" />
              {placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Buscar pelo nome..." />
          <CommandList>
            <CommandEmpty>Ninguém encontrado.</CommandEmpty>
            <CommandGroup>
              {filtered.map((u) => (
                <CommandItem
                  key={u.id}
                  value={u.full_name || u.id}
                  onSelect={() => {
                    onChange(u.id);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={u.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[10px]">
                      {initialsOf(u.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{u.full_name || "Sem nome"}</span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === u.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
