"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { DialogFooter } from "@/components/ui/dialog";
import { useUser } from "@/context/user-context";
import { invoke } from "@tauri-apps/api/core";
import { ApiResponse } from "@/types";

// Define payment method type
type PaymentMethod = "gopay" | "ovo" | "virtual-account";

// Define form schema with validation
const formSchema = z.object({
  amount: z
    .string()
    .refine((val) => !isNaN(Number(val)), {
      message: "Amount must be a valid number",
    })
    .refine((val) => Number(val) > 0, {
      message: "Amount must be greater than 0",
    })
    .refine((val) => Number(val) <= 1000000, {
      message: "Amount must not exceed 1,000,000",
    }),
  paymentMethod: z.enum(["gopay", "ovo", "virtual-account"], {
    required_error: "Please select a payment method",
  }),
});

interface VirtualBalanceFormProps {
  onCancel: () => void;
}

export function VirtualBalanceForm({ onCancel }: VirtualBalanceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { uid, setVirtualBalance, virtualBalance } = useUser();

  // Initialize form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      paymentMethod: "gopay",
    },
  });

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);

      if (!uid) {
        toast.error("You must be logged in to top up your balance.");
        return; // Exit if no user ID
      }

      const topUpAmountStr = values.amount; // Amount is already a string from form

      const response = await invoke<ApiResponse<string>>(
        "top_up_virtual_balance",
        { customerId: uid, topUpAmountStr: topUpAmountStr } // Send amount as string
      );

      if (response.status === "success") {
        // Top-up successful
        const newBalanceStr = (
          Number(virtualBalance) + Number(topUpAmountStr)
        ).toString(); // Calculate new balance locally as string for UI update

        setVirtualBalance(newBalanceStr); // Update balance in UserContext

        // Show success message
        toast.success("Top-up Successful", {
          description: `Added ${topUpAmountStr} to your balance via ${values.paymentMethod}`,
        });

        // Reset form and close dialog
        form.reset();
        onCancel();
      } else if (response.status === "error") {
        toast.error("Top-up Failed", {
          description:
            response.message ||
            "There was an error processing your payment. Please try again.",
        });
        console.error("Top-up error:", response.message);
      } else {
        toast.error("Top-up Failed unexpectedly.");
      }
    } catch (error) {
      // Show error message
      toast.error("Top-up Failed", {
        description:
          "There was an error communicating with the server. Please try again.",
      });
      console.error("Top-up error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    IDR
                  </span>
                  <Input
                    placeholder="Enter amount"
                    {...field}
                    className="pl-12"
                    type="number"
                    min="1"
                    max="1000000"
                    step="1"
                  />
                </div>
              </FormControl>
              <FormDescription>
                Enter an amount between 1 and 1,000,000 IDR
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Payment Method</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="gopay" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      GoPay
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="ovo" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      OVO
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="virtual-account" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Virtual Account
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Top Up"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
