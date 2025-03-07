"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock } from "lucide-react";
import { Ride } from "@/types";
import { formatRupiah } from "@/util/currencyFormatter";

interface RideCardProps {
  ride: Ride;
  queueCount: number;
}

export function RideCard({ ride, queueCount }: RideCardProps) {
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
          style={{
            backgroundImage: `url(${ride.photo})`,
          }}
        />
        <div className="absolute top-2 right-2">
          <Badge
            variant={
              ride.status === "Closed"
                ? "destructive"
                : ride.status === "Operational"
                ? "default"
                : "secondary"
            }
          >
            {ride.status}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="text-xl font-semibold mb-1">{ride.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          Location: {ride.location}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        {isHovered ? (
          <>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{queueCount} in queue</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm">{formatRupiah(ride.price)}</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {queueCount > 0 ? `${queueCount * 2} min wait` : "No wait"}
            </span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
