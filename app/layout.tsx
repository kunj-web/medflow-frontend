import type { Metadata } from "next";
import "@/app/globals.css";
import { HospitalProvider } from "@/context/HospitalContext";

export const metadata: Metadata = {
  title: "MedFlow — Hospital Operations Platform",
  description:
    "AI-native hospital operations platform. Manage appointments, billing, doctors, and patients in one place.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <HospitalProvider>{children}</HospitalProvider>
      </body>
    </html>
  );
}
