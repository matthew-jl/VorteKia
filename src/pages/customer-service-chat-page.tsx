// src/pages/CustomerServiceChatPage.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Navbar } from "@/components/navbar"; // Use Customer Navbar
import { UserProvider, useUser } from "@/context/user-context"; // Use Customer User Context
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, Users } from "lucide-react";
import { ChatMessage } from "@/components/chat-message";
import { NotFoundScreen } from "@/components/not-found-screen";
import { Toaster } from "@/components/ui/sonner";
import { ApiResponse, MessageWithSenderName, Message, Chat } from "@/types"; // Import necessary types
import { invoke } from "@tauri-apps/api/core";
import { LoadingScreen } from "@/components/loading-screen";
import { toast } from "sonner";
import { useNavigate } from "react-router";

function CustomerServiceChatPageUI() {
  const { isLoggedIn, uid, customerName } = useUser(); // Use customer context
  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState<Chat | null>(null); // State for the Customer Service Chat
  const [messages, setMessages] = useState<MessageWithSenderName[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(false);
  }, [isLoggedIn]);

  /// Fetch Customer Service Chat
  const fetchCustomerServiceChat = useCallback(async () => {
    if (!uid) return;
    try {
      setLoading(true);
      const response = await invoke<ApiResponse<Chat>>(
        "get_customer_service_chat", // New Tauri command
        { customerId: uid } // Pass customer UID
      );
      if (response.status === "success" && response.data) {
        setChat(response.data); // Set the chat object
      } else {
        console.error(
          response.message || "Failed to load Customer Service Chat."
        );
      }
    } catch (error: any) {
      console.error("Error fetching Customer Service Chat: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  // Fetch messages for Customer Service Chat
  const fetchMessages = useCallback(async () => {
    if (!chat) return; // Ensure chat is loaded

    try {
      setLoading(true); // Or setPollingMessages(true) if you want polling indicator
      const response = await invoke<ApiResponse<MessageWithSenderName[]>>(
        "get_messages", // New Tauri command
        { chatId: chat.chat_id } // Pass Customer Service Chat ID
      );
      if (response.status === "success") {
        const modifiedMessages = (response.data || []).map((msg) => ({
          ...msg,
          sender_name:
            msg.message.sender_id === uid
              ? customerName || msg.sender_name
              : "Customer Service",
        }));
        setMessages(modifiedMessages);
      } else {
        console.error(response.message || "Failed to load messages.");
      }
    } catch (error: any) {
      console.error("Error fetching messages: " + error.message);
    } finally {
      setLoading(false); // Or setPollingMessages(false)
    }
  }, [chat]); // Dependency on 'chat' to refetch when chat changes

  useEffect(() => {
    if (isLoggedIn()) {
      fetchCustomerServiceChat(); // Fetch the Customer Service Chat on login
    }
  }, [isLoggedIn, fetchCustomerServiceChat]);

  useEffect(() => {
    if (chat) {
      fetchMessages(); // Fetch messages when the chat is loaded
    }
  }, [chat, fetchMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chat || !uid) return; // Check for chat and uid

    try {
      setSendingMessage(true);

      const response = await invoke<ApiResponse<Message>>(
        "save_message_data", // Reuse existing save_message_data command
        {
          chatId: chat.chat_id, // Use chat.chat_id (Customer Service Chat ID)
          senderId: uid, // Use customer UID as senderId
          text: newMessage,
        }
      );

      if (response.status === "success") {
        setNewMessage("");
        fetchMessages(); // Refresh messages after sending
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

  if (loading) {
    return (
      <LoadingScreen
        message="Loading Chat..."
        navbar={<Navbar title="Customer Service" />}
      />
    ); // Use Customer Navbar
  }

  if (!isLoggedIn()) {
    return (
      <NotFoundScreen // Or Access Denied Screen, or redirect to login
        message="Please log in to access Customer Service Chat."
        navbar={<Navbar title="Customer Service" />}
      />
    );
  }

  if (!chat) {
    // Handle case where Customer Service Chat couldn't be loaded
    return (
      <NotFoundScreen
        message="Could not load Customer Service Chat."
        onGoBack={() => window.history.back()} // Or a more appropriate action
        navbar={<Navbar title="Customer Service" />}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Navbar title="Customer Service Chat" /> {/* Customer Navbar */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* No Chat List Sidebar for Customer UI */}

        {/* Chat Window - Similar to Staff UI, but simplified */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header - Display "Customer Service" or similar */}
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
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 h-10 w-10 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h2 className="font-semibold">Customer Service</h2>{" "}
              {/* Fixed title */}
            </div>
          </div>

          {/* Messages - Reuse ChatMessage component */}
          <ScrollArea className="flex-1 p-4">
            {/* ... Loading/No messages/Messages display - Reuse logic from Staff UI, adjust props ... */}
            {loading ? (
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
                          i % 2 === 0 ? "rounded-tr-none" : "rounded-tl-none"
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>No messages yet. How can we help you?</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((messageWithName) => (
                  <ChatMessage
                    key={messageWithName.message.message_id}
                    message={messageWithName}
                    isOwnMessage={messageWithName.message.sender_id === uid} // Check against customer UID
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Message Input - Reuse input, adjust placeholder */}
          <div className="p-4 border-t">
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              <Input
                placeholder="Type your message to customer service..." // Updated placeholder
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
        </div>
      </div>
      <Toaster />
    </div>
  );
}

export default function CustomerServiceChatPage() {
  return (
    <UserProvider>
      <CustomerServiceChatPageUI />
    </UserProvider>
  );
}
