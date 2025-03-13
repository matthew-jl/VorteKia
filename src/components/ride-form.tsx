"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiResponse, Ride, Staff } from "@/types"; // Import Ride interface
import { Save, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { invoke } from "@tauri-apps/api/core";

const formSchema = z.object({
  status: z.string().min(1, { message: "Status is required." }),
  name: z
    .string()
    .min(2)
    .max(50, { message: "Name must be between 2 and 50 characters." }),
  price: z.string().min(1, { message: "Price is required." }),
  location: z.string().min(1, { message: "Location is required." }),
  staff_id: z.string().min(1, { message: "Staff ID is required." }),
  photo: z.string().optional(), // Optional photo URL
});

interface RideFormProps {
  createRide: (
    status: string,
    name: string,
    price: string,
    location: string,
    staff_id: string,
    photo: string | undefined
  ) => Promise<void>;
  updateRide: (
    ride_id: string,
    status: string,
    name: string,
    price: string,
    location: string,
    staff_id: string,
    photo: string | undefined
  ) => Promise<void>;
  editingRide: Ride | null;
  setEditingRide: (ride: Ride | null) => void;
}

export function RideForm({
  createRide,
  updateRide,
  editingRide,
  setEditingRide,
}: RideFormProps) {
  const [isUpdate, setIsUpdate] = useState(false);
  const imageOptions = [
    "/images/rides/ride1.jpg",
    "/images/rides/ride2.jpg",
    "/images/rides/ride3.jpg",
  ]; // Example image options
  const [rideStaffList, setRideStaffList] = useState<Staff[]>([]);

  const defaultValues = {
    status: "Operational",
    name: "",
    price: "",
    location: "",
    staff_id: "",
    photo: "",
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    const fetchRideStaff = async () => {
      try {
        const response = await invoke<ApiResponse<Staff[]>>("view_ride_staffs"); // Call new command
        if (response.status === "success" && response.data) {
          setRideStaffList(response.data);
        } else {
          console.error("Failed to fetch Ride Staff:", response.message);
        }
      } catch (error) {
        console.error("Error fetching Ride Staff:", error);
      }
    };

    fetchRideStaff();
  }, []);

  useEffect(() => {
    if (editingRide) {
      setIsUpdate(true);
      form.reset({
        status: editingRide.status,
        name: editingRide.name,
        price: editingRide.price,
        location: editingRide.location,
        staff_id: editingRide.staff_id,
        photo: editingRide.photo || "", // Handle null photo
      });
    } else {
      setIsUpdate(false);
      form.reset(defaultValues);
    }
  }, [editingRide, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isUpdate && editingRide) {
      updateRide(
        editingRide.ride_id,
        values.status,
        values.name,
        values.price,
        values.location,
        values.staff_id,
        values.photo
      );
      setEditingRide(null);
    } else {
      createRide(
        values.status,
        values.name,
        values.price,
        values.location,
        values.staff_id,
        values.photo
      );
    }
    form.reset();
  }

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-center text-primary">
          {isUpdate ? "Edit Ride" : "Create New Ride"}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/90">Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-background/50 backdrop-blur-sm border-primary/20 focus-visible:ring-primary">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Operational">Operational</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                    <FormMessage />
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/90">Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter ride name"
                      {...field}
                      className="bg-background/50 backdrop-blur-sm border-primary/20 focus-visible:ring-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/90">Price</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter price (e.g., 50000)"
                      {...field}
                      className="bg-background/50 backdrop-blur-sm border-primary/20 focus-visible:ring-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/90">Location</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter location"
                      {...field}
                      className="bg-background/50 backdrop-blur-sm border-primary/20 focus-visible:ring-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="staff_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/90">
                    Ride Staff
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background/50 backdrop-blur-sm border-primary/20 focus-visible:ring-primary">
                        <SelectValue placeholder="Select Ride Staff" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rideStaffList.map(
                        (
                          staff // Map over rideStaffList
                        ) => (
                          <SelectItem
                            key={staff.staff_id}
                            value={staff.staff_id}
                          >
                            {staff.name}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="photo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/90">Photo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-background/50 backdrop-blur-sm border-primary/20 focus-visible:ring-primary">
                        <SelectValue placeholder="Choose an image (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {imageOptions.map((imagePath) => (
                        <SelectItem key={imagePath} value={imagePath}>
                          {imagePath}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" className="flex-1 gap-2">
                <Save className="h-4 w-4" />
                {isUpdate ? "Update" : "Save"}
              </Button>
              {isUpdate && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    setEditingRide(null);
                    form.reset(defaultValues);
                    setIsUpdate(false);
                  }}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
