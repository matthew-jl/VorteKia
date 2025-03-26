// src/pages/official-account-chat-page.tsx
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
import { Toaster } from "@/components/ui/sonner";
import {
  ApiResponse,
  Chat,
  MessageWithSenderName,
  Message,
  ChatWithCustomerName,
} from "@/types";
import { invoke } from "@tauri-apps/api/core";
import { LoadingScreen } from "@/components/loading-screen";
import { AccessRequiredScreen } from "@/components/access-required-screen";
import { toast } from "sonner";
import { formatTimestamp } from "@/util/chatTimeFormatter";
import { formatLastMessage } from "@/util/lastMessageFormatter";

function OfficialAccountChatPageUI() {
  const navigate = useNavigate();
  const { isLoggedIn, staffId, staffName, staffRole } = useStaffUser(); // Use staff context
  const [loading, setLoading] = useState(true);
  const [customerServiceChats, setCustomerServiceChats] = useState<
    ChatWithCustomerName[]
  >([]); // State for list of Customer Service Chats
  const [selectedChat, setSelectedChat] = useState<ChatWithCustomerName | null>(
    null
  );
  const [messages, setMessages] = useState<MessageWithSenderName[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(false);
  }, [isLoggedIn]);

  // Fetch Customer Service Chats for Staff
  const fetchCustomerServiceChats = useCallback(async () => {
    if (!staffId) return;
    try {
      setLoading(true);
      const response = await invoke<ApiResponse<ChatWithCustomerName[]>>(
        "view_customer_chats_for_staff",
        {
          // New Tauri command
          /* No params needed */
        }
      );
      if (response.status === "success") {
        setCustomerServiceChats(response.data || []); // Set the list of Customer Service Chats
      } else {
        console.error(
          response.message || "Failed to load Customer Service Chats."
        );
      }
    } catch (error: any) {
      console.error("Error fetching Customer Service Chats: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  // Fetch messages for selected Customer Service Chat (reuse view_customer_service_messages)
  const fetchMessages = useCallback(async () => {
    if (!selectedChat) return;

    try {
      setLoading(true);
      const response = await invoke<ApiResponse<MessageWithSenderName[]>>(
        "get_messages",
        {
          // Reuse existing command
          chatId: selectedChat.chat.chat_id,
        }
      );
      if (response.status === "success") {
        setMessages(response.data || []);
      } else {
        console.error(response.message || "Failed to load messages.");
      }
    } catch (error: any) {
      console.error("Error fetching messages: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedChat]);

  useEffect(() => {
    if (isLoggedIn()) {
      fetchCustomerServiceChats(); // Fetch Customer Service Chats on login
    }
  }, [isLoggedIn, fetchCustomerServiceChats]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(); // Fetch messages when a chat is selected
    }
  }, [selectedChat, fetchMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !staffId) return;

    try {
      setSendingMessage(true);

      const response = await invoke<ApiResponse<Message>>(
        "save_message_data", // Reuse existing save_message_data command
        {
          chatId: selectedChat.chat.chat_id,
          senderId: staffId, // Use staffId as senderId
          text: newMessage,
        }
      );

      if (response.status === "success") {
        setNewMessage("");
        fetchMessages(); // Refresh messages
      } else {
        toast.error(response.message || "Failed to send message.");
      }
    } catch (error: any) {
      toast.error("Error sending message: " + error.message);
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <LoadingScreen
        message="Loading Customer Service Chats..."
        navbar={<StaffNavbar />}
      />
    );
  }

  if (!isLoggedIn()) {
    return (
      <AccessRequiredScreen
        isLoggedIn={isLoggedIn()}
        staffPortalName="VorteKia Theme Park Official Account Chat UI"
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
        {/* Chat List Sidebar */}
        <div className="w-full md:w-80 border-r flex flex-col">
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
            <h2 className="font-semibold">Customer Chats</h2>
          </div>

          <ScrollArea className="flex-1">
            {loading && !customerServiceChats.length ? ( // Loading state for chats
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
                {customerServiceChats.map(
                  (
                    chatWithName // Map over customerServiceChats
                  ) => (
                    <div
                      key={chatWithName.chat.chat_id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedChat?.chat.chat_id === chatWithName.chat.chat_id
                          ? "bg-primary/10"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedChat(chatWithName)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/20 h-10 w-10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <h3 className="font-medium truncate">
                              {chatWithName.customer_name}
                            </h3>
                            {chatWithName.chat.last_message_timestamp && (
                              <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                                {formatTimestamp(
                                  chatWithName.chat.last_message_timestamp
                                )}
                              </span>
                            )}
                          </div>
                          {chatWithName.chat.last_message_text && (
                            <p className="text-sm text-muted-foreground truncate">
                              {formatLastMessage(
                                chatWithName.chat.last_message_text
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/20 h-10 w-10 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="font-semibold">
                    {selectedChat.customer_name}
                  </h2>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {loading && selectedChat ? (
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
                    <p>No messages yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((messageWithName) => (
                      <ChatMessage
                        key={messageWithName.message.message_id}
                        message={messageWithName}
                        isOwnMessage={
                          messageWithName.sender_name !==
                          selectedChat.customer_name
                        }
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t">
                <form
                  className="flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                >
                  <Input
                    placeholder="Type a message to customer..."
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
              <h3 className="text-xl font-medium mb-2">Select a Chat</h3>
              <p className="text-center max-w-md">
                Choose a customer chat from the list to view conversation.
              </p>
            </div>
          )}
        </div>
      </div>
      <Toaster />
    </div>
  );
}

export default function OfficialAccountChatPage() {
  return (
    <StaffUserProvider>
      <OfficialAccountChatPageUI />
    </StaffUserProvider>
  );
}
