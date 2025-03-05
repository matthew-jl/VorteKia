import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiResponse, Customer } from "@/types";
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
import { CustomerForm } from "@/components/customer-form";

function CustomerHandlerPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Fetch all customers from the backend
  async function fetchCustomers() {
    try {
      const response = await invoke<ApiResponse<Customer[]>>(
        "view_customer_accounts"
      );
      setCustomers(response.data || []);
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Create a new customer
  async function createCustomer(name: string, virtualBalance: string) {
    try {
      const response = await invoke<ApiResponse<string>>("save_customer_data", {
        name,
        virtualBalance,
      });

      if (response.status === "error") {
        console.error("Error creating customer:", response.message);
      } else {
        setCustomers((prevCustomers) => [
          ...prevCustomers,
          { id: response.data!, name, virtualBalance },
        ]);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  }

  // Update an existing customer
  async function updateCustomer(
    id: string,
    name: string,
    virtualBalance: string
  ) {
    try {
      const response = await invoke<ApiResponse<string>>(
        "update_customer_data",
        {
          id,
          name,
          virtualBalance,
        }
      );

      if (response.status === "error") {
        console.error("Error updating customer:", response.message);
      } else {
        setCustomers((prevCustomers) =>
          prevCustomers.map((customer) =>
            customer.id === id
              ? { ...customer, name, virtualBalance }
              : customer
          )
        );
        setEditingCustomer(null);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  }

  // Delete a customer
  async function deleteCustomer(id: string) {
    try {
      const response = await invoke<ApiResponse<string>>(
        "delete_customer_data",
        {
          id,
        }
      );

      if (response.status === "error") {
        console.error("Error deleting customer:", response.message);
      } else {
        setCustomers((prevCustomers) =>
          prevCustomers.filter((customer) => customer.id !== id)
        );
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-xl flex-col gap-6">
        {/* Add customer form here */}
        <CustomerForm
          createCustomer={createCustomer}
          updateCustomer={updateCustomer}
          editingCustomer={editingCustomer}
          setEditingCustomer={setEditingCustomer}
        />

        <Table>
          <TableCaption>A list of your customers</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.id}</TableCell>
                <TableCell>{customer.name}</TableCell>
                <TableCell>{customer.virtualBalance}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setEditingCustomer(customer)}
                    >
                      Edit
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">Delete</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you absolutely sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete the customer and their data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteCustomer(customer.id)}
                          >
                            Continue
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
  );
}

export default CustomerHandlerPage;
