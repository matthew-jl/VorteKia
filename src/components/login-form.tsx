"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { invoke } from "@tauri-apps/api/core";
import { ApiResponse } from "@/types";

interface LoginFormProps {
  onLogin: (sessionToken: string, uid: string) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [uid, setUid] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid.trim()) {
      setError("Please enter your UID");
      return;
    }
    setIsLoading(true);
    try {
      const response = await invoke<ApiResponse<string>>("customer_login", {
        customerId: uid,
      }); // Call Tauri command

      if (response.status === "success") {
        const sessionToken = response.data;
        if (sessionToken) {
          console.log("Login successful.");
          onLogin(sessionToken, uid); // Call onLogin with session token and uid
        } else {
          setError("Login successful but session token is missing."); // Should not happen if backend is correct
        }
      } else if (response.status === "error") {
        if (response.message) {
          setError(response.message); // Set error from backend
        }
      } else {
        setError("Login failed unexpectedly."); // Generic error
      }
    } catch (error) {
      console.error("Error invoking customer_login:", error);
      setError("Error invoking customer_login: " + error); // Communication error
    } finally {
      setIsLoading(false); // End loading
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="uid">Customer UID</Label>
        <Input
          id="uid"
          placeholder="Enter your UID"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          disabled={isLoading} // Disable input while loading
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </Button>
    </form>
  );
}
