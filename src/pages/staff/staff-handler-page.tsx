"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiResponse, Staff } from "@/types"; // Import Staff interface
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { invoke } from "@tauri-apps/api/core";
import { StaffForm } from "@/components/staff-form"; // Import StaffForm
import { Edit, Trash2 } from "lucide-react";

function StaffHandlerPage() {
  const [staffs, setStaffs] = useState<Staff[]>([]); // Use Staff interface array
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null); // Use Staff interface or null

  // Fetch all staffs from the backend
  async function fetchStaffs() {
    try {
      const response = await invoke<ApiResponse<Staff[]>>(
        "view_staff_accounts"
      ); // Invoke view_staff_accounts
      setStaffs(response.data || []);
      console.log(response.data);
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  }

  useEffect(() => {
    fetchStaffs();
  }, []);

  // Create a new staff
  async function createStaff(
    email: string,
    password: string,
    name: string,
    role: string
  ) {
    try {
      const response = await invoke<ApiResponse<string>>("save_staff_data", {
        // Invoke save_staff_data
        email,
        password,
        name,
        role,
      });

      if (response.status === "error") {
        console.error("Error creating staff:", response.message);
      } else {
        setStaffs((prevStaffs) => [
          ...prevStaffs,
          { staff_id: response.data!, email, name, role }, // Construct Staff object
        ]);
        console.log(staffs);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  }

  // Update an existing staff
  async function updateStaff(
    staff_id: string,
    email: string,
    name: string,
    role: string
  ) {
    try {
      console.log(staff_id, email, name, role);
      const response = await invoke<ApiResponse<string>>("update_staff_data", {
        // Invoke update_staff_data
        staffId: staff_id, // Use staffId as backend expects
        email,
        name,
        role,
      });

      if (response.status === "error") {
        console.error("Error updating staff:", response.message);
      } else {
        setStaffs((prevStaffs) =>
          prevStaffs.map((staff) =>
            staff.staff_id === staff_id
              ? { ...staff, email, name, role }
              : staff
          )
        );
        setEditingStaff(null);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  }

  // Delete a staff
  async function deleteStaff(staff_id: string) {
    try {
      const response = await invoke<ApiResponse<string>>("delete_staff_data", {
        // Invoke delete_staff_data
        staffId: staff_id, // Use staffId as backend expects
      });

      if (response.status === "error") {
        console.error("Error deleting staff:", response.message);
      } else {
        setStaffs((prevStaffs) =>
          prevStaffs.filter((staff) => staff.staff_id !== staff_id)
        );
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  }

  return (
    <div className="relative min-h-screen">
      {/* Background image with overlay */}
      <div
        className="fixed inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: "url('/images/themeparkbg_2.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-black/70"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Staff Management
        </h1>

        <div className="grid gap-8 md:grid-cols-[1fr_1.5fr] lg:grid-cols-[1fr_2fr]">
          {/* Form Section */}
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
            <StaffForm // Use StaffForm here
              createStaff={createStaff}
              updateStaff={updateStaff}
              editingStaff={editingStaff}
              setEditingStaff={setEditingStaff}
            />
          </div>

          {/* Table Section */}
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>VorteKia Staff Accounts</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">UID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffs.map((staff) => (
                    <TableRow key={staff.staff_id}>
                      <TableCell className="font-medium">
                        {staff.staff_id}
                      </TableCell>
                      <TableCell>{staff.email}</TableCell>
                      <TableCell>{staff.name}</TableCell>
                      <TableCell>{staff.role}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingStaff(staff)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you absolutely sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will
                                  permanently delete the staff account and their
                                  data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteStaff(staff.staff_id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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

export default StaffHandlerPage;
