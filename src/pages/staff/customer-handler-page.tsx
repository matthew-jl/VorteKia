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
import { Edit, Trash2 } from "lucide-react";
import { useStaffUser } from "@/context/staff-user-context";

function CustomerHandlerPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const { staffRole } = useStaffUser();

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
  async function createCustomer(name: string, virtual_balance: string) {
    try {
      const response = await invoke<ApiResponse<string>>("save_customer_data", {
        name,
        virtualBalance: virtual_balance,
      });

      if (response.status === "error") {
        console.error("Error creating customer:", response.message);
      } else {
        setCustomers((prevCustomers) => [
          ...prevCustomers,
          { customer_id: response.data!, name, virtual_balance },
        ]);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  }

  // Update an existing customer
  async function updateCustomer(
    customer_id: string,
    name: string,
    virtual_balance: string
  ) {
    try {
      const response = await invoke<ApiResponse<string>>(
        "update_customer_data",
        {
          customerId: customer_id,
          name,
          virtualBalance: virtual_balance,
        }
      );

      if (response.status === "error") {
        console.error("Error updating customer:", response.message);
      } else {
        setCustomers((prevCustomers) =>
          prevCustomers.map((customer) =>
            customer.customer_id === customer_id
              ? { ...customer, name, virtual_balance }
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
  async function deleteCustomer(customer_id: string) {
    try {
      const response = await invoke<ApiResponse<string>>(
        "delete_customer_data",
        {
          customerId: customer_id,
        }
      );

      if (response.status === "error") {
        console.error("Error deleting customer:", response.message);
      } else {
        setCustomers((prevCustomers) =>
          prevCustomers.filter(
            (customer) => customer.customer_id !== customer_id
          )
        );
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  }

  return (
    <div className="relative min-h-screen">
      {/* Background image with overlay */}
      <div
        className="fixed inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: "url('/images/themeparkbg_2.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-black/70"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Customer Management
        </h1>

        <div className="grid gap-8 md:grid-cols-[1fr_1.5fr] lg:grid-cols-[1fr_2fr]">
          {/* Form Section */}
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
            <CustomerForm
              createCustomer={createCustomer}
              updateCustomer={updateCustomer}
              editingCustomer={editingCustomer}
              setEditingCustomer={setEditingCustomer}
            />
          </div>

          {/* Table Section */}
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>VorteKia Customer Accounts</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">UID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Virtual Balance (IDR)</TableHead>
                    {/* <TableHead className="text-right">Actions</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.customer_id}>
                      <TableCell className="font-medium">
                        {customer.customer_id}
                      </TableCell>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.virtual_balance}</TableCell>
                      {/* <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingCustomer(customer)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
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
                                  permanently delete the customer and their
                                  data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    deleteCustomer(customer.customer_id)
                                  }
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell> */}
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

export default CustomerHandlerPage;
