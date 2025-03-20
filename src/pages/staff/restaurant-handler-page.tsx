"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiResponse, Restaurant } from "@/types"; // Import Restaurant interface
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
import { RestaurantForm } from "@/components/restaurant-form"; // Import RestaurantForm
import { Edit, Trash2, Menu, Utensils, Filter } from "lucide-react"; // Import Menu icon
import MenuItemHandlerPage from "./menu-item-handler-page";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

function RestaurantHandlerPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]); // Use Restaurant interface array
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(
    null
  ); // Use Restaurant interface or null
  const [managingMenuForRestaurantId, setManagingMenuForRestaurantId] =
    useState<string | null>(null); // State to track restaurant for menu management
  const menuItemHandlerRef = useRef<HTMLDivElement>(null);
  const [statusFilter, setStatusFilter] = useState<string>("All");

  useEffect(() => {
    if (managingMenuForRestaurantId && menuItemHandlerRef.current) {
      menuItemHandlerRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [managingMenuForRestaurantId]);

  // Fetch all restaurants from the backend
  async function fetchRestaurants() {
    try {
      const response = await invoke<ApiResponse<Restaurant[]>>(
        "view_restaurants"
      ); // Invoke view_restaurants
      setRestaurants(response.data || []);
      console.log(response.data);
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  }

  useEffect(() => {
    fetchRestaurants();
  }, []);

  // Create a new restaurant
  async function createRestaurant(
    name: string,
    photo: string | undefined,
    opening_time: string,
    closing_time: string,
    cuisine_type: string,
    location: string | undefined,
    status: string
  ) {
    try {
      const response = await invoke<ApiResponse<string>>(
        "save_restaurant_data",
        {
          // Invoke save_restaurant_data
          name,
          photo,
          openingTime: opening_time, // Backend expects openingTime, closingTime
          closingTime: closing_time,
          cuisineType: cuisine_type,
          location,
          status,
        }
      );

      if (response.status === "error") {
        console.error("Error creating restaurant:", response.message);
      } else {
        setRestaurants((prevRestaurants) => [
          ...prevRestaurants,
          {
            restaurant_id: response.data!,
            name,
            photo,
            opening_time,
            closing_time,
            cuisine_type,
            location,
            status,
          }, // Construct Restaurant object
        ]);
        console.log(restaurants);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  }

  // Update an existing restaurant
  async function updateRestaurant(
    restaurant_id: string,
    name: string,
    photo: string | undefined,
    opening_time: string,
    closing_time: string,
    cuisine_type: string,
    location: string | undefined,
    status: string
  ) {
    try {
      const response = await invoke<ApiResponse<string>>(
        "update_restaurant_data",
        {
          // Invoke update_restaurant_data
          restaurantId: restaurant_id, // Backend expects restaurantId
          name,
          photo: photo,
          openingTime: opening_time,
          closingTime: closing_time,
          cuisineType: cuisine_type,
          location: location === "" ? null : location, // Handle empty string for location to null
          status,
        }
      );

      if (response.status === "error") {
        console.error("Error updating restaurant:", response.message);
      } else {
        setRestaurants((prevRestaurants) =>
          prevRestaurants.map((restaurant) =>
            restaurant.restaurant_id === restaurant_id
              ? {
                  ...restaurant,
                  name,
                  photo,
                  opening_time,
                  closing_time,
                  cuisine_type,
                  location,
                  status,
                }
              : restaurant
          )
        );
        setEditingRestaurant(null);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  }

  // Delete a restaurant
  async function deleteRestaurant(restaurant_id: string) {
    try {
      const response = await invoke<ApiResponse<string>>(
        "delete_restaurant_data",
        {
          // Invoke delete_restaurant_data
          restaurantId: restaurant_id, // Backend expects restaurantId
        }
      );

      if (response.status === "error") {
        console.error("Error deleting restaurant:", response.message);
      } else {
        setRestaurants((prevRestaurants) =>
          prevRestaurants.filter(
            (restaurant) => restaurant.restaurant_id !== restaurant_id
          )
        );
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  }

  // Filter restaurants based on status
  const filteredRestaurants = restaurants.filter((restaurant) => {
    if (statusFilter === "All") return true;
    return restaurant.status === statusFilter;
  });

  const statuses = ["All", "Open", "Closed"]; // Filter options

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
          Restaurant Management
        </h1>

        <div className="grid gap-8 md:grid-cols-[1fr_1.5fr] lg:grid-cols-[1fr_2fr]">
          {/* Form Section */}
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
            <RestaurantForm // Use RestaurantForm here
              createRestaurant={createRestaurant}
              updateRestaurant={updateRestaurant}
              editingRestaurant={editingRestaurant}
              setEditingRestaurant={setEditingRestaurant}
            />
          </div>

          {/* Table Section */}
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden p-6">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="mb-4 flex items-center gap-2"
                >
                  <Filter size={18} />
                  <span>Filter by Status</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Filter by Status</DialogTitle>
                </DialogHeader>
                <div className="flex flex-wrap gap-2 mt-4">
                  {statuses.map((status) => (
                    <Badge
                      key={status}
                      variant={statusFilter === status ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setStatusFilter(status)}
                    >
                      {status}
                    </Badge>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>VorteKia Restaurants</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">UID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Cuisine</TableHead>
                    <TableHead>Opening Time</TableHead>
                    <TableHead>Closing Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Photo</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRestaurants.map((restaurant) => (
                    <TableRow key={restaurant.restaurant_id}>
                      <TableCell className="font-medium">
                        {restaurant.restaurant_id}
                      </TableCell>
                      <TableCell>{restaurant.name}</TableCell>
                      <TableCell>{restaurant.cuisine_type}</TableCell>
                      <TableCell>{restaurant.opening_time}</TableCell>
                      <TableCell>{restaurant.closing_time}</TableCell>
                      <TableCell>{restaurant.status}</TableCell>
                      <TableCell>{restaurant.location}</TableCell>
                      <TableCell>
                        {restaurant.photo && (
                          <img
                            src={restaurant.photo}
                            alt={restaurant.name}
                            className="max-w-[50px] max-h-[50px]"
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingRestaurant(restaurant)}
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
                                  permanently delete the restaurant and their
                                  data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    deleteRestaurant(restaurant.restaurant_id)
                                  }
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
                            aria-label="Manage Menu"
                            onClick={() =>
                              setManagingMenuForRestaurantId(
                                restaurant.restaurant_id
                              )
                            }
                          >
                            <Utensils className="h-4 w-4" /> {/* Menu Icon */}
                            <span className="sr-only">Manage Menu</span>
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
      {/* Conditionally render MenuItemHandlerPage when managingMenuForRestaurantId is set */}
      {managingMenuForRestaurantId && (
        <div ref={menuItemHandlerRef}>
          <MenuItemHandlerPage
            restaurantId={managingMenuForRestaurantId}
            restaurantName={
              restaurants.find(
                (r) => r.restaurant_id === managingMenuForRestaurantId
              )?.name || "Unknown"
            }
          />
        </div>
      )}
    </div>
  );
}

export default RestaurantHandlerPage;
