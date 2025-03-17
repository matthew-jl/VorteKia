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

export interface Ride {
  ride_id: string;
  status: string;
  name: string;
  price: string;
  location: string;
  staff_id: string;
  photo: string | undefined;
}

export interface RideQueue {
  ride_queue_id: string;
  ride_id: string;
  joined_at: string; // ISO string from DateTime
  customer_id: string;
  queue_position: string; // Decimal as string from backend
}

export interface OrderRestaurant {
  // Added OrderRestaurant
  order_restaurant_id: string;
  customer_id: string;
  restaurant_id: string;
  menu_item_id: string;
  quantity: number;
  timestamp: string; // ISO 8601 string
  status: string;
}

export interface Store {
  store_id: string;
  name: string;
  photo: string | undefined;
  opening_time: string; // ISO 8601 time string
  closing_time: string; // ISO 8601 time string
  location: string | undefined;
  status: string;
}

export interface Souvenir {
  souvenir_id: string;
  name: string;
  photo: string | undefined;
  price: string;
  stock: number;
  store_id: string;
}

export interface OrderSouvenir {
  order_souvenir_id: string;
  customer_id: string;
  store_id: string;
  souvenir_id: string;
  quantity: number;
  timestamp: string;
}

export interface LostAndFoundItemsLog {
  log_id: string;
  image: string | undefined;
  name: string;
  type: string;
  color: string;
  last_seen_location: string | undefined;
  finder: string | undefined;
  owner: string | undefined;
  found_location: string | undefined;
  timestamp: string;
  status: string;
}
