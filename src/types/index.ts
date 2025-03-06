// ✅ Reusable API Response Interface
export interface ApiResponse<T> {
  status: "success" | "error";
  data: T | null;
  message: string | null;
}

// ✅ Reusable Post Interface
export interface Post {
  id: number;
  title: string;
  text: string;
}

export interface Customer {
  customer_id: string; // ID should match the customer schema
  name: string;
  virtual_balance: string;
}

export interface Staff {
  staff_id: string;
  email: string;
  name: string;
  role: string;
}

export interface Restaurant {
  restaurant_id: string;
  name: string;
  photo: string | undefined; // Or string | undefined if you prefer undefined for optional
  opening_time: string; // ISO 8601 time string
  closing_time: string; // ISO 8601 time string
  cuisine_type: string;
  location: string | undefined; // Or string | undefined
  status: string;
}

export interface MenuItem {
  menu_item_id: string;
  photo: string | undefined; // Or string | undefined
  name: string;
  price: string;
  restaurant_id: string;
}
