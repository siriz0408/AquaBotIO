"use client";

import { ReactNode } from "react";
import { Toaster } from "sonner";
import { UserProvider } from "@/lib/hooks/use-user";
import { TankProvider } from "@/context/tank-context";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <UserProvider>
      <TankProvider>
        {children}
        <Toaster position="top-center" richColors closeButton />
      </TankProvider>
    </UserProvider>
  );
}
