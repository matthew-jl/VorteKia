import type { Ride } from "./types";

// export const restaurants: Restaurant[] = [
//   {
//     id: "r1",
//     name: "Cosmic Café",
//     description:
//       "Futuristic dining with a view of the stars. Enjoy our space-themed dishes and drinks.",
//     cuisine: "International",
//     image: "/placeholder.svg?height=400&width=600",
//     isOpen: true,
//     menu: [
//       {
//         id: "m1",
//         name: "Galaxy Burger",
//         description: "A juicy burger with our special cosmic sauce",
//         price: 12.99,
//       },
//       {
//         id: "m2",
//         name: "Asteroid Fries",
//         description: "Crispy fries with meteor dust seasoning",
//         price: 5.99,
//       },
//     ],
//   },
//   {
//     id: "r2",
//     name: "Neon Noodles",
//     description:
//       "Glowing noodles and vibrant Asian fusion dishes in a cyberpunk setting.",
//     cuisine: "Asian",
//     image: "/placeholder.svg?height=400&width=600",
//     isOpen: true,
//   },
//   {
//     id: "r3",
//     name: "Quantum Bites",
//     description:
//       "Molecular gastronomy at its finest. Experience food in a whole new dimension.",
//     cuisine: "Molecular",
//     image: "/placeholder.svg?height=400&width=600",
//     isOpen: false,
//   },
//   {
//     id: "r4",
//     name: "Retro Diner",
//     description:
//       "Classic American comfort food with a 1950s vibe and modern twist.",
//     cuisine: "American",
//     image: "/placeholder.svg?height=400&width=600",
//     isOpen: true,
//   },
//   {
//     id: "r5",
//     name: "Virtual Veggie",
//     description:
//       "Plant-based delights that taste like the real thing, served in an augmented reality environment.",
//     cuisine: "Vegetarian",
//     image: "/placeholder.svg?height=400&width=600",
//     isOpen: true,
//   },
//   {
//     id: "r6",
//     name: "Hologram Sushi",
//     description:
//       "Traditional Japanese cuisine with a high-tech presentation using holographic displays.",
//     cuisine: "Japanese",
//     image: "/placeholder.svg?height=400&width=600",
//     isOpen: true,
//   },
// ];

export const rides: Ride[] = [
  {
    id: "ride1",
    name: "Quantum Coaster",
    description:
      "Experience quantum physics in action with this gravity-defying roller coaster.",
    image: "/placeholder.svg?height=400&width=600",
    queueCount: 45,
    waitTime: 30,
    price: 15.99,
    intensity: "High",
  },
  {
    id: "ride2",
    name: "Virtual Voyager",
    description:
      "A VR-enhanced dark ride that takes you through multiple dimensions.",
    image: "/placeholder.svg?height=400&width=600",
    queueCount: 20,
    waitTime: 15,
    price: 12.99,
    intensity: "Medium",
  },
  {
    id: "ride3",
    name: "Hover Pods",
    description:
      "Float above the park in your own magnetic hover pod. Control your own path!",
    image: "/placeholder.svg?height=400&width=600",
    queueCount: 15,
    waitTime: 10,
    price: 8.99,
    intensity: "Low",
  },
  {
    id: "ride4",
    name: "Time Warp",
    description:
      "A spinning ride that simulates time travel with incredible special effects.",
    image: "/placeholder.svg?height=400&width=600",
    queueCount: 30,
    waitTime: 25,
    price: 14.99,
    intensity: "High",
  },
  {
    id: "ride5",
    name: "Neon Rapids",
    description:
      "A water ride through glowing neon canyons that react to your movements.",
    image: "/placeholder.svg?height=400&width=600",
    queueCount: 25,
    waitTime: 20,
    price: 10.99,
    intensity: "Medium",
  },
  {
    id: "ride6",
    name: "Gravity Garden",
    description:
      "A peaceful anti-gravity experience where you can float among exotic plants.",
    image: "/placeholder.svg?height=400&width=600",
    queueCount: 10,
    waitTime: 5,
    price: 7.99,
    intensity: "Low",
  },
];
