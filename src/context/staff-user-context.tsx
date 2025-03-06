"use client";

import { ApiResponse, Staff } from "@/types";
import { invoke } from "@tauri-apps/api/core";
import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";

interface StaffUserContextType {
  sessionToken: string | null;
  staffId: string | null;
  staffName: string | null;
  staffRole: string | null;
  login: (token: string, staffId: string, name: string, role: string) => void;
  logout: () => void;
  isLoggedIn: () => boolean;
}

const StaffUserContext = createContext<StaffUserContextType | undefined>(
  undefined
);

interface StaffUserProviderProps {
  children: ReactNode;
}

export const StaffUserProvider: React.FC<StaffUserProviderProps> = ({
  children,
}) => {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [staffName, setStaffName] = useState<string | null>(null);
  const [staffRole, setStaffRole] = useState<string | null>(null);

  useEffect(() => {
    const storedSessionToken = localStorage.getItem("staffSessionToken"); // Use different localStorage key
    const storedStaffId = localStorage.getItem("staffId"); // Use different localStorage key

    if (storedSessionToken && storedStaffId) {
      reLoginFromStorage(storedSessionToken, storedStaffId);
    }
  }, []);

  const reLoginFromStorage = async (
    storedToken: string,
    storedStaffId: string
  ) => {
    try {
      const detailsResponse = await invoke<ApiResponse<Staff>>(
        "get_staff_details",
        { staffId: storedStaffId }
      );

      if (detailsResponse.status === "success") {
        const staffDetails = detailsResponse.data;
        if (staffDetails) {
          login(
            storedToken,
            storedStaffId,
            staffDetails.name,
            staffDetails.role
          );
        } else {
          console.error("Staff details missing in response during auto-login.");
          logout();
        }
      } else if (detailsResponse.status === "error") {
        console.error(
          "Error fetching staff details during auto-login:",
          detailsResponse.message
        );
        logout();
      } else {
        console.error(
          "Unexpected response status during staff auto-login:",
          detailsResponse
        );
        logout();
      }
    } catch (error) {
      console.error(
        "Error invoking get_staff_details during staff auto-login:",
        error
      );
      logout();
    }
  };

  const login = (
    token: string,
    staffId: string,
    name: string,
    role: string
  ) => {
    setSessionToken(token);
    setStaffId(staffId);
    setStaffName(name);
    setStaffRole(role);
    localStorage.setItem("staffSessionToken", token); // Use different localStorage key
    localStorage.setItem("staffId", staffId); // Use different localStorage key
    localStorage.setItem("staffName", name); // Persist staff name
    localStorage.setItem("staffRole", role); // Persist staff role
  };

  const logout = () => {
    setSessionToken(null);
    setStaffId(null);
    setStaffName(null);
    setStaffRole(null);
    localStorage.removeItem("staffSessionToken"); // Use different localStorage key
    localStorage.removeItem("staffId"); // Use different localStorage key
    localStorage.removeItem("staffName"); // Clear persisted staff name
    localStorage.removeItem("staffRole"); // Clear persisted staff role
  };

  const isLoggedIn = () => !!sessionToken;

  const value: StaffUserContextType = {
    sessionToken,
    staffId,
    staffName,
    staffRole,
    login,
    logout,
    isLoggedIn,
  };

  return (
    <StaffUserContext.Provider value={value}>
      {children}
    </StaffUserContext.Provider>
  );
};

export const useStaffUser = () => {
  const context = useContext(StaffUserContext);
  if (!context) {
    throw new Error("useStaffUser must be used within a StaffUserProvider");
  }
  return context;
};
