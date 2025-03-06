// export interface Restaurant {
//   id: string;
//   name: string;
//   description: string;
//   cuisine: string;
//   image: string;
//   isOpen: boolean;
//   menu?: MenuItem[];
// }

// export interface MenuItem {
//   id: string;
//   name: string;
//   description: string;
//   price: number;
//   image?: string;
// }

export interface Ride {
  id: string;
  name: string;
  description: string;
  image: string;
  queueCount: number;
  waitTime: number;
  price: number;
  intensity: "Low" | "Medium" | "High";
}
