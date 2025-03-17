"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiResponse, Ride, Staff } from "@/types"; // Import Ride interface
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
import { RideForm } from "@/components/ride-form"; // Import RideForm
import { Edit, Trash2, Users } from "lucide-react"; // Import Users icon for queue
import RideQueueHandlerPage from "./ride-queue-handler-page";

function RideHandlerPage() {
  const [rides, setRides] = useState<Ride[]>([]); // Use Ride interface array
  const [editingRide, setEditingRide] = useState<Ride | null>(null); // Use Ride interface or null
  const [managingQueueForRideId, setManagingQueueForRideId] = useState<
    string | null
  >(null); // State for queue management
  const rideQueueHandlerRef = useRef<HTMLDivElement>(null);
  const [staffNames, setStaffNames] = useState<{ [staffId: string]: string }>(
    {}
  );

  useEffect(() => {
    if (managingQueueForRideId && rideQueueHandlerRef.current) {
      rideQueueHandlerRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [managingQueueForRideId]);

  // Fetch all rides from the backend
  async function fetchRides() {
    try {
      const response = await invoke<ApiResponse<Ride[]>>("view_rides");
      setRides(response.data || []);
      console.log(response.data);
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  }

  async function fetchStaffName(staffId: string) {
    // Fetch staff name by ID
    if (!staffNames[staffId]) {
      // Check if name is already fetched
      try {
        const response = await invoke<ApiResponse<Staff>>("get_staff_details", {
          staffId,
        });
        if (response.status === "success" && response.data) {
          setStaffNames((prevNames) => ({
            ...prevNames,
            [staffId]: response.data!.name,
          }));
        } else {
          console.error("Error fetching staff name:", response.message);
          setStaffNames((prevNames) => ({
            ...prevNames,
            [staffId]: "Unknown Staff",
          })); // Fallback name
        }
      } catch (error) {
        console.error("Error invoking staff details:", error);
        setStaffNames((prevNames) => ({
          ...prevNames,
          [staffId]: "Unknown Staff",
        })); // Fallback name on error
      }
    }
  }

  useEffect(() => {
    fetchRides();
  }, []);

  useEffect(() => {
    rides.forEach((ride) => {
      // Fetch staff names for each ride
      fetchStaffName(ride.staff_id);
    });
  }, [rides]);

  // Create a new ride
  async function createRide(
    status: string,
    name: string,
    price: string,
    location: string,
    staff_id: string,
    photo: string | undefined
  ) {
    try {
      const response = await invoke<ApiResponse<string>>("save_ride_data", {
        status,
        name,
        price,
        location,
        staffId: staff_id, // Backend expects staffId
        photo,
      });

      if (response.status === "error") {
        console.error("Error creating ride:", response.message);
      } else {
        setRides((prevRides) => [
          ...prevRides,
          {
            ride_id: response.data!, // Assume backend returns the new ID
            status,
            name,
            price,
            location,
            staff_id,
            photo,
          },
        ]);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  }

  // Update an existing ride
  async function updateRide(
    ride_id: string,
    status: string,
    name: string,
    price: string,
    location: string,
    staff_id: string,
    photo: string | undefined
  ) {
    try {
      const response = await invoke<ApiResponse<string>>("update_ride_data", {
        rideId: ride_id, // Backend expects rideId
        status,
        name,
        price,
        location,
        staffId: staff_id,
        photo: photo,
      });

      if (response.status === "error") {
        console.error("Error updating ride:", response.message);
      } else {
        setRides((prevRides) =>
          prevRides.map((ride) =>
            ride.ride_id === ride_id
              ? { ...ride, status, name, price, location, staff_id, photo }
              : ride
          )
        );
        setEditingRide(null);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  }

  // Delete a ride
  async function deleteRide(ride_id: string) {
    try {
      const response = await invoke<string>("delete_ride_data", {
        rideId: ride_id, // Backend expects rideId
      });

      setRides((prevRides) =>
        prevRides.filter((ride) => ride.ride_id !== ride_id)
      );
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
          Ride Management
        </h1>

        <div className="grid gap-8 md:grid-cols-[1fr_1.5fr] lg:grid-cols-[1fr_2fr]">
          {/* Form Section */}
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
            <RideForm
              createRide={createRide}
              updateRide={updateRide}
              editingRide={editingRide}
              setEditingRide={setEditingRide}
            />
          </div>

          {/* Table Section */}
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>VorteKia Rides</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">UID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Staff Name</TableHead>
                    <TableHead>Photo</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rides.map((ride) => (
                    <TableRow key={ride.ride_id}>
                      <TableCell className="font-medium">
                        {ride.ride_id}
                      </TableCell>
                      <TableCell>{ride.name}</TableCell>
                      <TableCell>{ride.status}</TableCell>
                      <TableCell>{ride.price}</TableCell>
                      <TableCell>{ride.location}</TableCell>
                      <TableCell>
                        {staffNames[ride.staff_id] || "Loading..."}
                      </TableCell>
                      <TableCell>
                        {ride.photo && (
                          <img
                            src={ride.photo}
                            alt={ride.name}
                            className="max-w-[50px] max-h-[50px]"
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingRide(ride)}
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
                                  permanently delete the ride and its data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteRide(ride.ride_id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="Manage Queue"
                            onClick={() =>
                              setManagingQueueForRideId(ride.ride_id)
                            }
                          >
                            <Users className="h-4 w-4" /> {/* Queue Icon */}
                            <span className="sr-only">Manage Queue</span>
                          </Button>
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

      {/* Placeholder for Ride Queue Management */}
      {managingQueueForRideId && (
        <div ref={rideQueueHandlerRef}>
          <RideQueueHandlerPage
            rideId={managingQueueForRideId}
            rideName={
              rides.find((r) => r.ride_id === managingQueueForRideId)?.name ||
              "Unknown"
            }
          />
        </div>
      )}
    </div>
  );
}

export default RideHandlerPage;
