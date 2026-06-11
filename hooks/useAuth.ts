"use client";

import { useState, useEffect } from "react";
import { getStoredUser } from "@/lib/auth";
import { UserProfile } from "@/types/auth";
import { UserRole } from "@/types/common";

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    setLoaded(true);
  }, []);

  const isAdmin = user?.role === UserRole.ADMIN;
  const isDoctor = user?.role === UserRole.DOCTOR;
  const isPatient = user?.role === UserRole.PATIENT;

  return { user, loaded, isAdmin, isDoctor, isPatient };
}
