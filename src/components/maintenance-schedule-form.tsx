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
import { MaintenanceSchedule, Ride, Staff } from "@/types"; // Import MaintenanceSchedule, Ride, Staff types
import { Save, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "./ui/textarea";

const formSchema = z.object({
  ride_id: z.string().min(1, { message: "Ride is required." }),
  staff_id: z.string().min(1, { message: "Staff is required." }),
  description: z.string().optional(),
  start_date: z.string().min(1, { message: "Start Date is required." }),
  end_date: z.string().min(1, { message: "End Date is required." }),
  status: z.string().min(1, { message: "Status is required." }),
});

interface MaintenanceScheduleFormProps {
  createMaintenanceSchedule: (
    ride_id: string,
    staff_id: string,
    description: string | undefined,
    start_date: string,
    end_date: string,
    status: string
  ) => Promise<void>;
  updateMaintenanceSchedule: (
    maintenance_task_id: string,
    ride_id: string,
    staff_id: string,
    description: string | undefined,
    start_date: string,
    end_date: string,
    status: string
  ) => Promise<void>;
  editingMaintenanceSchedule: MaintenanceSchedule | null;
  setEditingMaintenanceSchedule: (
    maintenanceSchedule: MaintenanceSchedule | null
  ) => void;
  rides: Ride[]; // Prop to receive rides
  maintenanceStaffList: Staff[]; // Prop to receive maintenance staff list
}

export function MaintenanceScheduleForm({
  createMaintenanceSchedule,
  updateMaintenanceSchedule,
  editingMaintenanceSchedule,
  setEditingMaintenanceSchedule,
  rides,
  maintenanceStaffList,
}: MaintenanceScheduleFormProps) {
  const [isUpdate, setIsUpdate] = useState(false);

  const defaultValues = {
    ride_id: "",
    staff_id: "",
    description: "",
    start_date: "",
    end_date: "",
    status: "Pending",
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    if (editingMaintenanceSchedule) {
      setIsUpdate(true);
      form.reset({
        ride_id: editingMaintenanceSchedule.ride_id,
        staff_id: editingMaintenanceSchedule.staff_id,
        description: editingMaintenanceSchedule.description || "",
        start_date: editingMaintenanceSchedule.start_date.substring(
          0,
          editingMaintenanceSchedule.start_date.length - 3
        ),
        end_date: editingMaintenanceSchedule.end_date.substring(
          0,
          editingMaintenanceSchedule.end_date.length - 3
        ),
        status: editingMaintenanceSchedule.status,
      });
    } else {
      setIsUpdate(false);
      form.reset(defaultValues);
    }
  }, [editingMaintenanceSchedule, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isUpdate && editingMaintenanceSchedule) {
      updateMaintenanceSchedule(
        editingMaintenanceSchedule.maintenance_task_id,
        values.ride_id,
        values.staff_id,
        values.description,
        values.start_date,
        values.end_date,
        values.status
      );
      setEditingMaintenanceSchedule(null);
    } else {
      createMaintenanceSchedule(
        values.ride_id,
        values.staff_id,
        values.description,
        values.start_date,
        values.end_date,
        values.status
      );
    }
    form.reset();
  }

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-center text-primary">
          {isUpdate ? "Edit Schedule" : "Create Schedule"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Ride Select Field */}
            <FormField
              control={form.control}
              name="ride_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ride</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a ride" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rides.map((ride) => (
                        <SelectItem key={ride.ride_id} value={ride.ride_id}>
                          {ride.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Staff Select Field */}
            <FormField
              control={form.control}
              name="staff_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maintenance Staff</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Maintenance Staff" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {maintenanceStaffList.map((staff) => (
                        <SelectItem key={staff.staff_id} value={staff.staff_id}>
                          {staff.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Status Select Field */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Ongoing">Ongoing</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Description Input Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Maintenance task description (optional)"
                      className="min-h-24 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Start Date Input Field */}
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* End Date Input Field */}
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
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
                    setEditingMaintenanceSchedule(null);
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
