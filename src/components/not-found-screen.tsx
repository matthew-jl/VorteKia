"use client";

import { Ban } from "lucide-react";
import React from "react"; // Import React
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

interface NotFoundScreenProps {
  message?: string;
  onGoBack?: () => void;
  navbar?: React.ReactNode; // Add navbar prop, type React.ReactNode
}

export function NotFoundScreen({
  message = "Not Found",
  onGoBack,
  navbar,
}: NotFoundScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Conditionally render the navbar prop */}
      {navbar}
      <div className="flex-1 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Ban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">{message}</h2>
            <p className="text-muted-foreground mb-4">
              The requested resource could not be found.
            </p>
            {onGoBack && (
              <Button className="mt-4" onClick={onGoBack}>
                Go Back
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
