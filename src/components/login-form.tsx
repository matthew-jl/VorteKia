"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginFormProps {
  onLogin: (uid: string) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [uid, setUid] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid.trim()) {
      setError("Please enter your UID");
      return;
    }

    // In a real app, this would validate the UID against a database
    onLogin(uid);
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
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <Button type="submit" className="w-full">
        Login
      </Button>
    </form>
  );
}
