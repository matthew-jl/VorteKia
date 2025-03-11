// src/pages/ride_ui_staff.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { StaffNavbar } from "@/components/staff-navbar";
import { StaffUserProvider, useStaffUser } from "@/context/staff-user-context";
import { Badge } from "@/components/ui/badge";
import type { Ride, ApiResponse } from "@/types"; // Import ApiResponse
import { invoke } from "@tauri-apps/api/core"; // Import invoke
import RideQueueHandlerPage from "./staff/ride-queue-handler-page";
import { formatRupiah } from "@/util/currencyFormatter";
import { AccessRequiredScreen } from "@/components/access-required-screen";
import { NotFoundScreen } from "@/components/not-found-screen";
import { ErrorScreen } from "@/components/error-screen";
import { LoadingScreen } from "@/components/loading-screen";

function RideStaffUIComponent() {
  const { rideId } = useParams<{ rideId: string }>();
  const { isLoggedIn, staffRole } = useStaffUser();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if staff has permission to manage ride queue
  const hasRidePermission =
    isLoggedIn() && (staffRole === "RideManager" || staffRole === "RideStaff");

  // Fetch ride data
  useEffect(() => {
    const fetchRideData = async () => {
      if (!rideId) {
        setError("No ride ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const rideResponse = await invoke<ApiResponse<Ride>>(
          "get_ride_details",
          { rideId }
        );
        if (rideResponse.status === "success" && rideResponse.data) {
          setRide(rideResponse.data);
        } else {
          setError(rideResponse.message || "Failed to fetch ride data");
          return;
        }
      } catch (err) {
        setError("Error fetching ride data: " + err);
      } finally {
        setLoading(false);
      }
    };

    fetchRideData();
  }, [rideId]);

  // Loading state
  if (loading && hasRidePermission) {
    return (
      <LoadingScreen
        message="Loading ride information..."
        navbar={<StaffNavbar />}
      />
    );
  }

  // Error state
  if (error && hasRidePermission) {
    return (
      <ErrorScreen
        error={error}
        onTryAgain={() => window.location.reload()}
        navbar={<StaffNavbar />}
      />
    );
  }

  // No ride data found
  if (!ride) {
    return (
      <NotFoundScreen
        message="Ride Not Found"
        onGoBack={() => window.history.back()}
        navbar={<StaffNavbar />}
      />
    );
  }

  // No permission
  if (!hasRidePermission) {
    return (
      <AccessRequiredScreen
        isLoggedIn={isLoggedIn()}
        entityName="ride queues"
        staffPortalName={ride?.name ? `${ride.name}` : "Ride"}
        backgroundImageUrl={ride?.photo}
        navbar={<StaffNavbar />}
      />
    );
  }

  // Main UI for logged-in staff with permission
  return (
    <div className="min-h-screen relative">
      <div
        className="fixed inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: `url(${
            ride.photo || "/placeholder.svg?height=1080&width=1920"
          })`,
        }}
      >
        <div className="absolute inset-0 bg-black/70"></div>
      </div>

      <StaffNavbar />

      <div className="relative z-10 container mx-auto p-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">{ride.name}</h1>
            <p className="text-white/80">{ride.location}</p>
            <p className="text-white/80">{formatRupiah(ride.price)}</p>
          </div>
          <Badge
            variant={
              ride.status === "Operational"
                ? "default"
                : ride.status === "Pending"
                ? "secondary"
                : "destructive"
            }
            className="text-sm px-3 py-1"
          >
            {ride.status}
          </Badge>
        </div>

        <RideQueueHandlerPage rideId={ride.ride_id} rideName={ride.name} />
      </div>
    </div>
  );
}

export default function RideUIStaff() {
  return (
    <StaffUserProvider>
      <RideStaffUIComponent />
    </StaffUserProvider>
  );
}
