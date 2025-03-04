"use client";

import { useState } from "react";
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
import {
  Search,
  Filter,
  Bell,
  MessageSquare,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { RestaurantCard } from "@/components/restaurant-card";
import { RideCard } from "@/components/ride-card";
import { restaurants, rides } from "@/lib/dummy-data";

export default function CustomerUI() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customerName, setCustomerName] = useState("Guest");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("All");

  const handleLogin = (uid: string) => {
    // In a real app, this would validate the UID against a database
    setIsLoggedIn(true);
    setCustomerName("John Doe"); // This would come from the database
  };

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const matchesSearch = restaurant.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCuisine =
      selectedCuisine === "All" || restaurant.cuisine === selectedCuisine;
    return matchesSearch && matchesCuisine;
  });

  const cuisines = [
    "All",
    ...Array.from(new Set(restaurants.map((r) => r.cuisine))),
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky Navbar */}
      <header className="sticky top-0 z-50 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Welcome, {customerName}</h2>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label="Top up balance"
                >
                  <Wallet className="h-5 w-5" />
                </Button>
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
                <div key={restaurant.id} className="snap-start">
                  <RestaurantCard restaurant={restaurant} />
                </div>
              ))}
            </div>
            {/* <div className="absolute top-1/2 -left-4 transform -translate-y-1/2 hidden md:block">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white shadow-md"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            </div>
            <div className="absolute top-1/2 -right-4 transform -translate-y-1/2 hidden md:block">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white shadow-md"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div> */}
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
            {/* <div className="absolute top-1/2 -left-4 transform -translate-y-1/2 hidden md:block">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white shadow-md"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            </div>
            <div className="absolute top-1/2 -right-4 transform -translate-y-1/2 hidden md:block">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white shadow-md"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div> */}
          </div>
        </div>
      </section>
    </div>
  );
}
