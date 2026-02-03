import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { Building2, Users } from "lucide-react";
import { useMentionSuggestions, type MentionUser, type MentionDepartment } from "@/hooks/useMentionSuggestions";

export interface MentionData {
  type: "user" | "department" | "everyone";
  id?: string;
  name: string;
}

interface MentionSelectorProps {
  open: boolean;
  searchText: string;
  onSelect: (mention: MentionData) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
}

export function MentionSelector({
  open,
  searchText,
  onSelect,
  onClose,
  anchorRef,
}: MentionSelectorProps) {
  const { data: suggestions, isLoading } = useMentionSuggestions(searchText);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const handleSelectUser = (user: MentionUser) => {
    onSelect({
      type: "user",
      id: user.id,
      name: user.full_name || user.email.split("@")[0],
    });
  };

  const handleSelectDepartment = (dept: MentionDepartment) => {
    onSelect({
      type: "department",
      id: dept.id,
      name: dept.name,
    });
  };

  const handleSelectEveryone = () => {
    onSelect({
      type: "everyone",
      name: "todos",
    });
  };

  const showEveryone = !searchText || "todos".includes(searchText.toLowerCase());
  const hasUsers = suggestions?.users && suggestions.users.length > 0;
  const hasDepartments = suggestions?.departments && suggestions.departments.length > 0;
  const hasResults = hasUsers || hasDepartments || showEveryone;

  if (!open) return null;

  return (
    <Popover open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <PopoverAnchor asChild>
        <span ref={anchorRef as React.RefObject<HTMLSpanElement>} className="absolute" />
      </PopoverAnchor>
      <PopoverContent 
        className="w-72 p-0" 
        align="start" 
        side="bottom"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Carregando...
              </div>
            ) : !hasResults ? (
              <CommandEmpty>Nenhum resultado encontrado</CommandEmpty>
            ) : (
              <>
                {/* Opção @todos */}
                {showEveryone && (
                  <CommandGroup heading="Empresa">
                    <CommandItem onSelect={handleSelectEveryone} className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">@todos</p>
                          <p className="text-xs text-muted-foreground">
                            Mencionar toda a empresa
                          </p>
                        </div>
                      </div>
                    </CommandItem>
                  </CommandGroup>
                )}

                {/* Pessoas */}
                {hasUsers && (
                  <CommandGroup heading="Pessoas">
                    {suggestions.users.slice(0, 5).map((user) => (
                      <CommandItem
                        key={user.id}
                        onSelect={() => handleSelectUser(user)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {getInitials(user.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.full_name || user.email}</p>
                            {user.full_name && (
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Departamentos */}
                {hasDepartments && (
                  <CommandGroup heading="Departamentos">
                    {suggestions.departments.slice(0, 5).map((dept) => (
                      <CommandItem
                        key={dept.id}
                        onSelect={() => handleSelectDepartment(dept)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="h-8 w-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${dept.color}20` }}
                          >
                            <Building2
                              className="h-4 w-4"
                              style={{ color: dept.color || undefined }}
                            />
                          </div>
                          <p className="font-medium">{dept.name}</p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
