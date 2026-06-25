"use client";

import { useState, useEffect } from "react";
import { getMe, getStoredUser, isAuthenticated } from "@/lib/auth";
import { UserProfile } from "@/types/auth";
import { UserRole } from "@/types/common";

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    async function hydrateUser() {
      const stored = getStoredUser();
      if (stored) {
        if (active) {
          setUser(stored);
          setLoaded(true);
        }
        return;
      }

      if (!isAuthenticated()) {
        if (active) setLoaded(true);
        return;
      }

      try {
        const fresh = await getMe();
        if (!active) return;
        localStorage.setItem("user", JSON.stringify(fresh));
        setUser(fresh);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoaded(true);
      }
    }

    hydrateUser();

    return () => {
      active = false;
    };
  }, []);

  const isAdmin = user?.role === UserRole.ADMIN;
  const isDoctor = user?.role === UserRole.DOCTOR;
  const isPatient = user?.role === UserRole.PATIENT;

  return { user, loaded, isAdmin, isDoctor, isPatient };
}
