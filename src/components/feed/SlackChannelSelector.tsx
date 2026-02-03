import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSlackChannels } from "@/hooks/useSlackChannels";
import { Hash, Loader2 } from "lucide-react";

interface SlackChannelSelectorProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  channelId: string | null;
  onChannelChange: (channelId: string) => void;
}

// Slack icon SVG component - using forwardRef for compatibility with Radix
const SlackIcon = React.forwardRef<SVGSVGElement, { className?: string }>(
  ({ className, ...props }, ref) => (
    <svg
      ref={ref}
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  )
);
SlackIcon.displayName = "SlackIcon";

export function SlackChannelSelector({
  enabled,
  onEnabledChange,
  channelId,
  onChannelChange,
}: SlackChannelSelectorProps) {
  const { data: channels, isLoading, isError } = useSlackChannels();
  
  // Filter only channels where the bot is a member
  const availableChannels = channels?.filter(ch => ch.is_member) || [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className={enabled ? "text-[#4A154B] bg-[#4A154B]/10" : "text-muted-foreground"}
        >
          <SlackIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlackIcon className="h-4 w-4 text-[#4A154B]" />
              <span className="text-sm font-medium">Enviar para Slack</span>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={onEnabledChange}
            />
          </div>

          {enabled && (
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">
                Selecione o canal
              </label>
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : isError ? (
                <p className="text-xs text-destructive">
                  Erro ao carregar canais. Verifique a configuração do Slack.
                </p>
              ) : availableChannels.length > 0 ? (
                <Select value={channelId || ""} onValueChange={onChannelChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um canal" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableChannels.map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        <div className="flex items-center gap-1">
                          <Hash className="h-3 w-3 text-muted-foreground" />
                          {channel.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : channels && channels.length > 0 ? (
                <p className="text-xs text-warning">
                  O bot não foi adicionado a nenhum canal. Adicione o bot a um canal no Slack para enviar mensagens.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Nenhum canal encontrado. Verifique se o bot foi adicionado ao workspace.
                </p>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
