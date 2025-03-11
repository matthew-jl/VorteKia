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
import { Staff } from "@/types"; // Import Staff interface
import { Save, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

// Define Role Options
const roleOptions = [
  "CustomerServiceStaff",
  "CustomerServiceManager",
  "LostAndFoundStaff",
  "RideStaff",
  "RideManager",
  "MaintenanceStaff",
  "MaintenanceManager",
  "FBSupervisor",
  "Chef",
  "Waiter",
  "SalesAssociate",
  "RetailManager",
  "COO",
  "CEO",
  "CFO",
] as const;

const baseFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  name: z
    .string()
    .min(2)
    .max(50, { message: "Name must be between 2 and 50 characters." }),
  role: z.enum(roleOptions, {
    required_error: "Please select a staff role.",
  }),
});

const createStaffSchema = baseFormSchema
  .extend({
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters." }),
    confirmPassword: z
      .string()
      .min(6, { message: "Confirm password must be at least 6 characters." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const updateStaffSchema = baseFormSchema.extend({
  password: z.string().optional(), // Password is optional for updates
  confirmPassword: z.string().optional(), // Confirm password is optional for updates
});

interface StaffFormProps {
  createStaff: (
    email: string,
    password: string,
    name: string,
    role: string
  ) => Promise<void>;
  updateStaff: (
    staff_id: string,
    email: string,
    name: string,
    role: string
  ) => Promise<void>;
  editingStaff: Staff | null;
  setEditingStaff: (staff: Staff | null) => void;
}

export function StaffForm({
  createStaff,
  updateStaff,
  editingStaff,
  setEditingStaff,
}: StaffFormProps) {
  const [isUpdate, setIsUpdate] = useState(false);

  const defaultValues = {
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    role: roleOptions[0],
  };

  // Dynamically choose schema based on isUpdate state
  const currentSchema = isUpdate ? updateStaffSchema : createStaffSchema;

  const form = useForm<z.infer<typeof currentSchema>>({
    // Use dynamic schema
    resolver: zodResolver(currentSchema), // Use dynamic schema
    defaultValues,
  });

  useEffect(() => {
    if (editingStaff) {
      setIsUpdate(true);
      form.reset({
        email: editingStaff.email,
        name: editingStaff.name,
        role: editingStaff.role as z.infer<typeof currentSchema>["role"], // Use dynamic schema type
        password: "", // Password should not be pre-filled for edit
        confirmPassword: "", // Confirm password also should not be pre-filled
      });
    } else {
      setIsUpdate(false);
      form.reset(defaultValues);
    }
  }, [editingStaff, form, isUpdate, currentSchema]); // Add isUpdate and currentSchema to dependency array

  function onSubmit(values: z.infer<typeof currentSchema>) {
    // Use dynamic schema type
    if (isUpdate && editingStaff) {
      console.log("Edit Staff");
      updateStaff(
        editingStaff.staff_id,
        values.email,
        values.name,
        values.role
      );
      setEditingStaff(null);
    } else {
      createStaff(
        values.email,
        values.password as string, // Explicit cast because password can be optional in schema but required for createStaff prop
        values.name,
        values.role
      );
    }

    form.reset();
  }

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-center text-primary">
          {isUpdate ? "Edit Staff Account" : "Create New Staff Account"}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/90">Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter staff email"
                      {...field}
                      className="bg-background/50 backdrop-blur-sm border-primary/20 focus-visible:ring-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isUpdate && ( // Conditionally render password field only for create
              <>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/90">
                        Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter staff password"
                          {...field}
                          type="password" // Password type for security
                          className="bg-background/50 backdrop-blur-sm border-primary/20 focus-visible:ring-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/90">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Confirm staff password"
                          {...field}
                          type="password" // Password type for security
                          className="bg-background/50 backdrop-blur-sm border-primary/20 focus-visible:ring-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/90">Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter staff name"
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
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/90">Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    {" "}
                    {/* Use Select */}
                    <FormControl>
                      <SelectTrigger className="bg-background/50 backdrop-blur-sm border-primary/20 focus-visible:ring-primary">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
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
                    setEditingStaff(null);
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
