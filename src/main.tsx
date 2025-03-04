import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router";
import RootLayout from "./layouts/root-layout";
import "./App.css";
import HomePage from "./pages";
import AboutPage from "./pages/about";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import RestaurantUI from "./pages/restaurant_ui";
import RideUI from "./pages/ride_ui";
import StoreUI from "./pages/store_ui";
import StaffUI from "./pages/staff_ui";
import CustomerUI from "./pages/customer_ui";
import { Button } from "./components/ui/button";

function MainPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

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
        setLoading(false); // Stop loading after the response is received
      }
    };

    fetchUiName();
  }, [navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return null;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <BrowserRouter>
    <Routes>
      {/* <Route path="/" element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
      </Route> */}
      <Route path="/" element={<MainPage />} />
      <Route path="/restaurant" element={<RestaurantUI />} />
      <Route path="/ride" element={<RideUI />} />
      <Route path="/store" element={<StoreUI />} />
      <Route path="/staff" element={<StaffUI />} />
      <Route path="/customer" element={<CustomerUI />} />
    </Routes>
  </BrowserRouter>
);
