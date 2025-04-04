"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiResponse, MaintenanceSchedule, Ride, Staff } from "@/types"; // Import MaintenanceSchedule, Ride, Staff types
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
import { MaintenanceScheduleForm } from "@/components/maintenance-schedule-form"; // Import MaintenanceScheduleForm
import { Edit, Trash2 } from "lucide-react";
import { useStaffUser } from "@/context/staff-user-context";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

function MaintenanceScheduleHandlerPage() {
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<
    MaintenanceSchedule[]
  >([]);
  const [editingMaintenanceSchedule, setEditingMaintenanceSchedule] =
    useState<MaintenanceSchedule | null>(null);
  const [rides, setRides] = useState<Ride[]>([]); // State for rides
  const [maintenanceStaffList, setMaintenanceStaffList] = useState<Staff[]>([]); // State for maintenance staff
  const { staffId, staffRole } = useStaffUser();

  async function fetchMaintenanceSchedules() {
    try {
      let response;
      if (staffRole === "MaintenanceStaff" && staffId) {
        // Check if role is MaintenanceStaff and staffId is available
        response = await invoke<ApiResponse<MaintenanceSchedule[]>>(
          "view_maintenance_schedule_by_staff",
          { staffId: staffId } // Pass staffId to backend
        );
      } else {
        response = await invoke<ApiResponse<MaintenanceSchedule[]>>(
          "view_maintenance_schedules"
        );
      }
      setMaintenanceSchedules(response.data || []);
    } catch (error) {
      console.error("Error fetching maintenance schedules:", error);
    }
  }

  async function fetchRides() {
    try {
      const response = await invoke<ApiResponse<Ride[]>>("view_rides");
      setRides(response.data || []);
    } catch (error) {
      console.error("Error fetching rides:", error);
    }
  }

  async function fetchMaintenanceStaff() {
    try {
      const response = await invoke<ApiResponse<Staff[]>>(
        "view_maintenance_staffs"
      ); // New command
      if (response.status === "success" && response.data) {
        setMaintenanceStaffList(response.data);
      } else {
        console.error("Failed to fetch Maintenance Staff:", response.message);
      }
    } catch (error) {
      console.error("Error fetching Maintenance Staff:", error);
    }
  }

  useEffect(() => {
    fetchMaintenanceSchedules();
    fetchRides();
    fetchMaintenanceStaff();
  }, []);

  async function createMaintenanceSchedule(
    ride_id: string,
    staff_id: string,
    description: string | undefined,
    start_date: string,
    end_date: string,
    status: string
  ) {
    if (staffRole === "MaintenanceStaff") {
      toast.error("Maintenance Staff cannot create new schedules.");
      console.error(
        "Permission denied: Maintenance Staff cannot create schedules."
      );
      return; // Stop execution
    }

    try {
      const response = await invoke<ApiResponse<string>>(
        "save_maintenance_schedule_data",
        {
          rideId: ride_id,
          staffId: staff_id,
          description,
          startDate: start_date,
          endDate: end_date,
          status,
        }
      );

      if (response.status === "error") {
        console.error("Error creating maintenance schedule:", response.message);
      } else {
        fetchMaintenanceSchedules(); // Refresh table
      }
    } catch (error) {
      console.error("Error creating maintenance schedule:", error);
      toast.error("" + error);
    }
  }

  async function updateMaintenanceSchedule(
    maintenance_task_id: string,
    ride_id: string,
    staff_id: string,
    description: string | undefined,
    start_date: string,
    end_date: string,
    status: string
  ) {
    try {
      console.log(start_date, typeof start_date);
      const response = await invoke<ApiResponse<string>>(
        "update_maintenance_schedule_data",
        {
          maintenanceTaskId: maintenance_task_id,
          rideId: ride_id,
          staffId: staff_id,
          description,
          startDate: start_date,
          endDate: end_date,
          status,
        }
      );

      if (response.status === "error") {
        console.error("Error updating maintenance schedule:", response.message);
      } else {
        fetchMaintenanceSchedules(); // Refresh table
        setEditingMaintenanceSchedule(null);
      }
    } catch (error) {
      console.error("Error updating maintenance schedule:", error);
    }
  }

  async function deleteMaintenanceSchedule(maintenance_task_id: string) {
    try {
      const response = await invoke<ApiResponse<string>>(
        "delete_maintenance_schedule_data",
        {
          maintenanceTaskId: maintenance_task_id,
        }
      );

      if (response.status === "error") {
        console.error("Error deleting maintenance schedule:", response.message);
      } else {
        fetchMaintenanceSchedules(); // Refresh table
      }
    } catch (error) {
      console.error("Error deleting maintenance schedule:", error);
    }
  }

  return (
    <div className="relative min-h-screen">
      <div
        className="fixed inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: "url('/images/themeparkbg_2.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-black/70"></div>
      </div>
      {/* Background, Content, and Header (No changes needed here) */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Maintenance Schedule Management
        </h1>

        <div className="grid gap-8 md:grid-cols-[1fr_1.5fr] lg:grid-cols-[1fr_2fr]">
          {/* Form Section */}
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
            <MaintenanceScheduleForm // Use MaintenanceScheduleForm, pass props
              createMaintenanceSchedule={createMaintenanceSchedule}
              updateMaintenanceSchedule={updateMaintenanceSchedule}
              editingMaintenanceSchedule={editingMaintenanceSchedule}
              setEditingMaintenanceSchedule={setEditingMaintenanceSchedule}
              rides={rides} // Pass rides to the form
              maintenanceStaffList={maintenanceStaffList} // Pass maintenanceStaffList to the form
            />
          </div>

          {/* Table Section */}
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>Maintenance Schedules</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Task UID</TableHead>
                    <TableHead>Ride</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceSchedules.map((schedule) => (
                    <TableRow key={schedule.maintenance_task_id}>
                      <TableCell className="font-medium">
                        {schedule.maintenance_task_id}
                      </TableCell>
                      <TableCell>
                        {rides.find((ride) => ride.ride_id === schedule.ride_id)
                          ?.name || "Unknown Ride"}
                      </TableCell>
                      <TableCell>
                        {maintenanceStaffList.find(
                          (staff) => staff.staff_id === schedule.staff_id
                        )?.name || "Unknown Staff"}
                      </TableCell>
                      <TableCell>{schedule.description}</TableCell>
                      <TableCell>
                        {new Date(schedule.start_date).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(schedule.end_date).toLocaleString()}
                      </TableCell>
                      <TableCell>{schedule.status}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setEditingMaintenanceSchedule(schedule)
                            }
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          {(staffRole === "MaintenanceManager" ||
                            staffRole === "CEO" ||
                            staffRole === "COO") && (
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
                                    permanently delete the maintenance schedule.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      deleteMaintenanceSchedule(
                                        schedule.maintenance_task_id
                                      )
                                    }
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
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
      <Toaster richColors position="top-right" />
    </div>
  );
}

export default MaintenanceScheduleHandlerPage;
