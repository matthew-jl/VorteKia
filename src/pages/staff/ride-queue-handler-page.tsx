"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiResponse, RideQueue } from "@/types";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { invoke } from "@tauri-apps/api/core";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import Decimal from "decimal.js";

interface RideQueueHandlerPageProps {
  rideId: string;
  rideName: string;
}

const formSchema = z.object({
  customer_id: z.string().min(1, { message: "Customer ID is required" }),
});

function RideQueueHandlerPage({ rideId, rideName }: RideQueueHandlerPageProps) {
  const [rideQueues, setRideQueues] = useState<RideQueue[]>([]);

  // Fetch ride queues for the specific ride
  async function fetchRideQueues() {
    try {
      const response = await invoke<ApiResponse<RideQueue[]>>(
        "view_ride_queues",
        {
          rideId,
        }
      );
      if (response.status === "success" && response.data) {
        setRideQueues(
          response.data.sort((a, b) =>
            new Decimal(a.queue_position).comparedTo(
              new Decimal(b.queue_position)
            )
          )
        );
        console.log("Fetched ride queues:", response.data);
      } else {
        console.error("Error fetching ride queues:", response.message);
      }
    } catch (error) {
      console.error("Unexpected error fetching ride queues:", error);
    }
  }

  useEffect(() => {
    fetchRideQueues();
  }, [rideId]);

  // Move queue position up (decrease position)
  async function moveUp(ride_queue_id: string) {
    const currentIndex = rideQueues.findIndex(
      (q) => q.ride_queue_id === ride_queue_id
    );
    if (currentIndex <= 0) return; // Can't move up if already first

    const current = new Decimal(rideQueues[currentIndex].queue_position);
    const previous = new Decimal(rideQueues[currentIndex - 1].queue_position);
    let newPosition: Decimal;

    if (currentIndex === 1) {
      // If moving to the first position, place it before the current first
      newPosition = previous.minus(1);
    } else {
      const prevPrev = new Decimal(rideQueues[currentIndex - 2].queue_position);
      const difference = previous.minus(prevPrev);
      newPosition = previous.minus(difference.dividedBy(2));
    }

    try {
      const response = await invoke<ApiResponse<string>>(
        "update_queue_position",
        {
          rideQueueId: ride_queue_id,
          queuePosition: newPosition.toString(),
        }
      );
      if (response.status === "success") {
        setRideQueues((prev) =>
          prev
            .map((q) =>
              q.ride_queue_id === ride_queue_id
                ? { ...q, queue_position: newPosition.toString() }
                : q
            )
            .sort((a, b) =>
              new Decimal(a.queue_position).comparedTo(
                new Decimal(b.queue_position)
              )
            )
        );
      } else {
        console.error("Error moving queue position up:", response.message);
      }
    } catch (error) {
      console.error("Unexpected error moving queue position up:", error);
    }
  }

  // Move queue position down (increase position)
  async function moveDown(ride_queue_id: string) {
    const currentIndex = rideQueues.findIndex(
      (q) => q.ride_queue_id === ride_queue_id
    );
    if (currentIndex >= rideQueues.length - 1) return; // Can't move down if already last

    const current = new Decimal(rideQueues[currentIndex].queue_position);
    const next = new Decimal(rideQueues[currentIndex + 1].queue_position);
    let newPosition: Decimal;

    if (currentIndex === rideQueues.length - 2) {
      // If moving to the last position, place it after the current last
      newPosition = next.plus(1);
    } else {
      const nextNext = new Decimal(rideQueues[currentIndex + 2].queue_position);
      const difference = nextNext.minus(next);
      newPosition = next.plus(difference.dividedBy(2));
    }

    try {
      const response = await invoke<ApiResponse<string>>(
        "update_queue_position",
        {
          rideQueueId: ride_queue_id,
          queuePosition: newPosition.toString(),
        }
      );
      if (response.status === "success") {
        setRideQueues((prev) =>
          prev
            .map((q) =>
              q.ride_queue_id === ride_queue_id
                ? { ...q, queue_position: newPosition.toString() }
                : q
            )
            .sort((a, b) =>
              new Decimal(a.queue_position).comparedTo(
                new Decimal(b.queue_position)
              )
            )
        );
      } else {
        console.error("Error moving queue position down:", response.message);
      }
    } catch (error) {
      console.error("Unexpected error moving queue position down:", error);
    }
  }

  // Delete a ride queue entry
  async function deleteRideQueue(ride_queue_id: string) {
    try {
      const response = await invoke<string>("delete_ride_queue_data", {
        rideQueueId: ride_queue_id,
      });
      setRideQueues((prev) =>
        prev.filter((q) => q.ride_queue_id !== ride_queue_id)
      );
    } catch (error) {
      console.error("Unexpected error deleting ride queue:", error);
    }
  }

  // Form handling for adding new ride queue entry
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_id: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const lastPosition =
      rideQueues.length > 0
        ? new Decimal(rideQueues[rideQueues.length - 1].queue_position)
            .plus(1)
            .toString()
        : "1"; // Default to 1 if queue is empty

    try {
      const response = await invoke<ApiResponse<string>>(
        "save_ride_queue_data",
        {
          rideId,
          customerId: values.customer_id,
          queuePosition: lastPosition,
        }
      );

      if (response.status === "success" && response.data) {
        setRideQueues((prev) =>
          [
            ...prev,
            {
              ride_queue_id: response.data!,
              ride_id: rideId,
              joined_at: new Date().toISOString(), // Approximate for now
              customer_id: values.customer_id,
              queue_position: lastPosition,
            },
          ].sort((a, b) =>
            new Decimal(a.queue_position).comparedTo(
              new Decimal(b.queue_position)
            )
          )
        );
        form.reset();
      } else {
        console.error("Error creating ride queue:", response.message);
      }
    } catch (error) {
      console.error("Unexpected error creating ride queue:", error);
    }
  }

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Ride Queue Management - Ride: {rideName}
        </h1>

        <div className="grid gap-8 md:grid-cols-[1fr_1.5fr] lg:grid-cols-[1fr_2fr]">
          {/* Form Section */}
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden p-6">
            <h2 className="text-xl font-bold text-primary mb-4">
              Add to Queue
            </h2>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/90">
                        Customer ID
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter customer ID"
                          {...field}
                          className="bg-background/50 backdrop-blur-sm border-primary/20 focus-visible:ring-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Add to Queue
                </Button>
              </form>
            </Form>
          </div>

          {/* Table Section */}
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>Ride Queue</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">UID</TableHead>
                    <TableHead>Customer ID</TableHead>
                    <TableHead>Queue Position</TableHead>
                    <TableHead>Joined At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rideQueues.map((queue) => (
                    <TableRow key={queue.ride_queue_id}>
                      <TableCell className="font-medium">
                        {queue.ride_queue_id}
                      </TableCell>
                      <TableCell>{queue.customer_id}</TableCell>
                      <TableCell>{queue.queue_position}</TableCell>
                      <TableCell>
                        {new Date(queue.joined_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveUp(queue.ride_queue_id)}
                            className="h-8 w-8"
                            disabled={
                              rideQueues.findIndex(
                                (q) => q.ride_queue_id === queue.ride_queue_id
                              ) === 0
                            }
                          >
                            <ChevronUp className="h-4 w-4" />
                            <span className="sr-only">Move Up</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveDown(queue.ride_queue_id)}
                            className="h-8 w-8"
                            disabled={
                              rideQueues.findIndex(
                                (q) => q.ride_queue_id === queue.ride_queue_id
                              ) ===
                              rideQueues.length - 1
                            }
                          >
                            <ChevronDown className="h-4 w-4" />
                            <span className="sr-only">Move Down</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you absolutely sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will
                                  permanently remove the customer from the
                                  queue.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    deleteRideQueue(queue.ride_queue_id)
                                  }
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RideQueueHandlerPage;
