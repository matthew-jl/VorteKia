"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import type { ApiResponse, MenuItem } from "@/types";
import { invoke } from "@tauri-apps/api/core";
import { formatRupiah } from "@/util/currencyFormatter";

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  restaurantName: string;
}

export function MenuModal({
  isOpen,
  onClose,
  restaurantId,
  restaurantName,
}: MenuModalProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch menu items when the modal opens
  useEffect(() => {
    if (isOpen) {
      fetchMenuItems();
    }
  }, [isOpen, restaurantId]);

  // Placeholder function to fetch menu items
  const fetchMenuItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await invoke<ApiResponse<MenuItem[]>>(
        "view_menu_items",
        {
          restaurantId: restaurantId,
        }
      );

      if (response.status === "success") {
        setMenuItems(response.data || []);
      } else {
        setError(response.message || "Failed to load menu items.");
      }
    } catch (err) {
      console.error("Error fetching menu items:", err);
      setError("Failed to load menu items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {restaurantName} Menu
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading menu items...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            <p>{error}</p>
          </div>
        ) : menuItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No menu items available for this restaurant.</p>
          </div>
        ) : (
          <ScrollArea className="h-[60vh] pr-4">
            <div className="grid grid-cols-1 gap-4">
              {menuItems.map((item) => (
                <Card key={item.menu_item_id} className="overflow-hidden">
                  <div className="flex">
                    <div className="w-1/4 h-24 bg-muted">
                      {item.photo ? (
                        <img
                          src={item.photo || "/placeholder.svg"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>
                    <CardContent className="w-3/4 p-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{item.name}</h3>
                        <Badge variant="outline" className="ml-2">
                          {formatRupiah(item.price)}
                        </Badge>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
