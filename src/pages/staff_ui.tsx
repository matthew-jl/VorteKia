"use client";
import StaffHandlerPage from "./staff/staff-handler-page";
import CustomerHandlerPage from "./staff/customer-handler-page";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Bell, MessageSquare, ShieldCheck } from "lucide-react";
import { StaffLoginForm } from "@/components/staff-login-form";
import { StaffUserProvider, useStaffUser } from "@/context/staff-user-context"; // Import StaffUserProvider and useStaffUser
import { invoke } from "@tauri-apps/api/core";
import { ApiResponse, Staff } from "@/types";
import RestaurantHandlerPage from "./staff/restaurant-handler-page";
import RideHandlerPage from "./staff/ride-handler-page";

function StaffUIComponent() {
  const { isLoggedIn, login, logout, staffName, staffRole } = useStaffUser(); // Use StaffUserContext

  const handleLogin = async (sessionToken: string, staffEmail: string) => {
    try {
      const detailsResponse = await invoke<ApiResponse<Staff>>(
        "get_staff_details_by_email", // Use get_staff_details_by_email command
        { email: staffEmail } // Pass email to backend
      );

      if (detailsResponse.status === "success") {
        const staffDetails = detailsResponse.data;
        if (staffDetails) {
          login(
            sessionToken,
            staffDetails.staff_id, // Use staff_id from details
            staffDetails.name,
            staffDetails.role
          );
        } else {
          console.error("Staff details missing in response after login.");
          // Handle error: maybe logout or show error message
        }
      } else if (detailsResponse.status === "error") {
        console.error("Error fetching staff details:", detailsResponse.message);
        // Handle error: show error message to user
      } else {
        console.error(
          "Unexpected response status fetching staff details:",
          detailsResponse
        );
        // Handle error: generic error message
      }
    } catch (error) {
      console.error("Error invoking get_staff_details_by_email:", error);
      // Handle error: communication error
    }
  };

  const handleLogoutClick = () => {
    logout();
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky Navbar */}
      <header className="sticky top-0 z-50 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">
              {isLoggedIn()
                ? `Welcome to Staff UI, ${staffName} (${staffRole})`
                : "Staff UI"}{" "}
              {/* Display staff name and role when logged in */}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn() ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label="Customer service"
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                </Button>
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
                  <StaffLoginForm onLogin={handleLogin} />{" "}
                  {/* Use StaffLoginForm */}
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area (you can add staff-specific content below the navbar) */}
      <main className="container mx-auto px-4 py-8">
        {isLoggedIn() ? (
          <div>
            {/* Staff Dashboard based on role */}
            {staffRole === "COO" && (
              <div>
                <StaffHandlerPage />
              </div>
            )}
            {(staffRole === "CustomerServiceManager" ||
              staffRole === "CustomerServiceStaff") && (
              <div>
                <CustomerHandlerPage />
              </div>
            )}
            {staffRole === "FBSupervisor" && (
              <div>
                <RestaurantHandlerPage />
              </div>
            )}
            {staffRole === "RideManager" && (
              <div>
                <RideHandlerPage />
              </div>
            )}
          </div>
        ) : (
          <div className="relative">
            {/* Background image with overlay */}
            <div
              className="fixed inset-0 bg-cover bg-center z-0"
              style={{
                backgroundImage: "url('/images/themeparkbg_2.jpg')",
              }}
            >
              <div className="absolute inset-0 bg-black/70"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center h-[70vh] text-center">
              <div className="bg-background/80 backdrop-blur-md p-8 rounded-lg shadow-lg max-w-2xl w-full">
                <div className="mb-6 inline-flex p-4 rounded-full bg-primary/10">
                  <ShieldCheck className="h-12 w-12 text-primary" />
                </div>
                <h1 className="text-3xl font-bold mb-4">
                  Staff Access Required
                </h1>
                <p className="text-lg mb-8 text-foreground">
                  Welcome to the VorteKia Theme Park staff portal. This area is
                  restricted to authorized personnel only. Please log in with
                  your staff credentials to access management features.
                </p>
                <div className="flex flex-col gap-4 items-center">
                  <p className="text-sm text-foreground">
                    If you're experiencing login issues, please contact IT
                    support.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function StaffUI() {
  return (
    <StaffUserProvider>
      <StaffUIComponent />
    </StaffUserProvider>
  );
}
