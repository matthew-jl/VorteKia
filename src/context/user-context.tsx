"use client";

import { ApiResponse, Customer } from "@/types";
import { invoke } from "@tauri-apps/api/core";
import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useRef,
} from "react";

interface UserContextType {
  sessionToken: string | null;
  uid: string | null;
  customerName: string | null;
  virtualBalance: string | null;
  setVirtualBalance: React.Dispatch<React.SetStateAction<string | null>>;
  login: (token: string, userId: string, name: string, balance: string) => void;
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
  const inactivityTimer = useRef<number | null>(null);

  useEffect(() => {
    const storedSessionToken = localStorage.getItem("sessionToken");
    const storedUid = localStorage.getItem("uid");

    if (storedSessionToken && storedUid) {
      // Re-establish session from localStorage
      reLoginFromStorage(storedSessionToken, storedUid);
    }
  }, []);

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
        }
      } else if (detailsResponse.status === "error") {
        console.error(
          "Error fetching customer details during auto-login:",
          detailsResponse.message
        );
      } else {
        console.error(
          "Unexpected response status during auto-login:",
          detailsResponse
        );
      }
    } catch (error) {
      console.error(
        "Error invoking get_customer_details during auto-login:",
        error
      );
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
    localStorage.setItem("sessionToken", token);
    localStorage.setItem("uid", userId);
    resetInactivityTimer();
  };

  const logoutUser = () => {
    setSessionToken(null);
    setUid(null);
    setCustomerName(null);
    setVirtualBalance(null);
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("uid");
  };

  const logout = () => {
    logoutUser();
  };

  const isLoggedIn = () => !!sessionToken; // Check if sessionToken is not null/empty

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current); // Clear existing timer
    }
    inactivityTimer.current = window.setTimeout(() => {
      // Set new timer
      console.log("Logging out customer due to inactivity.");
      logoutUser(); // Call logout function after timeout
    }, 60 * 1000); // 1 minute (60 seconds * 1000 milliseconds)
  };

  useEffect(() => {
    const handleActivity = () => {
      resetInactivityTimer(); // Reset timer on any activity
    };

    // Add event listeners for user activity on the *window*
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);

    resetInactivityTimer(); // Initial timer setup on login/component mount

    return () => {
      // Cleanup function: Clear timer and remove event listeners
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, [isLoggedIn]); // Dependency on isLoggedIn to start/stop timer based on login state

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
