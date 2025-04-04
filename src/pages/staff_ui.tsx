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
import MaintenanceScheduleHandlerPage from "./staff/maintenance-schedule-handler-page";
import IncomeReportPage from "./staff/income-report-page";

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
            {(staffRole === "FBSupervisor" ||
              staffRole === "Chef" ||
              staffRole === "Waiter" ||
              staffRole === "CustomerServiceManager" ||
              staffRole === "CustomerServiceStaff") && (
              <div>
                <RestaurantHandlerPage />
              </div>
            )}
            {(staffRole === "RideManager" ||
              staffRole === "RideStaff" ||
              staffRole === "CustomerServiceManager" ||
              staffRole === "CustomerServiceStaff" ||
              staffRole === "CEO" ||
              staffRole === "COO") && (
              <div>
                <RideHandlerPage />
              </div>
            )}
            {(staffRole === "RetailManager" ||
              staffRole === "SalesAssociate" ||
              staffRole === "CEO") && (
              <div>
                <StoreHandlerPage />
              </div>
            )}
            {staffRole === "LostAndFoundStaff" && (
              <div>
                <LostAndFoundItemsLogHandlerPage />
              </div>
            )}
            {(staffRole === "MaintenanceManager" ||
              staffRole === "MaintenanceStaff" ||
              staffRole === "RideManager" ||
              staffRole === "CEO" ||
              staffRole === "COO") && (
              <div>
                <MaintenanceScheduleHandlerPage />
              </div>
            )}
            {(staffRole === "CFO" ||
              staffRole === "FBSupervisor" ||
              staffRole === "RetailManager") && (
              <div>
                <IncomeReportPage />
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
