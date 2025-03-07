"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Filter } from "lucide-react";
import { RestaurantCard } from "@/components/restaurant-card";
import { RideCard } from "@/components/ride-card";
import { UserProvider } from "@/context/user-context";
import { invoke } from "@tauri-apps/api/core";
import { ApiResponse, Restaurant, Ride, RideQueue } from "@/types";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/navbar";

function CustomerUIComponent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [rideQueueCounts, setRideQueueCounts] = useState<{
    [rideId: string]: number;
  }>({});

  useEffect(() => {
    async function loadData() {
      // Fetch Restaurants
      try {
        const restaurantResponse = await invoke<ApiResponse<Restaurant[]>>(
          "view_restaurants"
        );
        if (
          restaurantResponse.status === "success" &&
          restaurantResponse.data
        ) {
          setRestaurants(restaurantResponse.data);
        } else {
          console.error(
            "Error fetching restaurants:",
            restaurantResponse.message
          );
        }
      } catch (error) {
        console.error("Error invoking view_restaurants:", error);
      }

      // Fetch Rides
      try {
        const rideResponse = await invoke<ApiResponse<Ride[]>>("view_rides");
        if (rideResponse.status === "success" && rideResponse.data) {
          setRides(rideResponse.data);
          // Fetch queue counts for each ride
          const queueCounts: { [rideId: string]: number } = {};
          for (const ride of rideResponse.data) {
            const queueResponse = await invoke<ApiResponse<RideQueue[]>>(
              "view_ride_queues",
              { rideId: ride.ride_id }
            );
            if (queueResponse.status === "success" && queueResponse.data) {
              queueCounts[ride.ride_id] = queueResponse.data.length;
            } else {
              queueCounts[ride.ride_id] = 0;
              console.error(
                `Error fetching queue for ride ${ride.ride_id}:`,
                queueResponse.message
              );
            }
          }
          setRideQueueCounts(queueCounts);
        } else {
          console.error("Error fetching rides:", rideResponse.message);
        }
      } catch (error) {
        console.error("Error invoking view_rides:", error);
      }
    }
    loadData();
  }, []);

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const matchesSearch = restaurant.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCuisine =
      selectedCuisine === "All" || restaurant.cuisine_type === selectedCuisine; // Use cuisine_type from Restaurant interface
    return matchesSearch && matchesCuisine;
  });

  const cuisines = [
    "All",
    ...Array.from(new Set(restaurants.map((r) => r.cuisine_type))), // Use cuisine_type from Restaurant interface
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky Navbar */}
      <Navbar title="Customer" />

      {/* Landing Section */}
      <section className="relative h-[60vh]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/themeparkbg_2.jpg')",
          }}
        >
          <div className="absolute inset-0 bg-black/60"></div>
        </div>
        <div className="relative h-full flex flex-col items-center justify-center text-white px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            VorteKia Theme Park
          </h1>
          <p className="text-xl md:text-2xl">
            A Futuristic Wonderland for All Ages
          </p>
        </div>
      </section>

      {/* Restaurants Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">Restaurants</h2>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                placeholder="Search restaurants..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter size={18} />
                  <span>Filter by Cuisine</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Filter by Cuisine</DialogTitle>
                </DialogHeader>
                <div className="flex flex-wrap gap-2 mt-4">
                  {cuisines.map((cuisine) => (
                    <Badge
                      key={cuisine}
                      variant={
                        selectedCuisine === cuisine ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => setSelectedCuisine(cuisine)}
                    >
                      {cuisine}
                    </Badge>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Restaurant Carousel */}
          <div className="relative">
            <div className="flex overflow-x-auto gap-6 pb-6 snap-x">
              {filteredRestaurants.map((restaurant) => (
                <div key={restaurant.restaurant_id} className="snap-start">
                  <RestaurantCard restaurant={restaurant} />{" "}
                  {/* Render RestaurantCard */}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Rides Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">Rides</h2>

          {/* Rides Carousel */}
          <div className="relative">
            <div className="flex overflow-x-auto gap-6 pb-6 snap-x">
              {rides.map((ride) => (
                <div key={ride.ride_id} className="snap-start">
                  <RideCard
                    ride={ride}
                    queueCount={rideQueueCounts[ride.ride_id] || 0}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function CustomerUI() {
  return (
    <UserProvider>
      <CustomerUIComponent />
    </UserProvider>
  );
}
