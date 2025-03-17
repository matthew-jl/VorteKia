"use client";
import StaffHandlerPage from "./staff/staff-handler-page";
import CustomerHandlerPage from "./staff/customer-handler-page";
import { StaffUserProvider, useStaffUser } from "@/context/staff-user-context"; // Import StaffUserProvider and useStaffUser
import RestaurantHandlerPage from "./staff/restaurant-handler-page";
import RideHandlerPage from "./staff/ride-handler-page";
import { StaffNavbar } from "@/components/staff-navbar";
import { AccessRequiredScreen } from "@/components/access-required-screen";
import StoreHandlerPage from "./staff/store-handler-page";
import LostAndFoundItemsLogHandlerPage from "./staff/lost-and-found-items-log-handler-page";

function StaffUIComponent() {
  const { isLoggedIn, staffRole } = useStaffUser();

  return (
    <div className="flex flex-col min-h-screen">
      <StaffNavbar />

      {/* Main Content Area (you can add staff-specific content below the navbar) */}
      <main className="container mx-auto px-4 py-8 flex-1">
        {isLoggedIn() ? (
          <div>
            {/* Staff Dashboard based on role */}
            {staffRole === "COO" && (
              <div>
                <StaffHandlerPage />
              </div>
            )}
            {(staffRole === "CustomerServiceManager" ||
              staffRole === "CustomerServiceStaff") && (
              <div>
                <CustomerHandlerPage />
              </div>
            )}
            {staffRole === "FBSupervisor" && (
              <div>
                <RestaurantHandlerPage />
              </div>
            )}
            {staffRole === "RideManager" && (
              <div>
                <RideHandlerPage />
              </div>
            )}
            {staffRole === "RetailManager" && (
              <div>
                <StoreHandlerPage />
              </div>
            )}
            {staffRole === "LostAndFoundStaff" && (
              <div>
                <LostAndFoundItemsLogHandlerPage />
              </div>
            )}
          </div>
        ) : (
          <AccessRequiredScreen
            isLoggedIn={isLoggedIn()}
            staffPortalName="VorteKia Theme Park Staff UI"
            entityName="management features"
            backgroundImageUrl="/images/themeparkbg_2.jpg"
          />
        )}
      </main>
    </div>
  );
}

export default function StaffUI() {
  return (
    <StaffUserProvider>
      <StaffUIComponent />
    </StaffUserProvider>
  );
}
