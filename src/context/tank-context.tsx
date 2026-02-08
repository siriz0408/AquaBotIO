"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/hooks/use-user";

const LAST_TANK_KEY = "aquabotai_last_tank_id";

interface Tank {
  id: string;
  name: string;
  type: string;
  volume_gallons: number;
  photo_url: string | null;
}

interface TankContextValue {
  tanks: Tank[];
  activeTank: Tank | null;
  setActiveTank: (tank: Tank | null) => void;
  switchTank: (tankId: string) => void;
  isLoading: boolean;
  refreshTanks: () => Promise<void>;
}

const TankContext = createContext<TankContextValue | undefined>(undefined);

export function TankProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const { user, isLoading: userLoading } = useUser();
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [activeTank, setActiveTankState] = useState<Tank | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load tanks from database
  const loadTanks = useCallback(async () => {
    if (!user) {
      setTanks([]);
      setActiveTankState(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("tanks")
        .select("id, name, type, volume_gallons, photo_url")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const userTanks = data || [];
      setTanks(userTanks);

      // Restore last viewed tank from localStorage
      const lastTankId = localStorage.getItem(LAST_TANK_KEY);
      let tankToActivate: Tank | null = null;

      if (lastTankId) {
        tankToActivate = userTanks.find((t) => t.id === lastTankId) || null;
      }

      // If no last tank or it doesn't exist, use the first tank
      if (!tankToActivate && userTanks.length > 0) {
        tankToActivate = userTanks[0];
      }

      setActiveTankState(tankToActivate);
    } catch (error) {
      console.error("Error loading tanks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  // Load tanks when user changes
  useEffect(() => {
    if (!userLoading) {
      loadTanks();
    }
  }, [userLoading, loadTanks]);

  // Set active tank and persist to localStorage
  const setActiveTank = useCallback((tank: Tank | null) => {
    setActiveTankState(tank);
    if (tank) {
      localStorage.setItem(LAST_TANK_KEY, tank.id);
    } else {
      localStorage.removeItem(LAST_TANK_KEY);
    }
  }, []);

  // Switch to a tank by ID
  const switchTank = useCallback(
    (tankId: string) => {
      const tank = tanks.find((t) => t.id === tankId);
      if (tank) {
        setActiveTank(tank);
      }
    },
    [tanks, setActiveTank]
  );

  // Refresh tanks (for when a tank is added/edited/deleted)
  const refreshTanks = useCallback(async () => {
    await loadTanks();
  }, [loadTanks]);

  return (
    <TankContext.Provider
      value={{
        tanks,
        activeTank,
        setActiveTank,
        switchTank,
        isLoading,
        refreshTanks,
      }}
    >
      {children}
    </TankContext.Provider>
  );
}

export function useTank() {
  const context = useContext(TankContext);
  if (context === undefined) {
    throw new Error("useTank must be used within a TankProvider");
  }
  return context;
}
