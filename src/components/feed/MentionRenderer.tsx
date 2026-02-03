import { cn } from "@/lib/utils";
import { Fragment } from "react";

interface MentionRendererProps {
  content: string;
  className?: string;
}

export function MentionRenderer({ content, className }: MentionRendererProps) {
  // Regex to find @mentions (word characters after @)
  const mentionRegex = /@(\w+(?:\s+\w+)?)/g;
  
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    // Add the highlighted mention
    const mentionText = match[0];
    const mentionName = match[1];
    
    parts.push(
      <span
        key={keyIndex++}
        className={cn(
          "font-medium text-primary cursor-pointer hover:underline",
          mentionName.toLowerCase() === "todos" && "text-accent"
        )}
      >
        {mentionText}
      </span>
    );

    lastIndex = match.index + mentionText.length;
  }

  // Add remaining text after last mention
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  // If no mentions found, return plain text
  if (parts.length === 0) {
    return <span className={className}>{content}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) => (
        <Fragment key={index}>{part}</Fragment>
      ))}
    </span>
  );
}
