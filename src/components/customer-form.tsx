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
import { Textarea } from "./ui/textarea";
import { Customer } from "@/types";
import { Save, X } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2).max(50),
  virtual_balance: z.string().min(1).max(50), // You can adjust this as per your needs
});

interface CustomerFormProps {
  createCustomer: (name: string, virtual_balance: string) => Promise<void>;
  updateCustomer: (
    customer_id: string,
    name: string,
    virtual_balance: string
  ) => Promise<void>;
  editingCustomer: Customer | null;
  setEditingCustomer: (customer: Customer | null) => void;
}

export function CustomerForm({
  createCustomer,
  updateCustomer,
  editingCustomer,
  setEditingCustomer,
}: CustomerFormProps) {
  const [isUpdate, setIsUpdate] = useState(false);

  const defaultValues = {
    name: "",
    virtual_balance: "",
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    if (editingCustomer) {
      setIsUpdate(true);
      form.reset({
        name: editingCustomer.name,
        virtual_balance: editingCustomer.virtual_balance,
      });
    } else {
      setIsUpdate(false);
      form.reset(defaultValues);
    }
  }, [editingCustomer, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isUpdate && editingCustomer) {
      updateCustomer(
        editingCustomer.customer_id,
        values.name,
        values.virtual_balance
      );
      setEditingCustomer(null);
    } else {
      createCustomer(values.name, values.virtual_balance);
    }

    form.reset();
  }

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-center text-primary">
          {isUpdate ? "Edit Customer Account" : "Create New Customer Account"}
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
                      placeholder="Enter customer name"
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
              name="virtual_balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/90">
                    Virtual Balance
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter virtual balance"
                      {...field}
                      className="bg-background/50 backdrop-blur-sm border-primary/20 focus-visible:ring-primary"
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
                    setEditingCustomer(null);
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
