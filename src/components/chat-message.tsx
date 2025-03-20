import { formatDistanceToNow } from "date-fns";

interface Message {
  message_id: string;
  chat_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  timestamp: string;
}

interface ChatMessageProps {
  message: Message;
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
        {!isOwnMessage && (
          <div className="text-sm font-medium mb-1">{message.sender_name}</div>
        )}
        <div className="flex items-end gap-2">
          <div
            className={`rounded-lg p-3 ${
              isOwnMessage
                ? "bg-primary text-primary-foreground rounded-tr-none"
                : "bg-muted rounded-tl-none"
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
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
