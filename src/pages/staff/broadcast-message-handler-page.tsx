// src/pages/broadcast-message-handler-page.tsx
"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { StaffNavbar } from "@/components/staff-navbar"; // Corrected import
import { StaffUserProvider, useStaffUser } from "@/context/staff-user-context";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { LoadingScreen } from "@/components/loading-screen";
import { AccessRequiredScreen } from "@/components/access-required-screen";
import { ErrorScreen } from "@/components/error-screen";
import { toast } from "sonner";
import { ApiResponse, BroadcastMessage } from "@/types"; // Import BroadcastMessage from types
import { invoke } from "@tauri-apps/api/core";
import { Toaster } from "@/components/ui/sonner";

// Form schema remains the same
const formSchema = z.object({
  content: z
    .string()
    .min(10, { message: "Message must be at least 10 characters." })
    .max(500, { message: "Message must not exceed 500 characters." }),
  target_audience: z.string({
    required_error: "Please select a target audience.",
  }),
});

function BroadcastMessageHandlerPageUI() {
  const navigate = useNavigate();
  const { isLoggedIn, staffRole } = useStaffUser();
  const [loading, setLoading] = useState(true);
  const [sendingMessageId, setSendingMessageId] = useState<string | null>(null); // Track which message is sending
  const [messages, setMessages] = useState<BroadcastMessage[]>([]); // Use BroadcastMessage type
  const [error, setError] = useState<string | null>(null);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
      target_audience: "",
    },
  });

  // Fetch broadcast messages function
  const fetchBroadcastMessages = async () => {
    if (!isLoggedIn()) {
      setLoading(false); // Stop loading if not logged in
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await invoke<ApiResponse<BroadcastMessage[]>>(
        "view_broadcast_messages" // Call the backend function
      );

      if (response.status === "success" && response.data) {
        setMessages(response.data);
      } else {
        console.error("Failed to fetch broadcast messages:", response.message);
        setError(response.message || "Failed to fetch broadcast messages.");
      }
    } catch (err: any) {
      console.error("Error fetching broadcast messages:", err);
      setError(
        "An unexpected error occurred while fetching broadcast messages: " +
          err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount or when login status changes
  useEffect(() => {
    fetchBroadcastMessages();
  }, [isLoggedIn]);

  // Handle form submission to create a new message
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!isLoggedIn()) return;

    try {
      setLoading(true); // Consider using a different loading state for creation
      const response = await invoke<ApiResponse<string>>(
        "save_broadcast_message_data", // Call backend function
        {
          content: values.content,
          targetAudience: values.target_audience,
          status: "Pending", // New messages start as Pending
        }
      );

      if (response.status === "success") {
        fetchBroadcastMessages(); // Refresh the messages list
        form.reset();
        toast.success("Broadcast message created successfully");
      } else {
        console.error("Failed to create broadcast message:", response.message);
        toast.error("Failed to create broadcast message: " + response.message);
      }
    } catch (err: any) {
      console.error("Error creating broadcast message:", err);
      toast.error(
        "An unexpected error occurred while creating the broadcast message: " +
          err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle sending a broadcast message (updating status)
  const handleSendMessage = async (messageId: string) => {
    if (!isLoggedIn()) return;

    try {
      setSendingMessageId(messageId); // Indicate which message is being sent
      const response = await invoke<ApiResponse<string>>(
        "update_broadcast_message_data", // Call backend update function
        {
          broadcastMessageId: messageId,
          status: "Sent", // Update status to Sent
          // Pass other fields as None/null if you don't want to update them
          targetAudience: null,
          content: null,
        }
      );

      if (response.status === "success") {
        // Update the message status locally for immediate feedback
        setMessages((prev) =>
          prev.map((msg) =>
            msg.broadcast_message_id === messageId
              ? { ...msg, status: "Sent" }
              : msg
          )
        );
        toast.success("Broadcast message sent successfully");
      } else {
        console.error("Failed to send broadcast message:", response.message);
        toast.error("Failed to send broadcast message: " + response.message);
      }
    } catch (err: any) {
      console.error("Error sending broadcast message:", err);
      toast.error(
        "An unexpected error occurred while sending the broadcast message: " +
          err.message
      );
    } finally {
      setSendingMessageId(null); // Reset sending indicator
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      // Check if date is valid after parsing
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      return date.toLocaleString();
    } catch (e) {
      console.error("Error parsing date:", dateString, e);
      return "Invalid Date";
    }
  };

  // Role Check (Adjust roles as needed)
  const hasPermission =
    isLoggedIn() &&
    (staffRole === "CustomerServiceManager" || staffRole === "COO"); // Example roles

  // If not logged in or not authorized, show Access Required Screen
  if (!isLoggedIn() || !hasPermission) {
    return (
      <AccessRequiredScreen
        isLoggedIn={isLoggedIn()}
        entityName="broadcast messages"
        staffPortalName="VorteKia Management"
        backgroundImageUrl="/images/themeparkbg_2.jpg"
        navbar={<StaffNavbar />}
      />
    );
  }

  if (loading && messages.length === 0) {
    return (
      <LoadingScreen
        message="Loading Broadcast Messages..."
        navbar={<StaffNavbar />}
      />
    );
  }

  if (error) {
    return (
      <ErrorScreen
        error={error}
        onTryAgain={fetchBroadcastMessages}
        navbar={<StaffNavbar />}
      />
    );
  }

  return (
    <div className="relative min-h-screen">
      <div
        className="fixed inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: "url('/images/themeparkbg_2.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-black/70"></div>
      </div>
      <div className="relative z-10 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Broadcast Message Management
        </h1>

        <div className="grid gap-8 md:grid-cols-[1fr_1.5fr] lg:grid-cols-[1fr_2fr]">
          {/* Form Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-center text-primary">
                  Create New Broadcast Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="target_audience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Audience</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value} // Use value instead of defaultValue for controlled component
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select target audience" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Customer">
                                Customers
                              </SelectItem>
                              <SelectItem value="Staff">Staff</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose who will receive this message
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message Content</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Type your broadcast message here..."
                              className="min-h-[150px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum 500 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && !sendingMessageId ? ( // Show Creating... only when submitting form
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Create Message
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Table Section */}
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden p-6">
            <ScrollArea className="h-[600px]">
              <div className="overflow-x-auto">
                <Table>
                  <TableCaption>List of all broadcast messages</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">UID</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.length === 0 && !loading ? ( // Display message only if not loading
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No broadcast messages found
                        </TableCell>
                      </TableRow>
                    ) : (
                      messages.map((message) => (
                        <TableRow key={message.broadcast_message_id}>
                          <TableCell className="font-medium">
                            {message.broadcast_message_id}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                message.target_audience === "Customer"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {message.target_audience}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <div className="truncate" title={message.content}>
                              {message.content}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(message.timestamp)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                message.status === "Sent"
                                  ? "default" // Consider different variant for Sent
                                  : "outline"
                              }
                            >
                              {message.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {message.status === "Pending" ? (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1"
                                    disabled={
                                      sendingMessageId ===
                                      message.broadcast_message_id
                                    }
                                  >
                                    {sendingMessageId ===
                                    message.broadcast_message_id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Send className="h-3 w-3" />
                                    )}
                                    Send
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Confirm Broadcast
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to send this
                                      broadcast message to all{" "}
                                      {message.target_audience.toLowerCase()}
                                      s? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleSendMessage(
                                          message.broadcast_message_id
                                        )
                                      }
                                    >
                                      Send Message
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                Already sent
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}

// Main component wrapping with provider
export default function BroadcastMessageHandlerPage() {
  return (
    <StaffUserProvider>
      <BroadcastMessageHandlerPageUI />
    </StaffUserProvider>
  );
}
