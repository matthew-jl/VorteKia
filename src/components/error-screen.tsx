"use client";

import { AlertTriangle } from "lucide-react";
import React from "react"; // Import React
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

interface ErrorScreenProps {
  error: string | null;
  onTryAgain?: () => void;
  navbar?: React.ReactNode; // Add navbar prop, type React.ReactNode
}

export function ErrorScreen({ error, onTryAgain, navbar }: ErrorScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Conditionally render the navbar prop */}
      {navbar}
      <div className="flex-1 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            {onTryAgain && (
              <Button className="mt-4" onClick={onTryAgain}>
                Try Again
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
