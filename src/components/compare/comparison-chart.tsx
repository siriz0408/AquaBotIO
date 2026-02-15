"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";

interface DataPoint {
  date: string;
  value: number | null;
}

interface TankData {
  tank: {
    id: string;
    name: string;
    type: string;
    photoUrl: string | null;
  };
  dataPoints: DataPoint[];
  stats: {
    min: number;
    max: number;
    avg: number;
    latest: number;
    trend: "up" | "down" | "stable";
  } | null;
}

interface ComparisonChartProps {
  tanks: TankData[];
  parameter: string;
  height?: number;
}

// Colors for different tank lines
const TANK_COLORS = [
  "#0ea5e9", // brand-cyan
  "#f97316", // orange
  "#8b5cf6", // purple
];

// Parameter display names and units
const PARAMETER_INFO: Record<string, { label: string; unit: string }> = {
  temperature_f: { label: "Temperature", unit: "°F" },
  ph: { label: "pH", unit: "" },
  ammonia_ppm: { label: "Ammonia", unit: " ppm" },
  nitrite_ppm: { label: "Nitrite", unit: " ppm" },
  nitrate_ppm: { label: "Nitrate", unit: " ppm" },
  salinity_ppt: { label: "Salinity", unit: " ppt" },
  calcium_ppm: { label: "Calcium", unit: " ppm" },
  alkalinity_dkh: { label: "Alkalinity", unit: " dKH" },
};

export function ComparisonChart({ tanks, parameter, height = 300 }: ComparisonChartProps) {
  const paramInfo = PARAMETER_INFO[parameter] || { label: parameter, unit: "" };

  // Merge all data points into a unified timeline
  const allDates = new Set<string>();
  tanks.forEach((tank) => {
    tank.dataPoints.forEach((dp) => {
      allDates.add(dp.date.split("T")[0]); // Normalize to date only
    });
  });

  const sortedDates = Array.from(allDates).sort();

  // Create chart data with all tanks' values aligned by date
  const chartData = sortedDates.map((date) => {
    const point: Record<string, string | number | null> = {
      date,
      formattedDate: format(parseISO(date), "MMM d"),
    };

    tanks.forEach((tank, index) => {
      // Find the closest data point for this date
      const dataPoint = tank.dataPoints.find((dp) => dp.date.startsWith(date));
      point[`tank${index}`] = dataPoint?.value ?? null;
    });

    return point;
  });

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; name: string; color: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3">
          <p className="text-xs text-muted-foreground font-medium mb-2">
            {label}
          </p>
          {payload.map((entry, index) => {
            const tankIndex = parseInt(entry.name.replace("tank", ""), 10);
            const tank = tanks[tankIndex];
            if (entry.value === null) return null;
            return (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-medium">{tank?.tank.name}:</span>
                <span>
                  {entry.value?.toFixed(2)}
                  {paramInfo.unit}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-muted/30 rounded-lg"
        style={{ height }}
      >
        <p className="text-sm text-muted-foreground">
          No data available for comparison
        </p>
      </div>
    );
  }

  // Calculate Y-axis domain across all tanks
  const allValues = tanks.flatMap((t) =>
    t.dataPoints.filter((d) => d.value !== null).map((d) => d.value as number)
  );
  const minValue = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 100;
  const padding = (maxValue - minValue) * 0.1 || 1;
  const yMin = Math.floor(minValue - padding);
  const yMax = Math.ceil(maxValue + padding);

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="formattedDate"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
            width={45}
            tickFormatter={(value) => `${value}${paramInfo.unit}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => {
              const tankIndex = parseInt(value.replace("tank", ""), 10);
              return tanks[tankIndex]?.tank.name || value;
            }}
          />
          {tanks.map((_, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={`tank${index}`}
              name={`tank${index}`}
              stroke={TANK_COLORS[index]}
              strokeWidth={2}
              dot={{ r: 3, fill: TANK_COLORS[index] }}
              activeDot={{ r: 5, fill: TANK_COLORS[index] }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Stats Summary */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tanks.map((tank, index) => (
          <div
            key={tank.tank.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
          >
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: TANK_COLORS[index] }}
            />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{tank.tank.name}</p>
              {tank.stats ? (
                <p className="text-xs text-muted-foreground">
                  Avg: {tank.stats.avg.toFixed(2)}{paramInfo.unit} &middot; Latest: {tank.stats.latest.toFixed(2)}{paramInfo.unit}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">No data</p>
              )}
            </div>
            {tank.stats && (
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  tank.stats.trend === "up"
                    ? "bg-green-100 text-green-700"
                    : tank.stats.trend === "down"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {tank.stats.trend === "up" ? "↑" : tank.stats.trend === "down" ? "↓" : "→"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
