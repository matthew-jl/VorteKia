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
import { Search, Filter, Bell, MessageSquare, Wallet } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { RestaurantCard } from "@/components/restaurant-card";
import { RideCard } from "@/components/ride-card";
import { rides } from "@/lib/dummy-data";
import { UserProvider, useUser } from "@/context/user-context";
import { invoke } from "@tauri-apps/api/core";
import { ApiResponse, Customer, Restaurant } from "@/types";
import { Toaster } from "@/components/ui/sonner";
import { VirtualBalanceForm } from "@/components/virtual-balance-form";
import { formatRupiah } from "@/util/currencyFormatter";

function CustomerUIComponent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const { isLoggedIn, login, logout, uid, customerName, virtualBalance } =
    useUser(); // Use UserContext
  const [isTopUpDialogOpen, setIsTopUpDialogOpen] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]); // State to hold

  const handleLogin = async (sessionToken: string, customerUid: string) => {
    // Make handleLogin async
    try {
      const detailsResponse = await invoke<ApiResponse<Customer>>( // Invoke get_customer_details
        "get_customer_details",
        { customerId: customerUid }
      );

      if (detailsResponse.status === "success") {
        const customerDetails = detailsResponse.data;
        if (customerDetails) {
          login(
            sessionToken,
            customerUid,
            customerDetails.name,
            customerDetails.virtual_balance
          );
        } else {
          console.error("Customer details missing in response after login.");
        }
      } else if (detailsResponse.status === "error") {
        console.error(
          "Error fetching customer details:",
          detailsResponse.message
        );
      } else {
        console.error(
          "Unexpected response status fetching customer details:",
          detailsResponse
        );
      }
    } catch (error) {
      console.error("Error invoking get_customer_details:", error);
    }
  };

  const handleLogoutClick = () => {
    logout(); // Call logout from UserContext
  };

  // Fetch restaurants on component mount
  useEffect(() => {
    async function loadRestaurants() {
      try {
        const response = await invoke<ApiResponse<Restaurant[]>>(
          "view_restaurants"
        ); // Fetch restaurants
        if (response.status === "success" && response.data) {
          setRestaurants(response.data);
        } else if (response.status === "error") {
          console.error("Error fetching restaurants:", response.message);
          // Handle error: Display error message to user if needed
        } else {
          console.error("Unexpected response fetching restaurants:", response);
        }
      } catch (error) {
        console.error("Error invoking view_restaurants:", error);
        // Handle error: Communication error
      }
    }
    loadRestaurants();
  }, []); // Empty dependency array to run only once on mount

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
      <header className="sticky top-0 z-50 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">
              Welcome, {customerName || "Guest"}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn() ? (
              <>
                <Dialog
                  open={isTopUpDialogOpen}
                  onOpenChange={setIsTopUpDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full relative"
                      aria-label="Top up balance"
                    >
                      <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5">
                        {formatRupiah(virtualBalance || 0)}
                      </span>
                      <Wallet className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Top Up Virtual Balance</DialogTitle>
                    </DialogHeader>
                    <VirtualBalanceForm
                      onCancel={() => setIsTopUpDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label="Customer service"
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                </Button>
                <Button variant="default" onClick={handleLogoutClick}>
                  Logout
                </Button>
              </>
            ) : (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="default">Login</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Login to VorteKia</DialogTitle>
                  </DialogHeader>
                  <LoginForm onLogin={handleLogin} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

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
                <>
                  <div key={restaurant.restaurant_id} className="snap-start">
                    <RestaurantCard restaurant={restaurant} />{" "}
                    {/* Render RestaurantCard */}
                  </div>
                </>
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
                <div key={ride.id} className="snap-start">
                  <RideCard ride={ride} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <Toaster richColors position="top-right" />
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
