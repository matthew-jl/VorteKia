"use client";

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { StaffNavbar } from "@/components/staff-navbar";
import { StaffUserProvider, useStaffUser } from "@/context/staff-user-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, Users } from "lucide-react";
import { ChatMessage } from "@/components/chat-message";

// Define types for our chat data
interface GroupChat {
  chat_id: string;
  name: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

interface Message {
  message_id: string;
  chat_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  timestamp: string;
}

function GroupChatPageUI() {
  const navigate = useNavigate();
  const { isLoggedIn, staffId, staffName } = useStaffUser();
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<GroupChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<GroupChat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if user is logged in
  //   useEffect(() => {
  //     if (!isLoggedIn()) {
  //       navigate("/staff");
  //     }
  //   }, [isLoggedIn, navigate]);

  // Fetch group chats
  useEffect(() => {
    const fetchGroupChats = async () => {
      if (!staffId) return;

      try {
        setLoading(true);

        // REPLACE THIS: In a real implementation, uncomment and use this
        // const response = await invoke<ApiResponse<GroupChat[]>>(
        //   "get_staff_group_chats",
        //   { staffId }
        // );

        // if (response.status === "success") {
        //   setChats(response.data || []);
        // } else {
        //   console.error("Failed to fetch group chats:", response.message);
        // }

        // Mock data for demonstration
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API delay

        const mockChats: GroupChat[] = [
          {
            chat_id: "chat1",
            name: "Ride Staff Team",
            last_message: "When is the next maintenance scheduled?",
            last_message_time: new Date(Date.now() - 15 * 60000).toISOString(),
            unread_count: 2,
          },
          {
            chat_id: "chat2",
            name: "Restaurant Team",
            last_message: "We need to order more supplies",
            last_message_time: new Date(Date.now() - 2 * 3600000).toISOString(),
            unread_count: 0,
          },
          {
            chat_id: "chat3",
            name: "Management",
            last_message: "Please submit your reports by Friday",
            last_message_time: new Date(
              Date.now() - 1 * 86400000
            ).toISOString(),
            unread_count: 0,
          },
          {
            chat_id: "chat4",
            name: "IT Support",
            last_message: "The new system update will be deployed tonight",
            last_message_time: new Date(
              Date.now() - 3 * 86400000
            ).toISOString(),
            unread_count: 0,
          },
        ];

        setChats(mockChats);
      } catch (error) {
        console.error("Error fetching group chats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupChats();
  }, [staffId]);

  // Fetch messages for selected chat
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;

      try {
        setLoading(true);

        // REPLACE THIS: In a real implementation, uncomment and use this
        // const response = await invoke<ApiResponse<Message[]>>(
        //   "get_chat_messages",
        //   { chatId: selectedChat.chat_id }
        // );

        // if (response.status === "success") {
        //   setMessages(response.data || []);
        // } else {
        //   console.error("Failed to fetch messages:", response.message);
        // }

        // Mock data for demonstration
        await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate API delay

        const mockMessages: Message[] = [
          {
            message_id: "msg1",
            chat_id: selectedChat.chat_id,
            sender_id: "staff1",
            sender_name: "Jane Smith",
            content: "Hello everyone! How's everything going today?",
            timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
          },
          {
            message_id: "msg2",
            chat_id: selectedChat.chat_id,
            sender_id: "staff2",
            sender_name: "John Davis",
            content: "All good here. The new ride is working perfectly.",
            timestamp: new Date(Date.now() - 115 * 60000).toISOString(),
          },
          {
            message_id: "msg3",
            chat_id: selectedChat.chat_id,
            sender_id: staffId || "",
            sender_name: staffName || "You",
            content: "Great to hear! I'll be checking it out later today.",
            timestamp: new Date(Date.now() - 100 * 60000).toISOString(),
          },
          {
            message_id: "msg4",
            chat_id: selectedChat.chat_id,
            sender_id: "staff3",
            sender_name: "Alex Johnson",
            content: "When is the next maintenance scheduled?",
            timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
          },
        ];

        setMessages(mockMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // In a real implementation, you might want to set up a listener for new messages
    // This could be a WebSocket connection or a polling mechanism

    // const messageListener = listen<Message>("new_message", (event) => {
    //   if (event.payload.chat_id === selectedChat.chat_id) {
    //     setMessages(prev => [...prev, event.payload]);
    //   }
    // });

    // return () => {
    //   messageListener.then(unlisten => unlisten());
    // };
  }, [selectedChat, staffId, staffName]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !staffId) return;

    try {
      setSendingMessage(true);

      // REPLACE THIS: In a real implementation, uncomment and use this
      // const response = await invoke<ApiResponse<Message>>(
      //   "send_chat_message",
      //   {
      //     chatId: selectedChat.chat_id,
      //     senderId: staffId,
      //     content: newMessage,
      //   }
      // );

      // if (response.status === "success" && response.data) {
      //   setMessages(prev => [...prev, response.data]);
      //   setNewMessage("");
      // } else {
      //   console.error("Failed to send message:", response.message);
      // }

      // Mock implementation for demonstration
      await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API delay

      const newMsg: Message = {
        message_id: `msg${Date.now()}`,
        chat_id: selectedChat.chat_id,
        sender_id: staffId,
        sender_name: staffName || "You",
        content: newMessage,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newMsg]);
      setNewMessage("");

      // Update the last message in the chat list
      setChats((prev) =>
        prev.map((chat) =>
          chat.chat_id === selectedChat.chat_id
            ? {
                ...chat,
                last_message: newMessage,
                last_message_time: new Date().toISOString(),
                unread_count: 0,
              }
            : chat
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
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

  // If not logged in, don't render anything (will redirect)
  if (!isLoggedIn()) {
    return null;
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
            <h2 className="font-semibold">Group Chats</h2>
          </div>

          <ScrollArea className="flex-1">
            {loading && !chats.length ? (
              // Loading skeletons
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
                          {chat.last_message_time && (
                            <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                              {formatTimestamp(chat.last_message_time)}
                            </span>
                          )}
                        </div>
                        {chat.last_message && (
                          <p className="text-sm text-muted-foreground truncate">
                            {chat.last_message}
                          </p>
                        )}
                      </div>
                      {chat.unread_count ? (
                        <div className="bg-primary text-primary-foreground text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
                          {chat.unread_count}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
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
                  <h2 className="font-semibold">{selectedChat.name}</h2>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
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
                    {messages.map((message) => (
                      <ChatMessage
                        key={message.message_id}
                        message={message}
                        isOwnMessage={message.sender_id === staffId}
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
