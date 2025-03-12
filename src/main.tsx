import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router";
import "./App.css";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import RestaurantUI from "./pages/restaurant_ui";
import RideUI from "./pages/ride_ui";
import StoreUI from "./pages/store_ui";
import StaffUI from "./pages/staff_ui";
import CustomerUI from "./pages/customer_ui";
import RestaurantUIStaff from "./pages/restaurant_ui_staff";
import RideUIStaff from "./pages/ride_ui_staff";

function MainPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  useEffect(() => {
    const fetchUiName = async () => {
      try {
        const uiName = await invoke("get_ui_name_from_config");
        console.log("UI ID received from backend:", uiName);

        // Navigate to the UI based on the backend response
        navigate(`/${uiName}`);
      } catch (error) {
        console.error("Error invoking backend:", error);
      } finally {
        setLoading(false);
      }
    };

    const setupListener = async () => {
      const unlisten = await listen<"app-setup-complete">(
        "app-setup-complete",
        () => {
          // Await listen()
          console.log("App setup complete event received in frontend.");
          setIsSetupComplete(true);
        }
      );
      return unlisten; // Return the unlisten function
    };

    setupListener().then((unlisten) => {
      // Call setupListener and use .then to get unlisten
      // Call fetchUiName only AFTER setup is complete AND listener is set up
      if (isSetupComplete) {
        fetchUiName();
      }

      return () => {
        unlisten(); // Unlisten when component unmounts
      };
    });
  }, [navigate, isSetupComplete]);

  if (!isSetupComplete) {
    return <div>Loading App... (Waiting for backend setup)</div>;
  }

  if (loading) {
    return <div>Loading UI...</div>;
  }

  return null;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/restaurant/:restaurantId" element={<RestaurantUI />} />
      <Route
        path="/restaurant/:restaurantId/staff"
        element={<RestaurantUIStaff />}
      />
      <Route path="/ride/:rideId" element={<RideUI />} />
      <Route path="/ride/:rideId/staff" element={<RideUIStaff />} />
      <Route path="/store/:storeId" element={<StoreUI />} />
      <Route path="/staff" element={<StaffUI />} />
      <Route path="/customer" element={<CustomerUI />} />
    </Routes>
  </BrowserRouter>
);
