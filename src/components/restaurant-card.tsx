"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Restaurant } from "@/types"; // Import Restaurant interface

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Function to format time (optional, if you want to display time in a specific format)
  const formatTime = (timeString: string): string => {
    const timeParts = timeString.split(":");
    if (timeParts.length === 3) {
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      return `${hours}:${String(minutes).padStart(2, "0")}`; // HH:MM format
    }
    return timeString; // Return original if parsing fails
  };

  return (
    <Card
      className="w-[300px] overflow-hidden transition-all duration-300 relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-[200px]">
        {restaurant.photo && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${restaurant.photo})` }}
          />
        )}
        <div className="absolute top-2 right-2">
          <Badge>{restaurant.cuisine_type}</Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="text-xl font-semibold mb-1">{restaurant.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          Location: {restaurant.location || "Not specified"}{" "}
          {/* Display location */}
        </p>
        <p className="text-sm text-muted-foreground line-clamp-2">
          Opening Hours: {formatTime(restaurant.opening_time)} -{" "}
          {formatTime(restaurant.closing_time)}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="flex items-center mt-4">
          <span className="text-sm font-medium pb-2">
            Status: {restaurant.status} {/* Display status */}
          </span>
        </div>
        {isHovered && <Button size="sm">View Menu</Button>}
      </CardFooter>
    </Card>
  );
}
