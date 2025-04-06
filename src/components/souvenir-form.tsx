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
import { Souvenir } from "@/types";
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
  stock: z
    .string()
    .min(1, { message: "Stock is required" })
    .refine((val) => !isNaN(Number(val)), {
      message: "Stock must be a number",
    }),
  photo: z.string().optional(),
});

interface SouvenirFormProps {
  createSouvenir: (
    photo: string | undefined,
    name: string,
    price: string,
    stock: string // Stock is string from form, will parse to number in handler
  ) => Promise<void>;
  updateSouvenir: (
    souvenir_id: string,
    photo: string | undefined,
    name: string,
    price: string,
    stock: string // Stock is string from form, will parse to number in handler
  ) => Promise<void>;
  editingSouvenir: Souvenir | null;
  setEditingSouvenir: (souvenir: Souvenir | null) => void;
  storeId: string;
}

export function SouvenirForm({
  createSouvenir,
  updateSouvenir,
  editingSouvenir,
  setEditingSouvenir,
  storeId,
}: SouvenirFormProps) {
  const [isUpdate, setIsUpdate] = useState(false);
  const imageOptions = [
    "/images/souvenirs/souvenir1.jpg",
    "/images/souvenirs/souvenir2.jpg",
    "/images/souvenirs/souvenir3.jpg",
  ];

  const defaultValues = {
    name: "",
    price: "",
    stock: "",
    photo: "",
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    if (editingSouvenir) {
      setIsUpdate(true);
      form.reset({
        name: editingSouvenir.name,
        price: editingSouvenir.price,
        stock: editingSouvenir.stock.toString(), // Convert stock number to string
        photo: editingSouvenir.photo || "",
      });
    } else {
      setIsUpdate(false);
      form.reset(defaultValues);
    }
  }, [editingSouvenir, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isUpdate && editingSouvenir) {
      updateSouvenir(
        editingSouvenir.souvenir_id,
        values.photo,
        values.name,
        values.price,
        values.stock
      );
      setEditingSouvenir(null);
    } else {
      createSouvenir(values.photo, values.name, values.price, values.stock);
    }

    form.reset();
  }

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-center text-primary">
          {isUpdate ? "Edit Souvenir" : "Create New Souvenir"}
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
                      placeholder="Enter souvenir name"
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
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/90">Stock</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter stock"
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
                    setEditingSouvenir(null);
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
