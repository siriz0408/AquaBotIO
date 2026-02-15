/**
 * Tank Health Score Calculation
 *
 * Health score is calculated based on (per Spec 11):
 * 1. % of parameters within safe zone (50% weight)
 * 2. Maintenance consistency score (30% weight)
 * 3. Days since last parameter log (20% weight)
 */

// Parameter safe ranges by tank type
const SAFE_RANGES: Record<string, Record<string, { min: number; max: number }>> = {
  freshwater: {
    temperature_f: { min: 72, max: 82 },
    ph: { min: 6.5, max: 7.8 },
    ammonia_ppm: { min: 0, max: 0.25 },
    nitrite_ppm: { min: 0, max: 0.25 },
    nitrate_ppm: { min: 0, max: 40 },
  },
  saltwater: {
    temperature_f: { min: 75, max: 82 },
    ph: { min: 8.0, max: 8.4 },
    ammonia_ppm: { min: 0, max: 0.1 },
    nitrite_ppm: { min: 0, max: 0.1 },
    nitrate_ppm: { min: 0, max: 20 },
    salinity_ppt: { min: 32, max: 36 },
    calcium_ppm: { min: 380, max: 450 },
    alkalinity_dkh: { min: 7, max: 11 },
  },
  brackish: {
    temperature_f: { min: 74, max: 82 },
    ph: { min: 7.5, max: 8.4 },
    ammonia_ppm: { min: 0, max: 0.25 },
    nitrite_ppm: { min: 0, max: 0.25 },
    nitrate_ppm: { min: 0, max: 30 },
    salinity_ppt: { min: 10, max: 25 },
  },
  planted: {
    temperature_f: { min: 72, max: 80 },
    ph: { min: 6.0, max: 7.5 },
    ammonia_ppm: { min: 0, max: 0.25 },
    nitrite_ppm: { min: 0, max: 0.25 },
    nitrate_ppm: { min: 5, max: 30 }, // Plants need some nitrate
  },
};

export interface WaterParameters {
  temperature_f?: number | null;
  ph?: number | null;
  ammonia_ppm?: number | null;
  nitrite_ppm?: number | null;
  nitrate_ppm?: number | null;
  salinity_ppt?: number | null;
  calcium_ppm?: number | null;
  alkalinity_dkh?: number | null;
  measured_at?: string;
}

export interface MaintenanceTask {
  id: string;
  next_due_date: string;
  completed_at?: string | null;
}

export interface HealthScoreResult {
  overall: number; // 0-100
  parameterScore: number; // 0-100
  maintenanceScore: number; // 0-100
  recencyScore: number; // 0-100
  status: "excellent" | "good" | "fair" | "poor" | "critical";
  statusColor: string;
  parameterIssues: string[];
  maintenanceIssues: string[];
}

/**
 * Calculate health score for a tank
 */
export function calculateHealthScore(
  tankType: string,
  latestParams: WaterParameters | null,
  maintenanceTasks: MaintenanceTask[],
  daysRecommendedBetweenLogs: number = 7
): HealthScoreResult {
  // Get safe ranges for tank type
  const safeRanges = SAFE_RANGES[tankType] || SAFE_RANGES.freshwater;
  const parameterIssues: string[] = [];
  const maintenanceIssues: string[] = [];

  // 1. Parameter Score (50% weight)
  let parameterScore = 100;
  if (latestParams) {
    const paramCount = Object.keys(safeRanges).length;
    let inRangeCount = 0;

    for (const [param, range] of Object.entries(safeRanges)) {
      const value = latestParams[param as keyof WaterParameters] as number | null | undefined;

      if (value === null || value === undefined) {
        // Missing parameter counts as partial (50% credit)
        inRangeCount += 0.5;
      } else if (value >= range.min && value <= range.max) {
        inRangeCount += 1;
      } else {
        // Parameter out of range
        const paramName = formatParamName(param);
        if (value < range.min) {
          parameterIssues.push(`${paramName} is low (${value})`);
        } else {
          parameterIssues.push(`${paramName} is high (${value})`);
        }
      }
    }

    parameterScore = Math.round((inRangeCount / paramCount) * 100);
  } else {
    // No parameter data = 50% score
    parameterScore = 50;
    parameterIssues.push("No recent water parameters logged");
  }

  // 2. Maintenance Score (30% weight)
  let maintenanceScore = 100;
  if (maintenanceTasks.length > 0) {
    const now = new Date();
    const overdueTasks = maintenanceTasks.filter((task) => {
      const dueDate = new Date(task.next_due_date);
      return dueDate < now && !task.completed_at;
    });

    if (overdueTasks.length > 0) {
      // Each overdue task reduces score
      const reduction = Math.min(overdueTasks.length * 20, 80);
      maintenanceScore = 100 - reduction;
      maintenanceIssues.push(`${overdueTasks.length} overdue maintenance task${overdueTasks.length > 1 ? "s" : ""}`);
    }
  } else {
    // No maintenance tasks = neutral (75%)
    maintenanceScore = 75;
  }

  // 3. Recency Score (20% weight)
  let recencyScore = 100;
  if (latestParams?.measured_at) {
    const daysSinceLog = Math.floor(
      (Date.now() - new Date(latestParams.measured_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLog <= daysRecommendedBetweenLogs) {
      recencyScore = 100;
    } else if (daysSinceLog <= daysRecommendedBetweenLogs * 2) {
      recencyScore = 75;
    } else if (daysSinceLog <= daysRecommendedBetweenLogs * 3) {
      recencyScore = 50;
    } else {
      recencyScore = 25;
      parameterIssues.push(`Last parameter log was ${daysSinceLog} days ago`);
    }
  } else {
    recencyScore = 25;
  }

  // Calculate overall score
  const overall = Math.round(
    parameterScore * 0.5 + maintenanceScore * 0.3 + recencyScore * 0.2
  );

  // Determine status
  let status: HealthScoreResult["status"];
  let statusColor: string;

  if (overall >= 90) {
    status = "excellent";
    statusColor = "text-green-600";
  } else if (overall >= 75) {
    status = "good";
    statusColor = "text-green-500";
  } else if (overall >= 60) {
    status = "fair";
    statusColor = "text-amber-500";
  } else if (overall >= 40) {
    status = "poor";
    statusColor = "text-orange-500";
  } else {
    status = "critical";
    statusColor = "text-red-600";
  }

  return {
    overall,
    parameterScore,
    maintenanceScore,
    recencyScore,
    status,
    statusColor,
    parameterIssues,
    maintenanceIssues,
  };
}

/**
 * Get health status badge colors
 */
export function getHealthStatusColors(status: HealthScoreResult["status"]) {
  switch (status) {
    case "excellent":
      return {
        bg: "bg-green-100",
        border: "border-green-200",
        text: "text-green-700",
        fill: "bg-green-500",
      };
    case "good":
      return {
        bg: "bg-green-50",
        border: "border-green-100",
        text: "text-green-600",
        fill: "bg-green-400",
      };
    case "fair":
      return {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-700",
        fill: "bg-amber-500",
      };
    case "poor":
      return {
        bg: "bg-orange-50",
        border: "border-orange-200",
        text: "text-orange-700",
        fill: "bg-orange-500",
      };
    case "critical":
      return {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-700",
        fill: "bg-red-500",
      };
  }
}

function formatParamName(param: string): string {
  const names: Record<string, string> = {
    temperature_f: "Temperature",
    ph: "pH",
    ammonia_ppm: "Ammonia",
    nitrite_ppm: "Nitrite",
    nitrate_ppm: "Nitrate",
    salinity_ppt: "Salinity",
    calcium_ppm: "Calcium",
    alkalinity_dkh: "Alkalinity",
  };
  return names[param] || param;
}
