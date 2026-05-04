import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserCellProps {
  user: { id: string; full_name: string | null; avatar_url: string | null } | null;
  fallbackText?: string;
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

export function UserCell({ user, fallbackText = "—" }: UserCellProps) {
  if (!user) {
    return <span className="text-xs text-muted-foreground">{fallbackText}</span>;
  }
  return (
    <span className="flex items-center gap-2">
      <Avatar className="h-6 w-6 shrink-0">
        <AvatarImage src={user.avatar_url ?? undefined} />
        <AvatarFallback className="text-[10px]">{initialsOf(user.full_name)}</AvatarFallback>
      </Avatar>
      <span className="truncate text-sm">{user.full_name || "Sem nome"}</span>
    </span>
  );
}
