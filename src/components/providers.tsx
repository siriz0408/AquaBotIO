"use client";

import { ReactNode } from "react";
import { Toaster } from "sonner";
import { UserProvider } from "@/lib/hooks/use-user";
import { TankProvider } from "@/context/tank-context";
import { ScreenReaderAnnouncerProvider } from "@/components/accessibility";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <UserProvider>
      <TankProvider>
        <ScreenReaderAnnouncerProvider>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </ScreenReaderAnnouncerProvider>
      </TankProvider>
    </UserProvider>
  );
}
