// src/pages/group-chat-page.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { StaffNavbar } from "@/components/staff-navbar";
import { StaffUserProvider, useStaffUser } from "@/context/staff-user-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, Users } from "lucide-react";
import { ChatMessage } from "@/components/chat-message";

import {
  ApiResponse,
  Chat,
  Message as MessageType,
  MessageWithSenderName,
} from "@/types"; // Import Chat and Message types from "@/types"
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { LoadingScreen } from "@/components/loading-screen";
import { AccessRequiredScreen } from "@/components/access-required-screen";

function GroupChatPageUI() {
  const navigate = useNavigate();
  const { isLoggedIn, staffId, staffName } = useStaffUser();
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<MessageWithSenderName[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [pollingMessages, setPollingMessages] = useState(false); // Tracks polling without showing loading screen
  const messageInputRef = useRef<HTMLInputElement>(null);
  const prevMessagesLengthRef = useRef(0);

  useEffect(() => {
    setLoading(false);
  }, [isLoggedIn]);

  // Fetch group chats
  const fetchGroupChats = useCallback(async () => {
    if (!staffId) return;

    try {
      setLoading(true);
      const response = await invoke<ApiResponse<Chat[]>>("view_chats", {
        userId: staffId,
      });
      if (response.status === "success") {
        setChats(response.data || []);
      } else {
        console.error("Failed to fetch group chats:", response.message);
        toast.error(response.message || "Failed to fetch group chats");
      }
    } catch (error: any) {
      console.error("Error fetching group chats:", error);
      toast.error("Error fetching group chats: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  const fetchMessages = useCallback(
    async (isInitialLoad: boolean = false) => {
      if (!selectedChat) return;

      try {
        if (isInitialLoad) setLoading(true);
        else setPollingMessages(true);
        const response = await invoke<ApiResponse<MessageWithSenderName[]>>(
          "get_messages",
          {
            chatId: selectedChat.chat_id,
          }
        );

        if (response.status === "success") {
          const newMessages = response.data || [];
          setMessages(response.data || []);
          // Scroll only if new messages are added
          if (newMessages.length > prevMessagesLengthRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }
          prevMessagesLengthRef.current = newMessages.length;
        } else {
          console.error("Failed to fetch messages:", response.message);
          toast.error(response.message || "Failed to fetch messages");
        }
      } catch (error: any) {
        console.error("Error fetching messages:", error);
        if (isInitialLoad)
          toast.error("Error fetching messages: " + error.message);
      } finally {
        if (isInitialLoad) setLoading(false);
        else setPollingMessages(false);
      }
    },
    [selectedChat]
  );

  // Initial fetch group chats
  useEffect(() => {
    if (isLoggedIn()) {
      fetchGroupChats();
    }
  }, [isLoggedIn, fetchGroupChats]);

  // Fetch messages for selected chat
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(true); // Call the useCallback fetchMessages here
    }
  }, [selectedChat, fetchMessages]);

  // Polling for new messages every 2 seconds
  useEffect(() => {
    if (selectedChat) {
      pollingIntervalRef.current = setInterval(() => {
        fetchMessages(false);
        console.log("fetch");
      }, 2000); // 2 seconds

      // Cleanup interval on unmount or when selectedChat changes
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [selectedChat, fetchMessages]);

  // Scroll to bottom when messages change
  // useEffect(() => {
  //   if (
  //     messageInputRef.current &&
  //     document.activeElement === messageInputRef.current
  //   ) {
  //     messageInputRef.current.focus();
  //   }
  //   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [messages]);

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !staffId) return;

    try {
      setSendingMessage(true);

      const response = await invoke<ApiResponse<MessageType>>( // Call save_message_data backend command
        "save_message_data",
        {
          chatId: selectedChat.chat_id, // Pass selectedChat.chat_id
          senderId: staffId, // Pass staffId as sender_id
          text: newMessage, // Pass newMessage as text
        }
      );

      if (response.status === "success") {
        setNewMessage("");
        await fetchMessages(); // Refresh messages after sending
        await fetchGroupChats();
      } else {
        console.error("Failed to send message:", response.message);
        toast.error(response.message || "Failed to send message");
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Error sending message: " + error.message);
    } finally {
      setSendingMessage(false);
    }
  };

  // Format timestamp for display (no changes)
  const formatTimestamp = (timestamp: string) => {
    // ... (formatTimestamp function - no changes) ...
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      // Today, show time
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      // Yesterday
      return "Yesterday";
    } else if (diffDays < 7) {
      // Within a week, show day name
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      // Older, show date
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  // Loading state handling with LoadingScreen
  if (loading) {
    return (
      <LoadingScreen message="Loading Chats..." navbar={<StaffNavbar />} />
    );
  }

  // If not logged in, don't render anything (will redirect) - No changes needed
  if (!isLoggedIn()) {
    return (
      <AccessRequiredScreen
        isLoggedIn={isLoggedIn()}
        staffPortalName="VorteKia Theme Park Chat UI"
        entityName="chat features"
        backgroundImageUrl="/images/themeparkbg_2.jpg"
        navbar={<StaffNavbar />}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <StaffNavbar />

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Chat List Sidebar (no changes) */}
        <div className="w-full md:w-80 border-r flex flex-col">
          {/* ... Chat list sidebar UI (mostly no changes, adjust types if needed) ... */}
          <div className="p-4 border-b flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
            <h2 className="font-semibold">Group Chats</h2>
          </div>

          <ScrollArea className="flex-1">
            {loading && !chats.length ? ( // Loading state for chats
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[160px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2">
                {chats.map((chat) => (
                  <div
                    key={chat.chat_id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedChat?.chat_id === chat.chat_id
                        ? "bg-primary/10"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedChat(chat)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/20 h-10 w-10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h3 className="font-medium truncate">{chat.name}</h3>
                          {chat.last_message_timestamp && ( // Use last_message_timestamp
                            <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                              {formatTimestamp(chat.last_message_timestamp)}
                            </span>
                          )}
                        </div>
                        {chat.last_message_text && ( // Use last_message_text
                          <p className="text-sm text-muted-foreground truncate">
                            {chat.last_message_text}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Window (mostly no changes, adjust types if needed) */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header (no changes) */}
              <div className="p-4 border-b flex items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/20 h-10 w-10 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="font-semibold">{selectedChat.name}</h2>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {loading && selectedChat ? ( // Loading state for messages
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`flex ${i % 2 === 0 ? "justify-end" : ""}`}
                      >
                        <div className="max-w-[80%]">
                          <Skeleton className="h-4 w-[100px] mb-1" />
                          <Skeleton
                            className={`h-16 w-[250px] rounded-lg ${
                              i % 2 === 0
                                ? "rounded-tr-none"
                                : "rounded-tl-none"
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((messageWithName) => (
                      <ChatMessage
                        key={messageWithName.message.message_id}
                        message={messageWithName}
                        isOwnMessage={
                          messageWithName.message.sender_id === staffId
                        }
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input (no changes) */}
              <div className="p-4 border-t">
                <form
                  className="flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                >
                  <Input
                    ref={messageInputRef}
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sendingMessage}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!newMessage.trim() || sendingMessage}
                  >
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send</span>
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4">
              <Users className="h-12 w-12 mb-4 text-primary/50" />
              <h3 className="text-xl font-medium mb-2">Select a chat</h3>
              <p className="text-center max-w-md">
                Choose a group chat from the list to start messaging with your
                team.
              </p>
            </div>
          )}
        </div>
      </div>
      <Toaster />
    </div>
  );
}

export default function GroupChatPage() {
  return (
    <StaffUserProvider>
      <GroupChatPageUI />
    </StaffUserProvider>
  );
}
