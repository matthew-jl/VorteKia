"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiResponse, MenuItem } from "@/types";
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
import { MenuItemForm } from "@/components/menu-item-form";
import { Edit, Trash2 } from "lucide-react";

interface MenuItemHandlerPageProps {
  restaurantId: string;
  restaurantName: string;
}

function MenuItemHandlerPage({
  restaurantId,
  restaurantName,
}: MenuItemHandlerPageProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);

  async function fetchMenuItems() {
    try {
      const response = await invoke<ApiResponse<MenuItem[]>>(
        "view_menu_items",
        {
          restaurantId: restaurantId,
        }
      );
      setMenuItems(response.data || []);
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  }

  useEffect(() => {
    fetchMenuItems();
  }, [restaurantId]);

  async function createMenuItem(
    photo: string | undefined,
    name: string,
    price: string
  ) {
    // photo is string | undefined
    try {
      const response = await invoke<ApiResponse<string>>(
        "save_menu_item_data",
        {
          photo,
          name,
          price,
          restaurantId: restaurantId,
        }
      );

      if (response.status === "error") {
        console.error("Error creating menu item:", response.message);
      } else {
        setMenuItems((prevMenuItems) => [
          ...prevMenuItems,
          {
            menu_item_id: response.data!,
            photo,
            name,
            price,
            restaurant_id: restaurantId,
          },
        ]);
      }
    } catch (error) {
      console.error("Unexpected error creating menu item:", error);
    }
  }

  async function updateMenuItem(
    menu_item_id: string,
    photo: string | undefined,
    name: string,
    price: string
  ) {
    // photo is string | undefined
    try {
      const response = await invoke<ApiResponse<string>>(
        "update_menu_item_data",
        {
          menuItemId: menu_item_id,
          photo: photo === "" ? null : photo, // Handle empty string to null for backend if needed
          name,
          price,
          restaurantId: restaurantId,
        }
      );

      if (response.status === "error") {
        console.error("Error updating menu item:", response.message);
      } else {
        setMenuItems((prevMenuItems) =>
          prevMenuItems.map((menuItem) =>
            menuItem.menu_item_id === menu_item_id
              ? { ...menuItem, photo, name, price }
              : menuItem
          )
        );
        setEditingMenuItem(null);
      }
    } catch (error) {
      console.error("Unexpected error updating menu item:", error);
    }
  }

  async function deleteMenuItem(menu_item_id: string) {
    try {
      const response = await invoke<ApiResponse<string>>(
        "delete_menu_item_data",
        {
          menuItemId: menu_item_id,
        }
      );

      if (response.status === "error") {
        console.error("Error deleting menu item:", response.message);
      } else {
        setMenuItems((prevMenuItems) =>
          prevMenuItems.filter(
            (menuItem) => menuItem.menu_item_id !== menu_item_id
          )
        );
      }
    } catch (error) {
      console.error("Unexpected error deleting menu item:", error);
    }
  }

  return (
    <div className="relative min-h-screen">
      {/* Background, Content, and Restaurant ID Header (No changes needed in these sections) */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Menu Item Management - {restaurantName}
        </h1>

        <div className="grid gap-8 md:grid-cols-[1fr_1.5fr] lg:grid-cols-[1fr_2fr]">
          {/* Form Section */}
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
            <MenuItemForm
              createMenuItem={createMenuItem}
              updateMenuItem={updateMenuItem}
              editingMenuItem={editingMenuItem}
              setEditingMenuItem={setEditingMenuItem}
              restaurantId={restaurantId} // Pass restaurantId to MenuItemForm
            />
          </div>

          {/* Table Section */}
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>Menu Items</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">UID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Price (IDR)</TableHead>
                    <TableHead>Photo</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {menuItems.map((menuItem) => (
                    <TableRow key={menuItem.menu_item_id}>
                      <TableCell className="font-medium">
                        {menuItem.menu_item_id}
                      </TableCell>
                      <TableCell>{menuItem.name}</TableCell>
                      <TableCell>{menuItem.price}</TableCell>
                      <TableCell>
                        {menuItem.photo && (
                          <img
                            src={menuItem.photo}
                            alt={menuItem.name}
                            className="max-w-[50px] max-h-[50px]"
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingMenuItem(menuItem)}
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
                                  permanently delete the menu item.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    deleteMenuItem(menuItem.menu_item_id)
                                  }
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
    </div>
  );
}

export default MenuItemHandlerPage;
