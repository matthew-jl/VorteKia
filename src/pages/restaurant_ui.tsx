// src/pages/RestaurantUI.tsx
"use client";

import { useEffect, useState } from "react";
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
import { ApiResponse, MenuItem, Restaurant, OrderRestaurant } from "@/types";
import { UserProvider, useUser } from "@/context/user-context"; // Import UserProvider
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

function RestaurantUIComponent() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { isLoggedIn, uid, setVirtualBalance, virtualBalance } = useUser(); // Get setVirtualBalance
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(
    null
  );
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<OrderRestaurant[]>([]);

  useEffect(() => {
    const fetchRestaurantData = async () => {
      if (!restaurantId) {
        setError("No restaurant ID provided");
        setLoading(false);
        return;
      }

      try {
        // Fetch restaurant details
        const restaurantResponse = await invoke<ApiResponse<Restaurant>>(
          "get_restaurant_details",
          {
            restaurantId,
          }
        );
        if (
          restaurantResponse.status === "success" &&
          restaurantResponse.data
        ) {
          setRestaurant(restaurantResponse.data);
        } else {
          setError(
            restaurantResponse.message || "Failed to fetch restaurant data"
          );
          return;
        }

        // Fetch menu items
        const menuResponse = await invoke<ApiResponse<MenuItem[]>>(
          "view_menu_items",
          { restaurantId }
        );
        if (menuResponse.status === "success" && menuResponse.data) {
          setMenuItems(menuResponse.data);
        } else {
          setError(menuResponse.message || "Failed to fetch menu items");
        }
      } catch (err) {
        setError("Error fetching data: " + err);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, [restaurantId]);

  const fetchCustomerOrders = async () => {
    if (!uid || !restaurantId) return;
    try {
      const response = await invoke<ApiResponse<OrderRestaurant[]>>(
        "view_order_restaurants_by_customer", // New backend function
        { customerId: uid, restaurantId: restaurantId }
      );
      if (response.status === "success") {
        setCustomerOrders(response.data || []);
      } else {
        console.error("Failed to fetch customer orders:", response.message);
      }
    } catch (err) {
      console.error("Error fetching customer orders:", err);
    }
  };

  useEffect(() => {
    if (isLoggedIn() && uid) {
      fetchCustomerOrders();
    }
  }, [isLoggedIn, uid, restaurantId]);

  const handleOrder = async (menuItem: MenuItem) => {
    if (!isLoggedIn() || !uid) {
      toast.error("Please log in to place an order.");
      return;
    }

    setSelectedMenuItem(menuItem);
    setOrderQuantity(1);
  };

  const confirmOrder = async () => {
    if (!selectedMenuItem || !uid || !virtualBalance) return;

    const orderPrice = parseFloat(selectedMenuItem.price) * orderQuantity;
    const currentBalance = parseFloat(virtualBalance);

    if (currentBalance < orderPrice) {
      toast.error("Insufficient virtual balance to place order.");
      return;
    }

    setOrderLoading(true);
    try {
      const response = await invoke<ApiResponse<string>>(
        "save_order_restaurant_data",
        {
          customerId: uid,
          restaurantId: selectedMenuItem.restaurant_id,
          menuItemId: selectedMenuItem.menu_item_id,
          quantity: orderQuantity,
        }
      );

      if (response.status === "success") {
        const newBalance = (currentBalance - orderPrice).toString();
        // Update virtual balance *after* successful order
        const balanceResponse = await invoke<string>("update_customer_data", {
          customerId: uid,
          name: null, // Assuming you don't update name
          virtualBalance: newBalance,
        });

        setVirtualBalance(newBalance); // Update local balance
        toast.success(
          `Order placed successfully! New balance: ${formatRupiah(
            parseFloat(newBalance)
          )}`
        );
        setSelectedMenuItem(null);
        fetchCustomerOrders(); // Refresh orders
      } else {
        toast.error(response.message || "Failed to place order.");
      }
    } catch (error: any) {
      toast.error("Error placing order: " + error.message);
    } finally {
      setOrderLoading(false);
    }
  };

  const filteredMenuItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPrice = selectedMenuItem
    ? parseFloat(selectedMenuItem.price) * orderQuantity
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg">Loading restaurant information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              Error Loading Restaurant
            </h2>
            <p className="text-muted-foreground">{error}</p>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Ban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Restaurant Not Found</h2>
            <p className="text-muted-foreground">
              The requested restaurant could not be found.
            </p>
            <Button className="mt-4" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar title="Restaurant" />
      <div
        className="fixed inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: `url(${
            restaurant.photo || "/placeholder.svg?height=1080&width=1920"
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
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full bg-background"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenuItems.length === 0 && !loading ? (
            <div className="text-center col-span-full">
              No menu items found.
            </div>
          ) : (
            filteredMenuItems.map((item) => (
              <Card
                key={item.menu_item_id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <CardTitle>{item.name}</CardTitle>
                  <CardDescription>{formatRupiah(item.price)}</CardDescription>
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
                        onClick={() => handleOrder(item)}
                        disabled={!isLoggedIn()}
                      >
                        <ShoppingBasket className="mr-2 h-4 w-4" />
                        Order
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>
                          Order {selectedMenuItem?.name}
                        </DialogTitle>
                        <DialogDescription>
                          Enter the quantity you would like to order.
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
                              setOrderQuantity(isNaN(val) || val < 1 ? 1 : val);
                            }}
                            className="col-span-3"
                            min={1}
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
            ))
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
              <CardTitle>Your Orders</CardTitle>
              <CardDescription>
                A list of your recent orders at this restaurant.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      {/* <TableHead>Restaurant</TableHead> */}
                      <TableHead>Menu Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerOrders.map((order) => (
                      <TableRow key={order.order_restaurant_id}>
                        <TableCell>{order.order_restaurant_id}</TableCell>
                        {/* <TableCell>{restaurant?.name}</TableCell> */}
                        <TableCell>
                          {
                            menuItems.find(
                              (item) => item.menu_item_id === order.menu_item_id
                            )?.name
                          }
                        </TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell>
                          {new Date(order.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>{order.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableCaption>A list of your recent orders.</TableCaption>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

export default function RestaurantUI() {
  return (
    <UserProvider>
      <RestaurantUIComponent />
    </UserProvider>
  );
}
