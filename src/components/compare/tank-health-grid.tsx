"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getHealthStatusColors } from "@/lib/health/calculate-health-score";
import type { HealthScoreResult } from "@/lib/health/calculate-health-score";

interface TankHealthData {
  id: string;
  name: string;
  type: string;
  volume_gallons: number;
  photo_url: string | null;
  healthScore: HealthScoreResult;
  latestParams: {
    temperature_f?: number | null;
    ph?: number | null;
    ammonia_ppm?: number | null;
  } | null;
  overdueTasks: number;
}

interface TankHealthGridProps {
  tanks: TankHealthData[];
  isLoading?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function getStatusIcon(status: HealthScoreResult["status"]) {
  switch (status) {
    case "excellent":
    case "good":
      return <CheckCircle2 className="h-5 w-5" />;
    case "fair":
      return <AlertTriangle className="h-5 w-5" />;
    case "poor":
    case "critical":
      return <AlertCircle className="h-5 w-5" />;
  }
}

function TankHealthCard({ tank }: { tank: TankHealthData }) {
  const colors = getHealthStatusColors(tank.healthScore.status);

  return (
    <Link href={`/tanks/${tank.id}`}>
      <motion.div variants={itemVariants}>
        <Card className={`overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 ${colors.border} border-2`}>
          <div className="relative h-32">
            {tank.photo_url ? (
              <img
                src={tank.photo_url}
                alt={tank.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-brand-cyan/20 to-brand-navy/20 flex items-center justify-center">
                <span className="text-4xl">
                  {tank.type === "saltwater" ? "🐠" : tank.type === "planted" ? "🌿" : "🐟"}
                </span>
              </div>
            )}
            {/* Health Score Badge */}
            <div className={`absolute top-2 right-2 ${colors.bg} ${colors.text} px-2 py-1 rounded-full text-sm font-semibold flex items-center gap-1`}>
              {getStatusIcon(tank.healthScore.status)}
              {tank.healthScore.overall}
            </div>
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-brand-navy truncate">{tank.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {tank.type.charAt(0).toUpperCase() + tank.type.slice(1)} &middot; {tank.volume_gallons}gal
            </p>

            {/* Key Parameters */}
            {tank.latestParams ? (
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-muted-foreground">Temp</div>
                  <div className="font-medium">
                    {tank.latestParams.temperature_f?.toFixed(1) || "-"}°F
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">pH</div>
                  <div className="font-medium">
                    {tank.latestParams.ph?.toFixed(1) || "-"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">NH3</div>
                  <div className="font-medium">
                    {tank.latestParams.ammonia_ppm?.toFixed(2) || "-"}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center">
                No parameters logged
              </p>
            )}

            {/* Overdue Tasks Warning */}
            {tank.overdueTasks > 0 && (
              <div className="mt-3 flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                <AlertTriangle className="h-3 w-3" />
                {tank.overdueTasks} overdue task{tank.overdueTasks > 1 ? "s" : ""}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}

export function TankHealthGrid({ tanks, isLoading }: TankHealthGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
      </div>
    );
  }

  if (tanks.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <div className="text-4xl mb-4">🐠</div>
          <h3 className="text-lg font-semibold mb-2">No Tanks Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first tank to see its health status here.
          </p>
          <Link
            href="/tanks/new"
            className="inline-block bg-brand-cyan text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-cyan/90"
          >
            Create Tank
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {tanks.map((tank) => (
        <TankHealthCard key={tank.id} tank={tank} />
      ))}
    </motion.div>
  );
}
