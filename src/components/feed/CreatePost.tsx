import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Image, Smile, Award, Send } from "lucide-react";
import { useState } from "react";

export function CreatePost() {
  const [content, setContent] = useState("");

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar className="h-10 w-10 shrink-0 ring-2 ring-border">
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" />
            <AvatarFallback className="bg-primary/10 text-primary">U</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="O que você gostaria de compartilhar?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[80px] resize-none border-transparent bg-secondary/50 focus:border-primary/30 focus:bg-background"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary">
                  <Image className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-warning">
                  <Smile className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-accent">
                  <Award className="h-5 w-5" />
                </Button>
              </div>
              <Button 
                disabled={!content.trim()} 
                className="gap-2 bg-gradient-primary hover:opacity-90 transition-opacity"
              >
                <Send className="h-4 w-4" />
                Publicar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
