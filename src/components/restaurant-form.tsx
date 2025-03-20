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
import { Restaurant } from "@/types"; // Import Restaurant interface
import { Save, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Import Select for image picker
import { CloudinaryUploader } from "./cloudinary-uploader";

const formSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(50, { message: "Name must be between 2 and 50 characters." }),
  cuisine_type: z
    .string()
    .min(2)
    .max(50, { message: "Cuisine Type must be between 2 and 50 characters." }),
  opening_time: z.string(), // Basic string for time input, more validation can be added
  closing_time: z.string(), // Basic string for time input, more validation can be added
  status: z.string(), // Basic string for status, could be enum in real app
  location: z.string().optional(), // Optional location
  photo: z.string().optional(), // Optional photo URL
});

interface RestaurantFormProps {
  createRestaurant: (
    name: string,
    photo: string | undefined,
    opening_time: string,
    closing_time: string,
    cuisine_type: string,
    location: string | undefined,
    status: string
  ) => Promise<void>;
  updateRestaurant: (
    restaurant_id: string,
    name: string,
    photo: string | undefined,
    opening_time: string,
    closing_time: string,
    cuisine_type: string,
    location: string | undefined,
    status: string
  ) => Promise<void>;
  editingRestaurant: Restaurant | null;
  setEditingRestaurant: (restaurant: Restaurant | null) => void;
}

export function RestaurantForm({
  createRestaurant,
  updateRestaurant,
  editingRestaurant,
  setEditingRestaurant,
}: RestaurantFormProps) {
  const [isUpdate, setIsUpdate] = useState(false);
  // const imageOptions = [
  //   "/images/restaurants/restaurant1.jpg",
  //   "/images/restaurants/restaurant2.jpg",
  //   "/images/restaurants/restaurant3.jpg",
  // ]; // Example image options
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);

  const defaultValues = {
    name: "",
    cuisine_type: "",
    opening_time: "09:00:00", // Default opening time
    closing_time: "22:00:00", // Default closing time
    status: "Open", // Default status
    location: "",
    photo: "", // Default photo to null
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    if (editingRestaurant) {
      setIsUpdate(true);
      form.reset({
        name: editingRestaurant.name,
        cuisine_type: editingRestaurant.cuisine_type,
        opening_time: editingRestaurant.opening_time,
        closing_time: editingRestaurant.closing_time,
        status: editingRestaurant.status,
        location: editingRestaurant.location || "", // Handle null location
        photo: editingRestaurant.photo || "", // Handle null photo
      });
      setPhotoUrl(editingRestaurant.photo);
    } else {
      setIsUpdate(false);
      form.reset(defaultValues);
      setPhotoUrl(undefined);
    }
  }, [editingRestaurant, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isUpdate && editingRestaurant) {
      console.log(values.closing_time);
      console.log(typeof values.closing_time);
      updateRestaurant(
        editingRestaurant.restaurant_id,
        values.name,
        values.photo,
        values.opening_time,
        values.closing_time,
        values.cuisine_type,
        values.location,
        values.status
      );
      setEditingRestaurant(null);
    } else {
      createRestaurant(
        values.name,
        values.photo,
        values.opening_time,
        values.closing_time,
        values.cuisine_type,
        values.location,
        values.status
      );
    }

    form.reset();
    setPhotoUrl(undefined);
  }

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-center text-primary">
          {isUpdate ? "Edit Restaurant" : "Create New Restaurant"}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/90">Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter restaurant name"
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
              name="cuisine_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/90">
                    Cuisine Type
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter cuisine type"
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
              name="opening_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/90">
                    Opening Time
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="time" // Use time input type
                      step={1}
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
              name="closing_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/90">
                    Closing Time
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="time" // Use time input type
                      step={1}
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/90">Status</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter status (e.g., Open, Closed)"
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
                      placeholder="Enter location description"
                      {...field}
                      value={field.value ?? ""}
                      className="bg-background/50 backdrop-blur-sm border-primary/20 focus-visible:ring-primary"
                    />
                  </FormControl>
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
                  <FormControl>
                    <CloudinaryUploader
                      imageUrl={photoUrl}
                      onImageChange={(url) => {
                        setPhotoUrl(url);
                        form.setValue("photo", url || "");
                      }}
                      folder="restaurants"
                      aspectRatio={16 / 9}
                    />
                  </FormControl>
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
                    setEditingRestaurant(null);
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
