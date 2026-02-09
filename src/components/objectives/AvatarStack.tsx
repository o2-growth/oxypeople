import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AvatarUser {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
  email: string;
}

interface AvatarStackProps {
  users: AvatarUser[];
  max?: number;
  size?: "sm" | "md";
  className?: string;
}

export function AvatarStack({ users, max = 3, size = "sm", className }: AvatarStackProps) {
  const shown = users.slice(0, max);
  const remaining = users.length - max;
  const sizeClass = size === "md" ? "h-7 w-7" : "h-5 w-5";
  const textSize = size === "md" ? "text-[10px]" : "text-[8px]";

  return (
    <div className={cn("flex -space-x-1.5", className)}>
      {shown.map((user) => (
        <Avatar key={user.id} className={cn(sizeClass, "border-2 border-background")}>
          <AvatarImage src={user.avatar_url || ""} />
          <AvatarFallback className={cn(textSize, "bg-primary/10 text-primary")}>
            {(user.full_name || user.email).charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ))}
      {remaining > 0 && (
        <Avatar className={cn(sizeClass, "border-2 border-background")}>
          <AvatarFallback className={cn(textSize, "bg-muted text-muted-foreground")}>
            +{remaining}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
