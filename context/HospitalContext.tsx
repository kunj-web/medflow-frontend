"use client";

import React, { createContext, useContext } from "react";

interface HospitalConfig {
  id: string;
  name: string;
  primary_color: string;
  currency: string;
  timezone: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface HospitalContextValue {
  hospital: HospitalConfig | null;
  loading: boolean;
  reload: () => void;
}

const HospitalContext = createContext<HospitalContextValue>({
  hospital: null,
  loading: false,
  reload: () => {},
});

export function HospitalProvider({ children }: { children: React.ReactNode }) {
  return (
    <HospitalContext.Provider
      value={{
        hospital: null,
        loading: false,
        reload: () => {},
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
}

export function useHospital(): HospitalContextValue {
  return useContext(HospitalContext);
}
