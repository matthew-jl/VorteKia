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

const formSchema = z.object({
  name: z.string().min(2).max(50),
  virtualBalance: z.string().min(1).max(50), // You can adjust this as per your needs
});

interface CustomerFormProps {
  createCustomer: (name: string, virtualBalance: string) => Promise<void>;
  updateCustomer: (
    id: string,
    name: string,
    virtualBalance: string
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
    virtualBalance: "",
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
        virtualBalance: editingCustomer.virtualBalance,
      });
    } else {
      setIsUpdate(false);
      form.reset(defaultValues);
    }
  }, [editingCustomer, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isUpdate && editingCustomer) {
      updateCustomer(editingCustomer.id, values.name, values.virtualBalance);
      setEditingCustomer(null);
    } else {
      createCustomer(values.name, values.virtualBalance);
    }

    form.reset();
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">
          {isUpdate ? "Edit Customer" : "Create New Customer"}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter customer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="virtualBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Virtual Balance</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter virtual balance" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-4">
              <Button type="submit">{isUpdate ? "Update" : "Save"}</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditingCustomer(null);
                  form.reset(defaultValues);
                  setIsUpdate(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
