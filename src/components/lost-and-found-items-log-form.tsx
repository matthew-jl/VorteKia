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
import { Save, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CloudinaryUploader } from "./cloudinary-uploader";
import { LostAndFoundItemsLog } from "@/types";

// Zod schema for form validation
const formSchema = z
  .object({
    status: z.string(),
    name: z
      .string()
      .min(2, { message: "Name must be at least 2 characters." })
      .max(50),
    type: z.string().min(1, { message: "Type is required." }),
    color: z.string().min(1, { message: "Color is required." }),
    last_seen_location: z.string().optional(),
    finder: z.string().optional(),
    owner: z.string().optional(),
    found_location: z.string().optional(),
    image: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "Found") {
      if (!data.image) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          message: "Image is required for 'Found' status.",
          path: ["image"],
          minimum: 1,
          type: "string",
          inclusive: true,
        });
      }
      if (!data.found_location) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          message: "Found Location is required for 'Found' status.",
          path: ["found_location"],
          minimum: 1,
          type: "string",
          inclusive: true,
        });
      }
      if (!data.finder) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          message: "Finder information is required for 'Found' status.",
          path: ["finder"],
          minimum: 1,
          type: "string",
          inclusive: true,
        });
      }
    } else if (data.status === "Missing") {
      if (!data.last_seen_location) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          message: "Last Seen Location is required for 'Missing' status.",
          path: ["last_seen_location"],
          minimum: 1,
          type: "string",
          inclusive: true,
        });
      }
      if (!data.owner) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          message: "Owner information is required for 'Missing' status.",
          path: ["owner"],
          minimum: 1,
          type: "string",
          inclusive: true,
        });
      }
    }
  });

// Props interface
interface LostAndFoundItemsLogFormProps {
  createLog: (
    status: string,
    name: string,
    type: string,
    color: string,
    last_seen_location: string | undefined,
    finder: string | undefined,
    owner: string | undefined,
    found_location: string | undefined,
    image: string | undefined
  ) => Promise<void>;
  updateLog: (
    log_id: string,
    status: string,
    name: string,
    type: string,
    color: string,
    last_seen_location: string | undefined,
    finder: string | undefined,
    owner: string | undefined,
    found_location: string | undefined,
    image: string | undefined
  ) => Promise<void>;
  editingLog: LostAndFoundItemsLog | null;
  setEditingLog: (log: LostAndFoundItemsLog | null) => void;
}

export function LostAndFoundItemsLogForm({
  createLog,
  updateLog,
  editingLog,
  setEditingLog,
}: LostAndFoundItemsLogFormProps) {
  const [isUpdate, setIsUpdate] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);

  const defaultValues = {
    status: "Missing" as const,
    name: "",
    type: "",
    color: "",
    last_seen_location: "",
    finder: "",
    owner: "",
    found_location: "",
    image: "",
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Sync form with editingLog
  useEffect(() => {
    if (editingLog) {
      setIsUpdate(true);
      form.reset({
        status: editingLog.status,
        name: editingLog.name,
        type: editingLog.type,
        color: editingLog.color,
        last_seen_location: editingLog.last_seen_location || "",
        finder: editingLog.finder || "",
        owner: editingLog.owner || "",
        found_location: editingLog.found_location || "",
        image: editingLog.image || "",
      });
      setPhotoUrl(editingLog.image);
    } else {
      setIsUpdate(false);
      form.reset(defaultValues);
      setPhotoUrl(undefined);
    }
  }, [editingLog, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isUpdate && editingLog) {
      updateLog(
        editingLog.log_id,
        values.status,
        values.name,
        values.type,
        values.color,
        values.last_seen_location,
        values.finder,
        values.owner,
        values.found_location,
        values.image
      );
    } else {
      createLog(
        values.status,
        values.name,
        values.type,
        values.color,
        values.last_seen_location,
        values.finder,
        values.owner,
        values.found_location,
        values.image
      );
    }
    form.reset();
    setPhotoUrl(undefined);
  }

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-center text-primary">
          {isUpdate ? "Edit Log Entry" : "Create New Log Entry"}
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
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Returned to Owner">
                        Returned to Owner
                      </SelectItem>
                      <SelectItem value="Found">Found</SelectItem>
                      <SelectItem value="Missing">Missing</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter item name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter item type" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter item color" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_seen_location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Seen Location</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter last seen location"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="finder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Finder</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter finder name"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="owner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter owner name"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="found_location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Found Location</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter found location"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image</FormLabel>
                  <FormControl>
                    <CloudinaryUploader
                      imageUrl={photoUrl}
                      onImageChange={(url) => {
                        setPhotoUrl(url);
                        form.setValue("image", url || "");
                      }}
                      folder="lost_and_found"
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
                    setEditingLog(null);
                    form.reset(defaultValues);
                    setIsUpdate(false);
                    setPhotoUrl(undefined);
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
