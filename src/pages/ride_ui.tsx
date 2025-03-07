"use client";

import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Users,
  MapPin,
  Clock,
  AlertTriangle,
  Ban,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { ApiResponse, Ride, RideQueue } from "@/types";
import { UserProvider, useUser } from "@/context/user-context";
import { formatRupiah } from "@/util/currencyFormatter";
import { Navbar } from "@/components/navbar";
import Decimal from "decimal.js";
import { toast } from "sonner";

function RideUIComponent() {
  const { rideId } = useParams<{ rideId: string }>();
  const { isLoggedIn, uid, virtualBalance, setVirtualBalance } = useUser();
  const [ride, setRide] = useState<Ride | null>(null);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRideData = async () => {
      if (!rideId) {
        setError("No ride ID provided");
        setLoading(false);
        return;
      }

      try {
        // Fetch ride details
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

        // Fetch queue count
        const queueResponse = await invoke<ApiResponse<RideQueue[]>>(
          "view_ride_queues",
          { rideId }
        );
        if (queueResponse.status === "success" && queueResponse.data) {
          setQueueCount(queueResponse.data.length);
        } else {
          setQueueCount(0);
          console.error("Error fetching queue:", queueResponse.message);
        }
      } catch (err) {
        setError("Error fetching data: " + err);
      } finally {
        setLoading(false);
      }
    };

    fetchRideData();
  }, [rideId]);

  const handleQueueForRide = async () => {
    if (!ride || !uid || !virtualBalance) return;

    const ridePrice = parseFloat(ride.price);
    const currentBalance = parseFloat(virtualBalance);

    if (currentBalance < ridePrice) {
      toast.error(
        "Virtual balance is not enough to queue for ride. Please top up."
      );
      return;
    }

    try {
      // Calculate new queue position
      const lastPosition =
        queueCount > 0 ? new Decimal(queueCount).plus(1).toString() : "1";

      // Queue the user
      const queueResponse = await invoke<ApiResponse<string>>(
        "save_ride_queue_data",
        {
          rideId: ride.ride_id,
          customerId: uid,
          queuePosition: lastPosition,
        }
      );

      if (queueResponse.status !== "success" || !queueResponse.data) {
        throw new Error(queueResponse.message || "Failed to queue for ride");
      }

      // Update virtual balance
      const newBalance = (currentBalance - ridePrice).toString();
      console.log(newBalance);
      const balanceResponse = await invoke<string>("update_customer_data", {
        customerId: uid,
        name: null,
        virtualBalance: newBalance,
      });
      setVirtualBalance(newBalance);
      setQueueCount((prev) => prev + 1);
      toast.success(
        `Successfully queued for ${ride.name}! New balance: ${formatRupiah(
          parseFloat(newBalance)
        )}`
      );
    } catch (err) {
      console.error("Error queuing for ride:", err);
      toast.error("Error queuing for ride: " + err);
    }
  };

  const isRideAvailable = ride?.status === "Operational"; // Assuming "Operational" means open
  const waitTime = queueCount * 3;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg">Loading ride information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Error Loading Ride</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Ban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Ride Not Found</h2>
            <p className="text-muted-foreground">
              The requested ride could not be found.
            </p>
            <Button className="mt-4" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar title="Ride" />
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
      <main className="relative z-10 flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {ride.status !== "Operational" && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                ride.status === "Closed"
                  ? "bg-destructive/20 text-destructive-foreground"
                  : "bg-yellow-500/20 text-yellow-200" // Status "Pending" (under maintenance)
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <p className="font-medium">
                  This ride is currently {ride.status.toLowerCase()}. Queuing is
                  not available at this time.
                </p>
              </div>
            </div>
          )}
          <div className="bg-background/80 backdrop-blur-md rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 sm:p-8">
              <h1 className="text-3xl sm:text-4xl font-bold mb-6">
                {ride.name}
              </h1>
              <p className="text-lg mb-8">Location: {ride.location}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <span>{ride.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span>Estimated wait: {waitTime} minutes</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span>Currently in queue: {queueCount} people</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-lg">
                    <span>Price: {formatRupiah(parseFloat(ride.price))}</span>
                  </div>
                </div>
              </div>
              {isLoggedIn() ? (
                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                  disabled={!isRideAvailable}
                  onClick={handleQueueForRide}
                >
                  Queue for Ride
                </Button>
              ) : (
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                  <p className="mb-2">Please log in to queue for this ride</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function RideUI() {
  return (
    <UserProvider>
      <RideUIComponent />
    </UserProvider>
  );
}
