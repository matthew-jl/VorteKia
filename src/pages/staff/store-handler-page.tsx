"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiResponse, Store } from "@/types";
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
import { StoreForm } from "@/components/store-form";
import { Edit, Trash2, ShoppingBag } from "lucide-react";
import SouvenirHandlerPage from "./souvenir-handler-page";

function StoreHandlerPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [managingSouvenirsForStoreId, setManagingSouvenirsForStoreId] =
    useState<string | null>(null);
  const souvenirHandlerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (managingSouvenirsForStoreId && souvenirHandlerRef.current) {
      souvenirHandlerRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [managingSouvenirsForStoreId]);

  async function fetchStores() {
    try {
      const response = await invoke<ApiResponse<Store[]>>("view_stores");
      setStores(response.data || []);
    } catch (error) {
      console.error("Error fetching stores:", error);
    }
  }

  useEffect(() => {
    fetchStores();
  }, []);

  async function createStore(
    name: string,
    photo: string | undefined,
    opening_time: string,
    closing_time: string,
    location: string | undefined,
    status: string
  ) {
    try {
      const response = await invoke<ApiResponse<string>>("save_store_data", {
        name,
        photo,
        openingTime: opening_time,
        closingTime: closing_time,
        location,
        status,
      });

      if (response.status === "error") {
        console.error("Error creating store:", response.message);
      } else {
        setStores((prevStores) => [
          ...prevStores,
          {
            store_id: response.data!,
            name,
            photo,
            opening_time,
            closing_time,
            location,
            status,
          },
        ]);
      }
    } catch (error) {
      console.error("Error creating store:", error);
    }
  }

  async function updateStore(
    store_id: string,
    name: string,
    photo: string | undefined,
    opening_time: string,
    closing_time: string,
    location: string | undefined,
    status: string
  ) {
    try {
      const response = await invoke<ApiResponse<string>>("update_store_data", {
        storeId: store_id,
        name,
        photo: photo === "" ? null : photo,
        openingTime: opening_time,
        closingTime: closing_time,
        location: location === "" ? null : location,
        status,
      });

      if (response.status === "error") {
        console.error("Error updating store:", response.message);
      } else {
        setStores((prevStores) =>
          prevStores.map((store) =>
            store.store_id === store_id
              ? {
                  ...store,
                  name,
                  photo,
                  opening_time,
                  closing_time,
                  location,
                  status,
                }
              : store
          )
        );
        setEditingStore(null);
      }
    } catch (error) {
      console.error("Error updating store:", error);
    }
  }

  async function deleteStore(store_id: string) {
    try {
      const response = await invoke<ApiResponse<string>>("delete_store_data", {
        storeId: store_id,
      });

      if (response.status === "error") {
        console.error("Error deleting store:", response.message);
      } else {
        setStores((prevStores) =>
          prevStores.filter((store) => store.store_id !== store_id)
        );
      }
    } catch (error) {
      console.error("Error deleting store:", error);
    }
  }

  return (
    <div className="relative min-h-screen">
      <div
        className="fixed inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: "url('/images/themeparkbg_2.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-black/70"></div>
      </div>
      <div className="relative z-10 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Store Management
        </h1>

        <div className="grid gap-8 md:grid-cols-[1fr_1.5fr] lg:grid-cols-[1fr_2fr]">
          {/* Form Section */}
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
            <StoreForm
              createStore={createStore}
              updateStore={updateStore}
              editingStore={editingStore}
              setEditingStore={setEditingStore}
            />
          </div>

          {/* Table Section */}
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>VorteKia Stores</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">UID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Opening Time</TableHead>
                    <TableHead>Closing Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Photo</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stores.map((store) => (
                    <TableRow key={store.store_id}>
                      <TableCell className="font-medium">
                        {store.store_id}
                      </TableCell>
                      <TableCell>{store.name}</TableCell>
                      <TableCell>{store.location || "-"}</TableCell>
                      <TableCell>{store.opening_time}</TableCell>
                      <TableCell>{store.closing_time}</TableCell>
                      <TableCell>{store.status}</TableCell>
                      <TableCell>
                        {store.photo && (
                          <img
                            src={store.photo}
                            alt={store.name}
                            className="max-w-[50px] max-h-[50px]"
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingStore(store)}
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
                                  permanently delete the store and its data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteStore(store.store_id)}
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
                            aria-label="Manage Souvenirs"
                            onClick={() =>
                              setManagingSouvenirsForStoreId(store.store_id)
                            }
                          >
                            <ShoppingBag className="h-4 w-4" />
                            <span className="sr-only">Manage Souvenirs</span>
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
      {managingSouvenirsForStoreId && (
        <div ref={souvenirHandlerRef}>
          <SouvenirHandlerPage
            storeId={managingSouvenirsForStoreId}
            storeName={
              stores.find((r) => r.store_id === managingSouvenirsForStoreId)
                ?.name || "Unknown"
            }
          />
        </div>
      )}
    </div>
  );
}

export default StoreHandlerPage;
