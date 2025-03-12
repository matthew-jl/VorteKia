// src/pages/staff/souvenir-handler-page.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiResponse, Souvenir } from "@/types";
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
import { SouvenirForm } from "@/components/souvenir-form";
import { Edit, Trash2 } from "lucide-react";

interface SouvenirHandlerPageProps {
  storeId: string;
  storeName: string;
}

function SouvenirHandlerPage({ storeId, storeName }: SouvenirHandlerPageProps) {
  const [souvenirs, setSouvenirs] = useState<Souvenir[]>([]);
  const [editingSouvenir, setEditingSouvenir] = useState<Souvenir | null>(null);

  async function fetchSouvenirs() {
    try {
      const response = await invoke<ApiResponse<Souvenir[]>>("view_souvenirs", {
        storeId: storeId,
      });
      setSouvenirs(response.data || []);
      console.log("Fetched souvenirs:", response.data);
    } catch (error) {
      console.error("Error fetching souvenirs:", error);
    }
  }

  useEffect(() => {
    fetchSouvenirs();
  }, [storeId]);

  async function createSouvenir(
    photo: string | undefined,
    name: string,
    price: string,
    stock: string
  ) {
    try {
      const response = await invoke<ApiResponse<string>>("save_souvenir_data", {
        photo,
        name,
        price,
        stock: parseInt(stock), // Parse stock to integer
        storeId: storeId,
      });

      if (response.status === "error") {
        console.error("Error creating souvenir:", response.message);
      } else {
        setSouvenirs((prevSouvenirs) => [
          ...prevSouvenirs,
          {
            souvenir_id: response.data!,
            photo,
            name,
            price,
            stock: parseInt(stock), // Parse stock to integer
            store_id: storeId,
          },
        ]);
        console.log(souvenirs);
      }
    } catch (error) {
      console.error("Error creating souvenir:", error);
    }
  }

  async function updateSouvenir(
    souvenir_id: string,
    photo: string | undefined,
    name: string,
    price: string,
    stock: string
  ) {
    try {
      const response = await invoke<ApiResponse<string>>(
        "update_souvenir_data",
        {
          souvenirId: souvenir_id,
          photo: photo === "" ? null : photo,
          name,
          price,
          stock: parseInt(stock), // Parse stock to integer
          storeId: storeId, // Store ID is not updated in this function, assuming it's fixed for souvenirs within a store
        }
      );

      if (response.status === "error") {
        console.error("Error updating souvenir:", response.message);
      } else {
        setSouvenirs((prevSouvenirs) =>
          prevSouvenirs.map((souvenir) =>
            souvenir.souvenir_id === souvenir_id
              ? { ...souvenir, photo, name, price, stock: parseInt(stock) } // Parse stock to integer
              : souvenir
          )
        );
        setEditingSouvenir(null);
      }
    } catch (error) {
      console.error("Error updating souvenir:", error);
    }
  }

  async function deleteSouvenir(souvenir_id: string) {
    try {
      const response = await invoke<ApiResponse<string>>(
        "delete_souvenir_data",
        {
          souvenirId: souvenir_id,
        }
      );

      if (response.status === "error") {
        console.error("Error deleting souvenir:", response.message);
      } else {
        setSouvenirs((prevSouvenirs) =>
          prevSouvenirs.filter(
            (souvenir) => souvenir.souvenir_id !== souvenir_id
          )
        );
      }
    } catch (error) {
      console.error("Error deleting souvenir:", error);
    }
  }

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Souvenir Management - {storeName}
        </h1>

        <div className="grid gap-8 md:grid-cols-[1fr_1.5fr] lg:grid-cols-[1fr_2fr]">
          {/* Form Section */}
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
            <SouvenirForm
              createSouvenir={createSouvenir}
              updateSouvenir={updateSouvenir}
              editingSouvenir={editingSouvenir}
              setEditingSouvenir={setEditingSouvenir}
              storeId={storeId} // Pass storeId to SouvenirForm
            />
          </div>

          {/* Table Section */}
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>Souvenirs</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">UID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Price (IDR)</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Photo</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {souvenirs.map((souvenir) => (
                    <TableRow key={souvenir.souvenir_id}>
                      <TableCell className="font-medium">
                        {souvenir.souvenir_id}
                      </TableCell>
                      <TableCell>{souvenir.name}</TableCell>
                      <TableCell>{souvenir.price}</TableCell>
                      <TableCell>{souvenir.stock}</TableCell>
                      <TableCell>
                        {souvenir.photo && (
                          <img
                            src={souvenir.photo}
                            alt={souvenir.name}
                            className="max-w-[50px] max-h-[50px]"
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingSouvenir(souvenir)}
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
                                  permanently delete the souvenir item.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    deleteSouvenir(souvenir.souvenir_id)
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

export default SouvenirHandlerPage;
