"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Restaurant } from "@/lib/types";

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className="w-[300px] overflow-hidden transition-all duration-300 relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-[200px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${restaurant.image})` }}
        />
        <div className="absolute top-2 right-2">
          <Badge>{restaurant.cuisine}</Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="text-xl font-semibold mb-1">{restaurant.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {restaurant.description}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="flex items-center mt-4">
          <span className="text-sm font-medium pb-2">
            {restaurant.isOpen ? "Open" : "Closed"}
          </span>
        </div>
        {isHovered && <Button size="sm">View Menu</Button>}
      </CardFooter>
    </Card>
  );
}
