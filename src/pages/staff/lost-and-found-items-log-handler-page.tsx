"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiResponse, LostAndFoundItemsLog } from "@/types";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { invoke } from "@tauri-apps/api/core";
import { LostAndFoundItemsLogForm } from "@/components/lost-and-found-items-log-form";
import { Edit } from "lucide-react";

function LostAndFoundItemsLogHandlerPage() {
  const [logs, setLogs] = useState<LostAndFoundItemsLog[]>([]);
  const [editingLog, setEditingLog] = useState<LostAndFoundItemsLog | null>(
    null
  );

  // Fetch logs on mount
  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      const response = await invoke<ApiResponse<LostAndFoundItemsLog[]>>(
        "view_logs"
      );
      setLogs(response.data || []);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }
  }

  async function createLog(
    status: string,
    name: string,
    type: string,
    color: string,
    last_seen_location: string | undefined,
    finder: string | undefined,
    owner: string | undefined,
    found_location: string | undefined,
    image: string | undefined
  ) {
    try {
      const payload = {
        status,
        name,
        ["r#type"]: type, // Match Rust parameter name
        color,
        last_seen_location,
        finder,
        owner,
        found_location,
        image,
      };
      const response = await invoke<ApiResponse<string>>(
        "save_log_data",
        payload
      );
      if (response.status === "error") {
        console.error("Error creating log:", response.message);
      } else {
        fetchLogs(); // Refresh the list
      }
    } catch (error) {
      console.error("Failed to create log:", error);
    }
  }

  async function updateLog(
    log_id: string,
    status: string,
    name: string,
    type: string,
    color: string,
    last_seen_location: string | undefined,
    finder: string | undefined,
    owner: string | undefined,
    found_location: string | undefined,
    image: string | undefined
  ) {
    try {
      const payload = {
        log_id,
        status,
        name,
        ["r#type"]: type, // Match Rust parameter name
        color,
        last_seen_location,
        finder,
        owner,
        found_location,
        image,
      };
      const response = await invoke<ApiResponse<string>>(
        "update_log_data",
        payload
      );
      if (response.status === "error") {
        console.error("Error updating log:", response.message);
      } else {
        setLogs((prevLogs) =>
          prevLogs.map((log) =>
            log.log_id === log_id
              ? {
                  ...log,
                  status,
                  name,
                  type,
                  color,
                  last_seen_location,
                  finder,
                  owner,
                  found_location,
                  image,
                }
              : log
          )
        );
        setEditingLog(null);
      }
    } catch (error) {
      console.error("Failed to update log:", error);
    }
  }

  return (
    <div className="relative min-h-screen">
      {/* Background with overlay */}
      <div
        className="fixed inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: "url('/images/themeparkbg_2.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-black/70"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Lost and Found Items Log Management
        </h1>

        <div className="grid gap-8 md:grid-cols-[1fr_1.5fr] lg:grid-cols-[1fr_2fr]">
          {/* Form Section */}
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
            <LostAndFoundItemsLogForm
              createLog={createLog}
              updateLog={updateLog}
              editingLog={editingLog}
              setEditingLog={setEditingLog}
            />
          </div>

          {/* Table Section */}
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>Lost and Found Items Log</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Log ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Last Seen Location</TableHead>
                    <TableHead>Finder</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Found Location</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.log_id}>
                      <TableCell>{log.log_id}</TableCell>
                      <TableCell>{log.name}</TableCell>
                      <TableCell>{log.type}</TableCell>
                      <TableCell>{log.color}</TableCell>
                      <TableCell>{log.last_seen_location || "N/A"}</TableCell>
                      <TableCell>{log.finder || "N/A"}</TableCell>
                      <TableCell>{log.owner || "N/A"}</TableCell>
                      <TableCell>{log.found_location || "N/A"}</TableCell>
                      <TableCell>{log.timestamp}</TableCell>
                      <TableCell>{log.status}</TableCell>
                      <TableCell>
                        {log.image && (
                          <img
                            src={log.image}
                            alt={log.name}
                            className="max-w-[50px] max-h-[50px]"
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingLog(log)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LostAndFoundItemsLogHandlerPage;
