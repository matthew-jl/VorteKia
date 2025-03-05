"use client";

import { ApiResponse, Customer } from "@/types";
import { invoke } from "@tauri-apps/api/core";
import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";

interface UserContextType {
  sessionToken: string | null;
  uid: string | null;
  customerName: string | null;
  virtualBalance: string | null;
  setVirtualBalance: React.Dispatch<React.SetStateAction<string | null>>;
  login: (
    token: string,
    userId: string,
    name: string, // Add name to login function
    balance: string
  ) => void;
  logout: () => void;
  isLoggedIn: () => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [virtualBalance, setVirtualBalance] = useState<string | null>(null);

  useEffect(() => {
    // useEffect to run on component mount (app start)
    const storedSessionToken = localStorage.getItem("sessionToken");
    const storedUid = localStorage.getItem("uid");

    if (storedSessionToken && storedUid) {
      // Re-establish session from localStorage
      reLoginFromStorage(storedSessionToken, storedUid);
    }
  }, []); // Empty dependency array means this effect runs only once on mount

  const reLoginFromStorage = async (
    storedToken: string,
    storedUserId: string
  ) => {
    try {
      const detailsResponse = await invoke<ApiResponse<Customer>>( // Assuming CustomerModel is your binding for entity::customer::Model
        "get_customer_details",
        { customerId: storedUserId }
      );

      if (detailsResponse.status === "success") {
        const customerDetails = detailsResponse.data;
        if (customerDetails) {
          login(
            storedToken,
            storedUserId,
            customerDetails.name,
            customerDetails.virtual_balance
          );
        } else {
          console.error(
            "Customer details missing in response during auto-login."
          );
          //   logout(); // Clear stored data if details cannot be fetched
        }
      } else if (detailsResponse.status === "error") {
        console.error(
          "Error fetching customer details during auto-login:",
          detailsResponse.message
        );
        // logout(); // Clear stored data on error
      } else {
        console.error(
          "Unexpected response status during auto-login:",
          detailsResponse
        );
        // logout(); // Clear stored data on unexpected status
      }
    } catch (error) {
      console.error(
        "Error invoking get_customer_details during auto-login:",
        error
      );
      //   logout(); // Clear stored data on invocation error
    }
  };

  const login = (
    token: string,
    userId: string,
    name: string,
    balance: string
  ) => {
    setSessionToken(token);
    setUid(userId);
    setCustomerName(name);
    setVirtualBalance(balance);
    // Optionally store sessionToken in localStorage or cookies for persistence
    localStorage.setItem("sessionToken", token);
    localStorage.setItem("uid", userId);
  };

  const logout = () => {
    setSessionToken(null);
    setUid(null);
    setCustomerName(null);
    setVirtualBalance(null);
    // Optionally remove sessionToken from localStorage or cookies
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("uid");
  };

  const isLoggedIn = () => !!sessionToken; // Check if sessionToken is not null/empty

  const value: UserContextType = {
    sessionToken,
    uid,
    customerName,
    virtualBalance,
    setVirtualBalance,
    login,
    logout,
    isLoggedIn,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
