// src/pages/income-report-page.tsx
"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { StaffNavbar } from "@/components/staff-navbar"; // Corrected import
import { StaffUserProvider, useStaffUser } from "@/context/staff-user-context"; // Use StaffUserProvider
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DollarSign,
  Calendar,
  ShoppingBag,
  Coffee,
  Ticket,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core"; // Import invoke
import { ApiResponse, IncomeReport } from "@/types"; // Import ApiResponse
import { LoadingScreen } from "@/components/loading-screen"; // Import LoadingScreen
import { AccessRequiredScreen } from "@/components/access-required-screen"; // Import AccessRequiredScreen
import { formatRupiah } from "@/util/currencyFormatter";

function IncomeReportPageUI() {
  // Renamed component
  const navigate = useNavigate();
  const { isLoggedIn, staffRole } = useStaffUser();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<IncomeReport | null>(null);
  const [timePeriod, setTimePeriod] = useState<"day" | "week" | "month">("day");
  const [error, setError] = useState<string | null>(null); // Added error state

  // Role check
  useEffect(() => {
    if (!isLoggedIn()) {
      setLoading(false); // Stop loading to potentially show access denied
      return;
    }
  }, [isLoggedIn, staffRole]);

  // Fetch report data based on selected time period
  useEffect(() => {
    const fetchReportData = async () => {
      if (!isLoggedIn() || staffRole !== "CFO") return; // Early exit if not authorized

      try {
        setLoading(true);
        setError(null); // Reset error on new fetch

        const response = await invoke<ApiResponse<IncomeReport>>(
          "generate_income_report", // Call the backend function
          { period: timePeriod }
        );

        if (response.status === "success" && response.data) {
          setReportData(response.data);
        } else {
          console.error("Failed to fetch income data:", response.message);
          setError(response.message || "Failed to fetch income report data.");
        }
      } catch (err: any) {
        console.error("Error fetching report data:", err);
        setError(
          "An unexpected error occurred while fetching the report: " +
            err.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [isLoggedIn, timePeriod, staffRole]); // Add staffRole to dependencies

  // If not logged in or not authorized, show Access Required Screen
  if (
    !isLoggedIn() ||
    (staffRole !== "CFO" && staffRole !== "CEO" && staffRole !== "COO")
  ) {
    return (
      <AccessRequiredScreen
        isLoggedIn={isLoggedIn()}
        entityName="income reports"
        staffPortalName="VorteKia Financial"
        backgroundImageUrl="/images/themeparkbg_2.jpg" // Or a more relevant background
        navbar={<StaffNavbar />}
      />
    );
  }

  if (loading) {
    return (
      <LoadingScreen
        message="Generating Income Report..."
        navbar={<StaffNavbar />}
      />
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="flex-1 container mx-auto px-4 py-8">
        {/* Header with back button and title */}
        <div className="flex items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Income Report</h1>
            <p className="text-muted-foreground">
              {reportData?.period || "..."}
            </p>
          </div>
        </div>

        {/* Time period filter */}
        <div className="mb-8">
          <Tabs
            defaultValue={timePeriod}
            onValueChange={(value) =>
              setTimePeriod(value as "day" | "week" | "month")
            }
          >
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Time Period:</span>
            </div>
            <TabsList>
              <TabsTrigger value="day">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Grand Total */}
          <Card className="bg-primary text-primary-foreground">
            <CardHeader className="pb-2">
              <CardDescription className="text-primary-foreground/80">
                Grand Total
              </CardDescription>
              <CardTitle className="text-3xl">
                {formatRupiah(reportData?.grand_total || 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                <span>Total park income</span>
              </div>
            </CardContent>
          </Card>

          {/* Consumption */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Consumption</CardDescription>
              <CardTitle>
                {formatRupiah(reportData?.consumption.total || 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Coffee className="h-5 w-5" />
                <span>Restaurant income</span>
              </div>
            </CardContent>
          </Card>

          {/* Marketing */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Marketing</CardDescription>
              <CardTitle>
                {formatRupiah(reportData?.marketing.total || 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShoppingBag className="h-5 w-5" />
                <span>Souvenir income</span>
              </div>
            </CardContent>
          </Card>

          {/* Operations */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Operations</CardDescription>
              <CardTitle>
                {formatRupiah(reportData?.operations.total || 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Ticket className="h-5 w-5" />
                <span>Ride income</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Reports */}
        <Tabs defaultValue="consumption">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="consumption">
              <Coffee className="h-4 w-4 mr-2" />
              Consumption
            </TabsTrigger>
            <TabsTrigger value="marketing">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Marketing
            </TabsTrigger>
            <TabsTrigger value="operations">
              <Ticket className="h-4 w-4 mr-2" />
              Operations
            </TabsTrigger>
          </TabsList>

          {/* Consumption Tab */}
          <TabsContent value="consumption">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coffee className="h-5 w-5" />
                  Restaurant Income
                </CardTitle>
                <CardDescription>
                  Income from food and beverage sales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Restaurant</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Items Sold</TableHead>
                        <TableHead className="text-right">
                          Total Income
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData?.consumption.restaurants.map((restaurant) => (
                        <TableRow key={restaurant.restaurant_id}>
                          <TableCell className="font-medium">
                            {restaurant.restaurant_name}
                          </TableCell>
                          <TableCell className="text-right">
                            {restaurant.order_count.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {restaurant.items_sold.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatRupiah(restaurant.total_income)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableCaption>
                      Total: {formatRupiah(reportData?.consumption.total || 0)}
                    </TableCaption>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Marketing Tab */}
          <TabsContent value="marketing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Souvenir Store Income
                </CardTitle>
                <CardDescription>
                  Income from merchandise and souvenir sales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Store</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Items Sold</TableHead>
                        <TableHead className="text-right">
                          Total Income
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData?.marketing.stores.map((store) => (
                        <TableRow key={store.store_id}>
                          <TableCell className="font-medium">
                            {store.store_name}
                          </TableCell>
                          <TableCell className="text-right">
                            {store.order_count.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {store.items_sold.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatRupiah(store.total_income)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableCaption>
                      Total: {formatRupiah(reportData?.marketing.total || 0)}
                    </TableCaption>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Operations Tab */}
          <TabsContent value="operations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Ride Income
                </CardTitle>
                <CardDescription>
                  Income from ride tickets and attractions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ride</TableHead>
                        <TableHead className="text-right">
                          Tickets Sold
                        </TableHead>
                        <TableHead className="text-right">
                          Total Income
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData?.operations.rides.map((ride) => (
                        <TableRow key={ride.ride_id}>
                          <TableCell className="font-medium">
                            {ride.ride_name}
                          </TableCell>
                          <TableCell className="text-right">
                            {ride.ticket_count.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatRupiah(ride.total_income)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableCaption>
                      Total: {formatRupiah(reportData?.operations.total || 0)}
                    </TableCaption>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Main component wrapping with provider
export default function IncomeReportPage() {
  return (
    <StaffUserProvider>
      <IncomeReportPageUI />
    </StaffUserProvider>
  );
}
