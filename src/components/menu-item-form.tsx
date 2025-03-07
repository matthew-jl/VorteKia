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
import { MenuItem } from "@/types";
import { Save, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(50, { message: "Name must be between 2 and 50 characters." }),
  price: z
    .string()
    .min(1, { message: "Price is required" })
    .refine((val) => !isNaN(Number(val)), {
      message: "Price must be a number",
    }),
  photo: z.string().optional(), // Photo is optional now
});

interface MenuItemFormProps {
  createMenuItem: (
    photo: string | undefined,
    name: string,
    price: string
  ) => Promise<void>; // photo is string | undefined
  updateMenuItem: (
    menu_item_id: string,
    photo: string | undefined,
    name: string,
    price: string
  ) => Promise<void>; // photo is string | undefined
  editingMenuItem: MenuItem | null;
  setEditingMenuItem: (menuItem: MenuItem | null) => void;
  restaurantId: string;
}

export function MenuItemForm({
  createMenuItem,
  updateMenuItem,
  editingMenuItem,
  setEditingMenuItem,
  restaurantId,
}: MenuItemFormProps) {
  const [isUpdate, setIsUpdate] = useState(false);
  const imageOptions = [
    "/images/menu_items/menu_item1.jpg",
    "/images/menu_items/menu_item2.jpg",
    "/images/menu_items/menu_item3.jpg",
  ];

  const defaultValues = {
    name: "",
    price: "",
    photo: "", // Default photo to empty string
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    if (editingMenuItem) {
      setIsUpdate(true);
      form.reset({
        name: editingMenuItem.name,
        price: editingMenuItem.price,
        photo: editingMenuItem.photo || "", // Default photo to empty string if null/undefined
      });
    } else {
      setIsUpdate(false);
      form.reset(defaultValues);
    }
  }, [editingMenuItem, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isUpdate && editingMenuItem) {
      updateMenuItem(
        editingMenuItem.menu_item_id,
        values.photo,
        values.name,
        values.price
      );
      setEditingMenuItem(null);
    } else {
      createMenuItem(values.photo, values.name, values.price);
    }

    form.reset();
  }

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-center text-primary">
          {isUpdate ? "Edit Menu Item" : "Create New Menu Item"}
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
                      placeholder="Enter menu item name"
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
                  <FormLabel className="text-foreground/90">
                    Price (IDR)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter price"
                      {...field}
                      type="number"
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || ""}
                  >
                    {" "}
                    {/* Default value to empty string */}
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
                      {/* <SelectItem value="">No Photo</SelectItem>{" "} */}
                      {/* Value is empty string */}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Restaurant ID - Hidden Field */}
            {/* <input
              type="hidden"
              value={restaurantId}
              {...form.register("restaurant_id")}
            /> */}

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
                    setEditingMenuItem(null);
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
