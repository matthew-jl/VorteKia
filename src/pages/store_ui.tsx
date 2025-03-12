// src/pages/StoreUI.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  AlertTriangle,
  Ban,
  ShoppingBasket,
  Search,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { ApiResponse, Souvenir, Store, OrderSouvenir } from "@/types"; // Updated types
import { UserProvider, useUser } from "@/context/user-context";
import { formatRupiah } from "@/util/currencyFormatter";
import { Navbar } from "@/components/navbar";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NotFoundScreen } from "@/components/not-found-screen";
import { ErrorScreen } from "@/components/error-screen";
import { LoadingScreen } from "@/components/loading-screen";

function StoreUIComponent() {
  const { storeId } = useParams<{ storeId: string }>();
  const { isLoggedIn, uid, setVirtualBalance, virtualBalance } = useUser();
  const [store, setStore] = useState<Store | null>(null);
  const [souvenirs, setSouvenirs] = useState<Souvenir[]>([]); // Renamed from menuItems
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSouvenir, setSelectedSouvenir] = useState<Souvenir | null>(
    null
  ); // Renamed from selectedMenuItem
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<OrderSouvenir[]>([]); // Updated type

  const fetchStoreData = useCallback(async () => {
    if (!storeId) {
      setError("No store ID provided");
      setLoading(false);
      return;
    }

    try {
      setLoading(true); // Keep setLoading(true) at the start

      // Fetch store details
      const storeResponse = await invoke<ApiResponse<Store>>(
        "get_store_details",
        {
          storeId,
        }
      );
      if (storeResponse.status === "success" && storeResponse.data) {
        setStore(storeResponse.data);
      } else {
        setError(storeResponse.message || "Failed to fetch store data");
        return;
      }

      // Fetch souvenirs
      const souvenirsResponse = await invoke<ApiResponse<Souvenir[]>>(
        "view_souvenirs",
        {
          storeId: storeId,
        }
      );
      if (souvenirsResponse.status === "success" && souvenirsResponse.data) {
        setSouvenirs(souvenirsResponse.data);
      } else {
        setError(souvenirsResponse.message || "Failed to fetch souvenir items");
      }
    } catch (err) {
      setError("Error fetching data: " + err);
    } finally {
      setLoading(false); // Keep setLoading(false) in finally
    }
  }, [storeId]); // Add storeId as dependency for useCallback

  useEffect(() => {
    fetchStoreData();
  }, [fetchStoreData]);

  const fetchCustomerOrders = async () => {
    if (!uid || !storeId) return;
    try {
      const response = await invoke<ApiResponse<OrderSouvenir[]>>(
        "view_order_souvenirs_by_customer",
        {
          // Updated command name
          customerId: uid,
          storeId: storeId, // Pass storeId
        }
      );
      if (response.status === "success") {
        setCustomerOrders(response.data || []);
      } else {
        console.error(
          "Failed to fetch customer souvenir orders:",
          response.message
        );
      }
    } catch (err) {
      console.error("Error fetching customer souvenir orders:", err);
    }
  };

  useEffect(() => {
    if (isLoggedIn() && uid) {
      fetchCustomerOrders();
    }
  }, [isLoggedIn, uid, storeId]);

  const handleOrder = async (souvenir: Souvenir) => {
    // Renamed menuItem to souvenir
    if (!isLoggedIn() || !uid) {
      toast.error("Please log in to place an order.");
      return;
    }

    setSelectedSouvenir(souvenir); // Renamed setSelectedMenuItem to setSelectedSouvenir
    setOrderQuantity(1);
  };

  const confirmOrder = async () => {
    if (!selectedSouvenir || !uid || !virtualBalance) return; // Renamed selectedMenuItem to selectedSouvenir

    const orderPrice = parseFloat(selectedSouvenir.price) * orderQuantity; // Renamed selectedMenuItem to selectedSouvenir
    const currentBalance = parseFloat(virtualBalance);

    if (currentBalance < orderPrice) {
      toast.error("Insufficient virtual balance to place order.");
      return;
    }

    setOrderLoading(true);
    try {
      const response = await invoke<ApiResponse<string>>(
        "save_order_souvenir_data",
        {
          // Updated command name
          customerId: uid,
          storeId: storeId, // Use storeId
          souvenirId: selectedSouvenir.souvenir_id, // Renamed menuItemId to souvenirId
          quantity: orderQuantity,
        }
      );

      if (response.status === "success") {
        const newBalance = (currentBalance - orderPrice).toString();
        const balanceResponse = await invoke<string>("update_customer_data", {
          customerId: uid,
          name: null,
          virtualBalance: newBalance,
        });
        await invoke<ApiResponse<string>>("update_souvenir_stock", {
          // Decrease souvenir stock
          souvenirId: selectedSouvenir.souvenir_id,
          stock: selectedSouvenir.stock - orderQuantity,
        });

        setVirtualBalance(newBalance);
        toast.success(
          `Order placed successfully! New balance: ${formatRupiah(
            parseFloat(newBalance)
          )}`
        );
        setSelectedSouvenir(null); // Renamed setSelectedMenuItem to setSelectedSouvenir
        fetchCustomerOrders();
        fetchStoreData(); // Refresh souvenir list to reflect stock change
      } else {
        toast.error(response.message || "Failed to place order.");
      }
    } catch (error: any) {
      toast.error("Error placing order: " + error.message);
    } finally {
      setOrderLoading(false);
    }
  };

  const filteredSouvenirs = souvenirs.filter(
    (
      item // Renamed filteredMenuItems to filteredSouvenirs and menuItems to souvenirs
    ) => item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPrice = selectedSouvenir // Renamed selectedMenuItem to selectedSouvenir
    ? parseFloat(selectedSouvenir.price) * orderQuantity // Renamed selectedMenuItem to selectedSouvenir
    : 0;

  if (loading) {
    return <LoadingScreen message="Loading store information..." />;
  }

  if (error) {
    return (
      <ErrorScreen error={error} onTryAgain={() => window.location.reload()} />
    );
  }

  if (!store) {
    return (
      <NotFoundScreen
        message="Store Not Found"
        onGoBack={() => window.history.back()}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar title={store.name} />
      <div
        className="fixed inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: `url(${
            store.photo || "/placeholder.svg?height=1080&width=1920"
          })`,
        }}
      >
        <div className="absolute inset-0 bg-black/70"></div>
      </div>
      <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
        <div className="mb-6">
          <div className="flex items-center w-full md:w-1/2">
            <span className="absolute ml-3">
              <Search className="h-4 w-4 text-muted-foreground" />
            </span>
            <Input
              type="text"
              placeholder="Search souvenir items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full bg-background"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSouvenirs.length === 0 && !loading ? ( // Renamed filteredMenuItems to filteredSouvenirs
            <div className="text-center col-span-full">
              No souvenir items found.
            </div>
          ) : (
            filteredSouvenirs.map(
              (
                item // Renamed filteredMenuItems to filteredSouvenirs
              ) => (
                <Card
                  key={item.souvenir_id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <CardTitle>{item.name}</CardTitle>
                    <CardDescription>
                      {formatRupiah(item.price)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {item.photo ? (
                      <img
                        src={
                          item.photo || "/placeholder.svg?height=200&width=200"
                        }
                        alt={item.name}
                        className="w-full h-48 object-cover rounded-md mb-4"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted flex items-center justify-center text-muted-foreground rounded-md">
                        No image
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleOrder(item)} // Renamed handleOrder
                          disabled={!isLoggedIn() || item.stock <= 0} // Disable if not logged in or out of stock
                        >
                          <ShoppingBasket className="mr-2 h-4 w-4" />
                          {item.stock > 0 ? "Buy Souvenir" : "Out of Stock"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>
                            Buy {selectedSouvenir?.name}
                          </DialogTitle>
                          <DialogDescription>
                            Enter the quantity you would like to buy.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="quantity" className="text-right">
                              Quantity
                            </Label>
                            <Input
                              id="quantity"
                              type="number"
                              value={orderQuantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setOrderQuantity(
                                  isNaN(val) || val < 1 ? 1 : val
                                );
                              }}
                              className="col-span-3"
                              min={1}
                              max={selectedSouvenir?.stock} // Limit quantity to available stock
                            />
                          </div>
                          <div>
                            <p className="font-semibold">
                              Total Price: {formatRupiah(totalPrice)}
                            </p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            type="submit"
                            onClick={confirmOrder}
                            disabled={orderLoading}
                          >
                            {orderLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Placing Order...
                              </>
                            ) : (
                              "Confirm Order"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardFooter>
                </Card>
              )
            )
          )}
        </div>
        {!isLoggedIn() && (
          <div className="mt-8 p-4 bg-foreground rounded-lg text-center col-span-full">
            <p className="mb-2 text-background">
              Please log in to place an order.
            </p>
          </div>
        )}

        {isLoggedIn() && (
          <Card className="mt-8 bg-background backdrop-blur-md">
            <CardHeader>
              <CardTitle>Your Souvenir Orders</CardTitle>
              <CardDescription>
                A list of your recent souvenir orders at this store.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Souvenir</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerOrders.map((order) => (
                      <TableRow key={order.order_souvenir_id}>
                        <TableCell>{order.order_souvenir_id}</TableCell>
                        <TableCell>
                          {
                            souvenirs.find(
                              (item) => item.souvenir_id === order.souvenir_id
                            )?.name
                          }
                        </TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell>
                          {new Date(order.timestamp).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableCaption>
                    A list of your recent souvenir orders.
                  </TableCaption>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

export default function StoreUI() {
  return (
    <UserProvider>
      <StoreUIComponent />
    </UserProvider>
  );
}
