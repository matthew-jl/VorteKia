// src/components/chat-message.tsx
"use client";
import { formatDistanceToNow } from "date-fns";
import { Message } from "@/types"; // Import Message type from "@/types"

interface ChatMessageProps {
  message: Message; // Use Message interface from "@/types"
  isOwnMessage: boolean;
}

export function ChatMessage({ message, isOwnMessage }: ChatMessageProps) {
  // Format the timestamp
  const formattedTime = formatDistanceToNow(new Date(message.timestamp), {
    addSuffix: true,
    includeSeconds: true,
  });

  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] ${isOwnMessage ? "order-1" : "order-none"}`}>
        {!isOwnMessage ? (
          <div className="text-sm font-medium mb-1">
            Staff {message.sender_id}
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <div
            className={`rounded-lg p-3 ${
              isOwnMessage
                ? "bg-primary text-primary-foreground rounded-tr-none"
                : "bg-muted rounded-tl-none"
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{message.text}</p>{" "}
            {/* Use message.text */}
          </div>
        </div>
        <div
          className={`text-xs text-muted-foreground mt-1 ${
            isOwnMessage ? "text-right" : "text-left"
          }`}
        >
          {formattedTime}
        </div>
      </div>
    </div>
  );
}
