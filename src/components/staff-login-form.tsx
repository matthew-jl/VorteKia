"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { invoke } from "@tauri-apps/api/core";
import { ApiResponse } from "@/types";

interface StaffLoginFormProps {
  onLogin: (sessionToken: string, email: string) => void; // onLogin now passes email, not UID
}

export function StaffLoginForm({ onLogin }: StaffLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password");
      return;
    }
    setIsLoading(true);
    try {
      const response = await invoke<ApiResponse<string>>("staff_login", {
        email: email, // Use email and password for staff_login
        password: password,
      });

      if (response.status === "success") {
        const sessionToken = response.data;
        if (sessionToken) {
          console.log("Staff Login successful, session token:", sessionToken);
          onLogin(sessionToken, email); // Call onLogin with session token and email
        } else {
          setError("Login successful but session token is missing.");
        }
      } else if (response.status === "error") {
        if (response.message) {
          setError(response.message);
        } else {
          setError("Staff Login failed.");
        }
      } else {
        setError("Staff Login failed unexpectedly.");
      }
    } catch (error) {
      console.error("Error invoking staff_login:", error);
      setError("" + error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          placeholder="Enter your email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          placeholder="Enter your password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </Button>
    </form>
  );
}
