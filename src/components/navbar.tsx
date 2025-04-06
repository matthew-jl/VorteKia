"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Bell, MessageSquare, Wallet } from "lucide-react";
import { useState } from "react";
import { LoginForm } from "@/components/login-form";
import { VirtualBalanceForm } from "@/components/virtual-balance-form";
import { useUser } from "@/context/user-context";
import { formatRupiah } from "@/util/currencyFormatter";
import { invoke } from "@tauri-apps/api/core";
import { ApiResponse, Customer } from "@/types";
import { Toaster } from "sonner";
import { useNavigate } from "react-router";
import { NotificationPopover } from "./notification-popover";

interface NavbarProps {
  title: string;
}

export function Navbar({ title }: NavbarProps) {
  const { isLoggedIn, login, logout, customerName, virtualBalance } = useUser();
  const [isTopUpDialogOpen, setIsTopUpDialogOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (sessionToken: string, customerUid: string) => {
    try {
      const detailsResponse = await invoke<ApiResponse<Customer>>(
        "get_customer_details",
        { customerId: customerUid }
      );
      if (detailsResponse.status === "success" && detailsResponse.data) {
        login(
          sessionToken,
          customerUid,
          detailsResponse.data.name,
          detailsResponse.data.virtual_balance
        );
      } else {
        console.error(
          "Error fetching customer details:",
          detailsResponse.message
        );
      }
    } catch (error) {
      console.error("Error invoking get_customer_details:", error);
    }
  };

  const navigateToCustomerServiceChatPage = () => {
    navigate("/chat/customer-service");
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">
            Welcome to {title} UI, {customerName || "Guest"}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {isLoggedIn() ? (
            <>
              <Dialog
                open={isTopUpDialogOpen}
                onOpenChange={setIsTopUpDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full relative"
                    aria-label="Top up balance"
                  >
                    <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5">
                      {formatRupiah(parseFloat(virtualBalance || "0"))}
                    </span>
                    <Wallet className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Top Up Virtual Balance</DialogTitle>
                  </DialogHeader>
                  <VirtualBalanceForm
                    onCancel={() => setIsTopUpDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Customer service"
                onClick={navigateToCustomerServiceChatPage}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
              <NotificationPopover audience="Customer" />
              <Button variant="default" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="default">Login</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Login to VorteKia</DialogTitle>
                </DialogHeader>
                <LoginForm onLogin={handleLogin} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      <Toaster richColors position="top-right" />
    </header>
  );
}
