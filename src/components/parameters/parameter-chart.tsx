"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { format } from "date-fns";

interface DataPoint {
  date: string;
  value: number | null;
}

interface SafeZone {
  min: number;
  max: number;
}

interface WarningZone {
  min: number;
  max: number;
}

interface ParameterChartProps {
  data: DataPoint[];
  parameterName: string;
  unit: string;
  color?: string;
  safeZone?: SafeZone;
  warningZone?: WarningZone;
  height?: number;
}

export function ParameterChart({
  data,
  parameterName,
  unit,
  color = "#3b82f6",
  safeZone,
  warningZone,
  height = 200,
}: ParameterChartProps) {
  // Filter out null values and format dates
  const chartData = data
    .filter((d) => d.value !== null)
    .map((d) => ({
      date: d.date,
      value: d.value,
      formattedDate: format(new Date(d.date), "MMM d"),
    }));

  if (chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-muted/30 rounded-lg"
        style={{ height }}
      >
        <p className="text-sm text-muted-foreground">
          No {parameterName.toLowerCase()} data recorded
        </p>
      </div>
    );
  }

  // Calculate Y-axis domain
  const values = chartData.map((d) => d.value as number);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const padding = (maxValue - minValue) * 0.1 || 1;
  const yMin = Math.floor(minValue - padding);
  const yMax = Math.ceil(maxValue + padding);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { date: string } }> }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3">
          <p className="text-xs text-muted-foreground">
            {format(new Date(dataPoint.date), "MMM d, yyyy h:mm a")}
          </p>
          <p className="text-sm font-semibold">
            {payload[0].value} {unit}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />

        {/* Safe zone (green background) */}
        {safeZone && (
          <ReferenceArea
            y1={safeZone.min}
            y2={safeZone.max}
            fill="#22c55e"
            fillOpacity={0.1}
          />
        )}

        {/* Warning zone above safe */}
        {warningZone && safeZone && (
          <>
            <ReferenceArea
              y1={safeZone.max}
              y2={warningZone.max}
              fill="#eab308"
              fillOpacity={0.1}
            />
            <ReferenceArea
              y1={warningZone.min}
              y2={safeZone.min}
              fill="#eab308"
              fillOpacity={0.1}
            />
          </>
        )}

        {/* Safe zone reference lines */}
        {safeZone && (
          <>
            <ReferenceLine
              y={safeZone.min}
              stroke="#22c55e"
              strokeDasharray="5 5"
              strokeOpacity={0.5}
            />
            <ReferenceLine
              y={safeZone.max}
              stroke="#22c55e"
              strokeDasharray="5 5"
              strokeOpacity={0.5}
            />
          </>
        )}

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
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={{ r: 3, fill: color }}
          activeDot={{ r: 5, fill: color }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
