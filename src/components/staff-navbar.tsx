// src/components/StaffNavbar.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Bell, MessageSquare, MessageSquareQuote } from "lucide-react";
import { StaffLoginForm } from "@/components/staff-login-form";
import { useStaffUser } from "@/context/staff-user-context";
import { invoke } from "@tauri-apps/api/core";
import { ApiResponse, Staff } from "@/types";
import { useNavigate } from "react-router";
import { NotificationPopover } from "./notification-popover";

interface StaffNavbarProps {}

export function StaffNavbar({}: StaffNavbarProps) {
  const navigate = useNavigate();

  const { isLoggedIn, login, logout, staffName, staffRole } = useStaffUser();

  const handleLogin = async (sessionToken: string, staffEmail: string) => {
    try {
      const detailsResponse = await invoke<ApiResponse<Staff>>(
        "get_staff_details_by_email",
        { email: staffEmail }
      );

      if (detailsResponse.status === "success") {
        const staffDetails = detailsResponse.data;
        if (staffDetails) {
          login(
            sessionToken,
            staffDetails.staff_id,
            staffDetails.name,
            staffDetails.role
          );
        } else {
          console.error("Staff details missing in response after login.");
        }
      } else {
        console.error("Error fetching staff details:", detailsResponse.message);
      }
    } catch (error) {
      console.error("Error invoking get_staff_details_by_email:", error);
    }
  };

  const handleLogoutClick = () => {
    logout();
  };

  const navigateToChatPage = () => {
    navigate("/chat");
  };

  const navigateToOfficialAccountChatPage = () => {
    navigate("/chat/official-account");
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">
            {isLoggedIn() ? `Welcome, ${staffName} (${staffRole})` : "Staff UI"}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {isLoggedIn() ? (
            <>
              {(staffRole === "CustomerServiceStaff" ||
                staffRole === "CustomerServiceManager") && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label="Official Account Chat"
                  onClick={navigateToOfficialAccountChatPage}
                >
                  <MessageSquareQuote className="h-5 w-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Group Chat"
                onClick={navigateToChatPage}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
              <NotificationPopover audience="Staff" />
              <Button variant="default" onClick={handleLogoutClick}>
                Logout
              </Button>
            </>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="default">Staff Login</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Staff Login</DialogTitle>
                </DialogHeader>
                <StaffLoginForm onLogin={handleLogin} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </header>
  );
}
