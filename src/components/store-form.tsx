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
import { Store } from "@/types";
import { Save, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(2).max(50, { message: "Name must be 2 to 50 chars." }),
  location: z.string().optional(),
  opening_time: z.string(),
  closing_time: z.string(),
  status: z.string(),
  photo: z.string().optional(),
});

interface StoreFormProps {
  createStore: (
    name: string,
    photo: string | undefined,
    opening_time: string,
    closing_time: string,
    location: string | undefined,
    status: string
  ) => Promise<void>;
  updateStore: (
    store_id: string,
    name: string,
    photo: string | undefined,
    opening_time: string,
    closing_time: string,
    location: string | undefined,
    status: string
  ) => Promise<void>;
  editingStore: Store | null;
  setEditingStore: (store: Store | null) => void;
}

export function StoreForm({
  createStore,
  updateStore,
  editingStore,
  setEditingStore,
}: StoreFormProps) {
  const [isUpdate, setIsUpdate] = useState(false);
  const imageOptions = [
    "/images/stores/store1.jpg",
    "/images/stores/store2.jpg",
    "/images/stores/store3.jpg",
  ];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      location: "",
      opening_time: "09:00:00",
      closing_time: "21:00:00",
      status: "Open",
      photo: undefined,
    },
  });

  useEffect(() => {
    if (editingStore) {
      setIsUpdate(true);
      form.reset({
        name: editingStore.name,
        location: editingStore.location || "",
        opening_time: editingStore.opening_time,
        closing_time: editingStore.closing_time,
        status: editingStore.status,
        photo: editingStore.photo || undefined,
      });
    } else {
      setIsUpdate(false);
      form.reset();
    }
  }, [editingStore, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (isUpdate && editingStore) {
      await updateStore(
        editingStore.store_id,
        values.name,
        values.photo,
        values.opening_time,
        values.closing_time,
        values.location,
        values.status
      );
      setEditingStore(null);
    } else {
      await createStore(
        values.name,
        values.photo,
        values.opening_time,
        values.closing_time,
        values.location,
        values.status
      );
    }
    form.reset();
  }

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-center text-primary">
          {isUpdate ? "Edit Store" : "Create New Store"}
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
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Store name" {...field} />
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
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Location" {...field} />
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
                  <FormLabel>Opening Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
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
                  <FormLabel>Closing Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
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
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Input placeholder="Status (Open/Closed)" {...field} />
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
                  <FormLabel>Photo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an image (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {imageOptions.map((image) => (
                        <SelectItem key={image} value={image}>
                          {image}
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
                    setEditingStore(null);
                    form.reset();
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
