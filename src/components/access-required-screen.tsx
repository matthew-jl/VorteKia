"use client";

import { ShieldCheck, AlertCircle } from "lucide-react";
import React from "react"; // Import React

interface AccessRequiredScreenProps {
  isLoggedIn: boolean;
  entityName?: string;
  staffPortalName?: string;
  backgroundImageUrl?: string;
  navbar?: React.ReactNode; // Add navbar prop, type React.ReactNode
}

export function AccessRequiredScreen({
  isLoggedIn,
  entityName = "this area",
  staffPortalName = "Staff Portal",
  backgroundImageUrl = "",
  navbar, // Destructure navbar prop
}: AccessRequiredScreenProps) {
  return (
    <div className="min-h-full relative">
      {/* Background image with overlay */}
      <div
        className="fixed inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: `url(${backgroundImageUrl})`,
        }}
      >
        <div className="absolute inset-0 bg-black/70"></div>
      </div>

      {/* Conditionally render the navbar prop */}
      {navbar}

      <div className="relative z-10 flex flex-col items-center justify-center h-[70vh] text-center">
        <div className="bg-background/80 backdrop-blur-md p-8 rounded-lg shadow-lg max-w-2xl w-full">
          <div className="mb-6 inline-flex p-4 rounded-full bg-primary/10">
            <ShieldCheck className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Staff Access Required</h1>
          <p className="text-lg mb-8 text-foreground">
            Welcome to the {staffPortalName} staff portal. This area is
            restricted to authorized personnel only.
            {!isLoggedIn ? (
              <span>
                {" "}
                Please log in with your staff credentials to manage {entityName}
                .
              </span>
            ) : (
              <span>
                {" "}
                You don't have permission to manage {entityName}. Only
                authorized staff can access this area.
              </span>
            )}
          </p>
          <div className="flex flex-col gap-4 items-center">
            <p className="text-sm text-foreground">
              If you believe this is an error, please contact your
              administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
