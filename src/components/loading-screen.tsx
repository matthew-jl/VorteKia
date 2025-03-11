"use client";

import { Loader2 } from "lucide-react";
import React from "react"; // Import React

interface LoadingScreenProps {
  message?: string;
  navbar?: React.ReactNode; // Add navbar prop, type React.ReactNode
}

export function LoadingScreen({
  message = "Loading...",
  navbar,
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Conditionally render the navbar prop */}
      {navbar}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg">{message}</p>
        </div>
      </div>
    </div>
  );
}
