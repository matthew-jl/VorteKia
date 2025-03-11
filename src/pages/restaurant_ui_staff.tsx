// src/pages/restaurant_ui_staff.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { StaffNavbar } from "@/components/staff-navbar"; // Corrected import
import { StaffUserProvider, useStaffUser } from "@/context/staff-user-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Ban,
  Search,
  Clock,
  CheckCircle2,
  ChefHat,
  Coffee,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Restaurant, OrderRestaurant, MenuItem, Customer } from "@/types"; // Corrected import
import { invoke } from "@tauri-apps/api/core";
import { ApiResponse } from "@/types";
import { toast } from "sonner";
import { formatRupiah } from "@/util/currencyFormatter";
import { LoadingScreen } from "@/components/loading-screen";
import { ErrorScreen } from "@/components/error-screen";
import { NotFoundScreen } from "@/components/not-found-screen";
import { AccessRequiredScreen } from "@/components/access-required-screen";

function RestaurantUIStaffComponent() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { isLoggedIn, staffRole } = useStaffUser();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<OrderRestaurant[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]); // Store menu items
  const [filteredOrders, setFilteredOrders] = useState<OrderRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [customerNames, setCustomerNames] = useState<{ [key: string]: string }>(
    {}
  );

  const fetchCustomerName = async (customerId: string) => {
    // Only fetch if we don't already have the name
    if (!customerNames[customerId]) {
      try {
        const response = await invoke<ApiResponse<Customer>>(
          "get_customer_details",
          { customerId }
        );
        if (response.status === "success" && response.data) {
          // Use a functional update to avoid stale state issues
          setCustomerNames((prevNames) => ({
            ...prevNames,
            [customerId]: response.data!.name,
          }));
        } else {
          console.error("Failed to fetch customer name:", response.message);
          // Optionally set a default name or an error message in the state
          setCustomerNames((prevNames) => ({
            ...prevNames,
            [customerId]: "Unknown Customer",
          }));
        }
      } catch (err) {
        console.error("Error fetching customer name:", err);
        // Optionally set a default name or an error message in the state
        setCustomerNames((prevNames) => ({
          ...prevNames,
          [customerId]: "Unknown Customer",
        }));
      }
    }
  };

  const fetchRestaurantDetails = async () => {
    if (!restaurantId) {
      setError("No restaurant ID provided");
      setLoading(false);
      return;
    }
    try {
      const response = await invoke<ApiResponse<Restaurant>>(
        "get_restaurant_details",
        { restaurantId }
      );
      if (response.status === "success") {
        setRestaurant(response.data);
      } else {
        setError(response.message || "Failed to fetch restaurant details.");
      }
    } catch (err) {
      setError("Error fetching restaurant details: " + err);
    }
  };

  const fetchOrders = async () => {
    if (!restaurantId) return;
    try {
      const response = await invoke<ApiResponse<OrderRestaurant[]>>(
        "view_order_restaurants",
        { restaurantId }
      );
      if (response.status === "success") {
        setOrders(response.data || []);
      } else {
        setError(response.message || "Failed to fetch orders.");
      }
    } catch (err) {
      setError("Error fetching orders: " + err);
    }
  };

  const fetchMenuItems = async () => {
    if (!restaurantId) return;
    try {
      const response = await invoke<ApiResponse<MenuItem[]>>(
        "view_menu_items",
        {
          restaurantId,
        }
      );
      if (response.status === "success") {
        setMenuItems(response.data || []);
      } else {
        setError(response.message || "Failed to fetch menu items.");
      }
    } catch (err) {
      setError("Error fetching menu items: " + err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      await fetchRestaurantDetails();
      await fetchOrders();
      await fetchMenuItems();
      setLoading(false);
    };
    fetchData();
  }, [restaurantId]);

  // Fetch customer names when orders change
  useEffect(() => {
    orders.forEach((order) => {
      fetchCustomerName(order.customer_id);
    });
  }, [orders]);

  // Check if staff has permission to manage orders
  const hasOrderPermission =
    isLoggedIn() &&
    (staffRole === "Waiter" ||
      staffRole === "Chef" ||
      staffRole === "FBSupervisor");

  const getAvailableStatusOptions = (currentStatus: string) => {
    // Combined logic for Waiter and Chef
    switch (currentStatus) {
      case "Pending":
        return ["Cooking"]; // Waiters move Pending to Cooking
      case "Cooking":
        return ["Ready to Serve"]; // Chefs move Cooking to Ready to Serve
      case "Ready to Serve":
        return ["Complete"]; // Waiters move Ready to Serve to Complete
      default:
        return [];
    }
  };

  // Filter orders based on search term and status filter
  useEffect(() => {
    let filtered = [...orders];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          menuItems
            .find((item) => item.menu_item_id === order.menu_item_id)
            ?.name.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          order.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.order_restaurant_id
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (customerNames[order.customer_id] || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, menuItems, customerNames]);

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!isLoggedIn() || !hasOrderPermission) return;

    setUpdatingOrderId(orderId);

    try {
      const response = await invoke<ApiResponse<string>>(
        "update_order_restaurant_status",
        {
          orderRestaurantId: orderId,
          status: newStatus,
        }
      );

      if (response.status === "success") {
        // Update local state to reflect successful update.
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.order_restaurant_id === orderId
              ? { ...order, status: newStatus }
              : order
          )
        );
        toast.success("Order Status Updated");
      } else {
        toast.error(response.message || "Failed to update order status.");
        console.error("Failed to update order status:", response.message);
      }
    } catch (err) {
      toast.error("Failed to update order status.");
      console.error("Error updating order status:", err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Pending":
        return "destructive";
      case "Cooking":
        return "default";
      case "Ready to Serve":
        return "secondary";
      case "Complete":
        return "outline";
      default:
        return "outline";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="h-4 w-4" />;
      case "Cooking":
        return <ChefHat className="h-4 w-4" />;
      case "Ready to Serve":
        return <Coffee className="h-4 w-4" />;
      case "Complete":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (loading && hasOrderPermission) {
    return (
      <LoadingScreen
        message="Loading restaurant information..."
        navbar={<StaffNavbar />}
      />
    );
  }

  if (error && hasOrderPermission) {
    return (
      <ErrorScreen
        error={error}
        onTryAgain={() => window.location.reload()}
        navbar={<StaffNavbar />}
      />
    );
  }

  if (!restaurant && hasOrderPermission) {
    return (
      <NotFoundScreen
        message="Restaurant Not Found"
        onGoBack={() => window.history.back()}
        navbar={<StaffNavbar />}
      />
    );
  }

  if (!hasOrderPermission) {
    return (
      <AccessRequiredScreen
        isLoggedIn={isLoggedIn()}
        entityName="restaurant orders"
        staffPortalName={restaurant?.name ? `${restaurant.name}` : "Restaurant"}
        backgroundImageUrl={restaurant?.photo}
        navbar={<StaffNavbar />}
      />
    );
  }

  // Main UI
  return (
    <div className="min-h-screen relative">
      {/* Background image with overlay */}
      <div
        className="fixed inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: `url(${
            restaurant?.photo || "/placeholder.svg?height=1080&width=1920"
          })`,
        }}
      >
        <div className="absolute inset-0 bg-black/70"></div>
      </div>

      <StaffNavbar />

      <div className="relative z-10 container mx-auto p-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {restaurant?.name}
            </h1>
            <p className="text-white/80">{restaurant?.location}</p>
          </div>
          <Badge
            variant={restaurant?.status === "Open" ? "default" : "destructive"}
            className="text-sm px-3 py-1"
          >
            Status: {restaurant?.status}
          </Badge>
        </div>

        <Card className="bg-background/90 backdrop-blur-md border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Order Management</CardTitle>
            <CardDescription>Manage restaurant orders.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <Input
                  placeholder="Search by order ID, menu item, or customer..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid grid-cols-5 mb-4">
                <TabsTrigger value="all">All Orders</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="cooking">Cooking</TabsTrigger>
                <TabsTrigger value="ready">Ready to Serve</TabsTrigger>
                <TabsTrigger value="complete">Complete</TabsTrigger>{" "}
                {/* Added Complete tab */}
              </TabsList>

              {["all", "pending", "cooking", "ready", "complete"].map(
                (
                  tab // Added complete
                ) => (
                  <TabsContent key={tab} value={tab}>
                    <ScrollArea className="h-[60vh]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Menu Item</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredOrders
                            .filter(
                              (order) =>
                                tab === "all" ||
                                (tab === "pending" &&
                                  order.status === "Pending") ||
                                (tab === "cooking" &&
                                  order.status === "Cooking") ||
                                (tab === "ready" &&
                                  order.status === "Ready to Serve") ||
                                (tab === "complete" &&
                                  order.status === "Complete")
                            )
                            .map((order) => (
                              <TableRow key={order.order_restaurant_id}>
                                <TableCell className="font-medium">
                                  {order.order_restaurant_id}
                                </TableCell>
                                <TableCell>
                                  {customerNames[order.customer_id] ||
                                    "Loading..."}
                                </TableCell>
                                <TableCell>
                                  {
                                    menuItems.find(
                                      (item) =>
                                        item.menu_item_id === order.menu_item_id
                                    )?.name
                                  }
                                </TableCell>
                                <TableCell>{order.quantity}</TableCell>
                                <TableCell>
                                  {formatRupiah(
                                    parseFloat(
                                      menuItems.find(
                                        (item) =>
                                          item.menu_item_id ===
                                          order.menu_item_id
                                      )?.price || "0"
                                    ) * order.quantity
                                  )}
                                </TableCell>
                                <TableCell>
                                  {new Date(
                                    order.timestamp
                                  ).toLocaleTimeString()}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={getStatusBadgeVariant(
                                      order.status
                                    )}
                                    className="flex items-center gap-1"
                                  >
                                    {getStatusIcon(order.status)}
                                    {order.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {getAvailableStatusOptions(order.status)
                                    .length > 0 ? (
                                    <Select
                                      onValueChange={(value) =>
                                        updateOrderStatus(
                                          order.order_restaurant_id,
                                          value
                                        )
                                      }
                                      disabled={
                                        updatingOrderId ===
                                        order.order_restaurant_id
                                      }
                                    >
                                      <SelectTrigger className="w-[180px] focus:ring-2 focus:ring-primary/50 focus:outline-none">
                                        <SelectValue placeholder="Update Status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {getAvailableStatusOptions(
                                          order.status
                                        ).map((status) => (
                                          <SelectItem
                                            key={status}
                                            value={status}
                                          >
                                            {status}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">
                                      {order.status === "Complete"
                                        ? "Completed"
                                        : `Awaiting ${
                                            order.status === "Pending"
                                              ? "Waiter"
                                              : order.status === "Cooking"
                                              ? "Chef"
                                              : "Waiter"
                                          }`}
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          {filteredOrders.filter(
                            (order) =>
                              tab === "all" ||
                              (tab === "pending" &&
                                order.status === "Pending") ||
                              (tab === "cooking" &&
                                order.status === "Cooking") ||
                              (tab === "ready" &&
                                order.status === "Ready to Serve") ||
                              (tab === "complete" &&
                                order.status === "Complete") // Added complete
                          ).length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={8}
                                className="text-center py-8 text-muted-foreground"
                              >
                                No orders found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                        <TableCaption>
                          {filteredOrders.length} orders in total
                        </TableCaption>
                      </Table>
                    </ScrollArea>
                  </TabsContent>
                )
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function RestaurantUIStaff() {
  return (
    <StaffUserProvider>
      <RestaurantUIStaffComponent />
    </StaffUserProvider>
  );
}
