"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Context ──────────────────────────────────────────────────────────────────

const HospitalContext = createContext<HospitalContextValue>({
  hospital: null,
  loading: true,
  reload: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function HospitalProvider({ children }: { children: React.ReactNode }) {
  const [hospital, setHospital] = useState<HospitalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const hospitalId =
      typeof window !== "undefined"
        ? localStorage.getItem("hospital_id")
        : null;

    // No hospital_id means we're on a public page (landing/login) — exit early
    if (!hospitalId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    api
      .get<HospitalConfig>(`/api/v1/admin/hospital/${hospitalId}`)
      .then(({ data }) => {
        if (cancelled) return;
        setHospital(data);

        // Apply brand color as CSS variable
        if (data.primary_color) {
          document.documentElement.style.setProperty(
            "--color-primary",
            data.primary_color
          );
        }
      })
      .catch(() => {
        // Silently fail — hospital config is decorative, not critical
        if (!cancelled) setHospital(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  return (
    <HospitalContext.Provider value={{ hospital, loading, reload }}>
      {children}
    </HospitalContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useHospital(): HospitalContextValue {
  return useContext(HospitalContext);
}
